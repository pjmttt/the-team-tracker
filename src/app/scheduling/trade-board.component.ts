import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from "@angular/core";
import * as moment from 'moment-timezone';
import { UserSchedule, ScheduleDate, ScheduleDateItem, ScheduleItem, ScheduleTradeItem } from "./schedule-classes";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { ToastrService } from "ngx-toastr";
import { DialogService } from "../shared/services/dialog.service";
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { Schedule, User, ScheduleTrade } from "../shared/models";
import { ILookups } from "../shared/interfaces";
import { ModalDialogComponent, GridView, DataColumn, FieldType, Button, SortDirection, ButtonColumn, DialogResult } from "pajama-angular";
import { DAYS, TRADE_STATUS, ROLE } from "../shared/constants";
// import { DialogResult, ModalDialogComponent } from "pajama-angular";

@Component({
	selector: 'trade-board',
	templateUrl: 'trade-board.component.html',
	styleUrls: ['manage-schedule/schedule.component.css']
})
export class TradeBoardComponent implements OnInit {
	NO_USER_ID: string = "NONE";

	apiUrl: string;
	loading = false;

	dates: Array<ScheduleDate> = [];
	usersSchedules: { [userId: string]: { [dateFormatted: string]: Array<ScheduleTradeItem> } } = {};
	scheduleTrades: Array<ScheduleTrade> = [];
	scheduleUsers: Array<User> = [];
	filteredUsers: Array<User> = [];
	mySchedules: Array<Schedule> = [];
	mySchedulesGrid: GridView;
	lookups: ILookups;
	canSchedule: boolean;

	@ViewChild("mySchedulesDialog")
	mySchedulesDialog: ModalDialogComponent;

	private _startDate: Date;
	get startDate(): Date {
		return this._startDate;
	}
	set startDate(d: Date) {
		this._startDate = d;
		this.dates = [];
		const curr = moment(d);
		while (curr.day() != this.authService.loggedInUser.user.company.weekStart) {
			curr.days(curr.days() - 1);
		}
		for (let i = 0; i < 7; i++) {
			const scheduleDate = new ScheduleDate();
			const dt = moment(curr);
			scheduleDate.dateFormatted = moment(dt).format("L");
			scheduleDate.dayName = moment(dt).format("ddd");
			scheduleDate.dayNumber = dt.day()
			scheduleDate.date = dt.toDate();
			this.dates.push(scheduleDate);
			curr.days(curr.days() + 1);
		}
	}

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService, private dialogService: DialogService) {
		this.startDate = new Date();
		this.mySchedulesGrid = new GridView();
		const dowCol = new DataColumn("dayOfWeek").setWidth("120px");
		dowCol.render = (row: Schedule) => DAYS.find(d => d.value == moment(row.scheduleDate).day()).name;
		this.mySchedulesGrid.columns.push(dowCol);
		this.mySchedulesGrid.columns.push(new DataColumn("scheduleDate").setFieldType(FieldType.Date).setSortDirection(SortDirection.Asc).setWidth("100px"));
		this.mySchedulesGrid.columns.push(new DataColumn("startTime").setFieldType(FieldType.Time).setWidth("100px"));
		this.mySchedulesGrid.columns.push(new DataColumn("endTime").setFieldType(FieldType.Time).setWidth("100px"));
		this.mySchedulesGrid.columns.push(new DataColumn("shift.shiftName", "Shift").setWidth("150px"));
		this.mySchedulesGrid.columns.push(new DataColumn("task.taskName", "Task").setWidth("150px"));
		const selectCol = new ButtonColumn();
		selectCol.width = "70px";
		selectCol.class = "btn-link"
		selectCol.text = "Select";
		selectCol.click.subscribe((s: Schedule) => {
			this.mySchedulesDialog.tag = s;
			this.mySchedulesDialog.hide(DialogResult.OK);
		})
		this.mySchedulesGrid.columns.push(selectCol);
	}

	async ngOnInit() {
		try {
			this.canSchedule = this.authService.hasRole(ROLE.SCHEDULING.value);
			this.loading = true;
			this.apiUrl = this.configService.apiUrl;
			this.lookups = await this.dataService.get<ILookups>(`${this.apiUrl}/lookups?lookupType=4&startDate=${moment(this.dates[0].date).format("MM-DD-YYYY")}`).toPromise();
			this.scheduleUsers = this.lookups.users.filter(u => u.userId != this.authService.loggedInUser.user.userId);
			const dummyUser = new User();
			dummyUser.userId = this.NO_USER_ID;
			this.scheduleUsers.push(dummyUser);
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		await this.refreshSchedule();
		this.loading = false;
	}

	async refreshSchedule() {
		this.loading = true;
		try {
			const end = new Date(this.startDate);
			end.setDate(end.getDate() + 6);
			const dateFilter = `start=${moment(this.dates[0].date).format("MM-DD-YYYY")}&end=${moment(this.dates[6].date).format("MM-DD-YYYY")}`;
			this.scheduleTrades = (await this.dataService.getItems<ScheduleTrade>(`${this.apiUrl}/scheduleTrades?${dateFilter}&status=0`).toPromise()).data;
			this.mySchedules = (await this.dataService.getItems<Schedule>(`${this.apiUrl}/schedules?forUser=true&${dateFilter}`).toPromise()).data;
			this.mySchedulesGrid.data = this.mySchedules;
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.populateScheduleItems();
		this.loading = false;
	}

	getStartEndTimes(item: Schedule) {
		let str = moment(item.startTime).format("LT");
		if (item.endTime) str += ` - ${moment(item.endTime).format("LT")}`;
		return str;
	}

	async scheduleConflicts(scheduleTrade, selectedSchedule) {
		const targetSchedule = scheduleTrade.schedule;
		const curr = this.mySchedules.find(s => (!selectedSchedule || s.scheduleId != selectedSchedule.scheduleId) &&
			moment(s.scheduleDate).isSame(moment(targetSchedule.scheduleDate)));

		if (curr) {
			const x1 = parseInt(moment(curr.startTime).format("HHmmss"));
			const x2 = parseInt(moment(curr.endTime).format("HHmmss"));
			const y1 = parseInt(moment(targetSchedule.startTime).format("HHmmss"));
			const y2 = parseInt(moment(targetSchedule.endTime).format("HHmmss"));

			if (Math.max(x1, y1) <= Math.min(x2, y2)) {
				const ynresult = await this.dialogService.showYesNoDialog("Schedule conflict!", "The selected schedule conflicts with one of yours, continue?").toPromise();
				if (ynresult != DialogResult.Yes) return Promise.resolve(false);
			}
		}
		else {
			const ynresult = await this.dialogService.showYesNoDialog("Trade Schedule!", "Are you sure you want to pick up the selected schedule?").toPromise();
			if (ynresult != DialogResult.Yes) return Promise.resolve(false);
		}
		return Promise.resolve(true);
	}

	async pickupTradeSchedule(scheduleTrade: ScheduleTrade, selectedSchedule: Schedule) {
		if (!await this.scheduleConflicts(scheduleTrade, selectedSchedule)) return;

		this.loading = true;
		try {
			await this.dataService.put(`${this.apiUrl}/requestTrade/${scheduleTrade.scheduleTradeId}`, {
				tradeForScheduleId: selectedSchedule ? selectedSchedule.scheduleId : null
			}).toPromise();
			const ind = this.scheduleTrades.findIndex(t => t.scheduleTradeId == scheduleTrade.scheduleTradeId);
			this.scheduleTrades.splice(ind, 1);
			this.populateScheduleItems();
			showToastSuccess(this.toastr, "Schedule trade requested.");
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}

	async pickupSchedule(scheduleTrade: ScheduleTrade) {
		await this.pickupTradeSchedule(scheduleTrade, null);
	}

	async tradeSchedule(scheduleTrade: ScheduleTrade) {
		const result = await this.mySchedulesDialog.show().toPromise();
		if (result != DialogResult.OK) return;

		const selectedSchedule = <Schedule>this.mySchedulesDialog.tag;
		await this.pickupTradeSchedule(scheduleTrade, selectedSchedule);
	}

	async deleteTrade(scheduleTrade: ScheduleTrade) {
		const r = await this.dialogService.showYesNoDialog(`Delete Trade`,
			`Are you sure you want to delete this trade?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				await this.dataService.delete(`${this.apiUrl}/scheduleTrades/${scheduleTrade.scheduleTradeId}`).toPromise();
				showToastSuccess(this.toastr, "Trade has been deleted.");
				await this.refreshSchedule();
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}

	private populateScheduleItems() {
		this.usersSchedules = {};
		this.filteredUsers = [];
		for (let sched of this.scheduleTrades) {
			if (!sched.schedule.userId) {
				sched.schedule.userId = this.NO_USER_ID;
			}
			if (sched.schedule.userId == this.authService.loggedInUser.user.userId) continue;
			if (!this.filteredUsers.find(fu => fu.userId == sched.schedule.userId)) {
				this.filteredUsers.push(this.scheduleUsers.find(u => u.userId == sched.schedule.userId));
			}
			if (!this.usersSchedules[sched.schedule.userId]) {
				this.usersSchedules[sched.schedule.userId] = {};
			}
			const formatted = moment(sched.schedule.scheduleDate).format("L");
			if (!this.usersSchedules[sched.schedule.userId][formatted]) {
				this.usersSchedules[sched.schedule.userId][formatted] = [];
			}
			const schedItem = new ScheduleTradeItem();
			let str = moment(sched.schedule.startTime).format("LT");
			if (sched.schedule.endTime) str += ` - ${moment(sched.schedule.endTime).format("LT")}`;
			schedItem.startEnd = str;
			schedItem.scheduleTrade = sched;
			this.usersSchedules[sched.schedule.userId][formatted].push(schedItem);
		}
	}

	async previous() {
		const dt = new Date(this._startDate);
		dt.setDate(dt.getDate() - 7);
		this.startDate = dt;
		await this.refreshSchedule();
	}

	async next() {
		const dt = new Date(this._startDate);
		dt.setDate(dt.getDate() + 7);
		this.startDate = dt;
		await this.refreshSchedule();
	}
}