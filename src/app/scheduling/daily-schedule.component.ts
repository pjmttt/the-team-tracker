import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import * as moment from 'moment-timezone';
import { Schedule, User } from "../shared/models";
import { ToastrService } from 'ngx-toastr';
import { newGuid } from "../shared/utils";
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { AuthService } from "../shared/services/auth.service";
import { DataService, DialogResult } from "pajama-angular";
import { DialogService } from "../shared/services/dialog.service";
import { DailyScheduleRow } from "./schedule-classes";
import { ROLE } from "../shared/constants";

@Component({
	selector: 'daily-schedule',
	templateUrl: 'daily-schedule.component.html',
	styleUrls: ['daily-schedule.component.css']
})
export class DailyScheduleComponent implements OnInit {

	apiUrl: string;
	loading = false;
	canPrint = false;

	hours: Array<number> = [];
	schedules: Array<Schedule>;
	increments: Array<string> = [];
	dailySchedules: Array<DailyScheduleRow> = [];

	get dateFormatted(): string {
		return moment(this.scheduleDate).format("L");
	}

	scheduleDate: Date;

	constructor(private configService: ConfigService, private authService: AuthService, private dataService: AuthDataService,
		private toastr: ToastrService, private dialogService: DialogService) {

		this.scheduleDate = new Date();
		const curr = moment("1900-01-01");
		for (let i = 0; i < 24; i++) {
			this.hours.push(i);
		}
		this.canPrint = this.authService.hasRole(ROLE.SCHEDULING.value);
	}

	async ngOnInit() {
		try {
			this.loading = true;
			this.apiUrl = this.configService.apiUrl;
			await this.refreshSchedule();
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}

	async refreshSchedule() {
		this.loading = true;
		try {
			const assigned = true; //!this.authService.hasRole(ROLE.SCHEDULING.value);
			this.schedules = (await this.dataService.getItems<Schedule>(`${this.apiUrl}/schedules?start=${moment(this.scheduleDate).format("MM-DD-YYYY")}&end=${moment(this.scheduleDate).format("MM-DD-YYYY")}${assigned ? '&assigned=true' : ''}`).toPromise()).data;
			this.populateScheduleItems();
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}

	private populateScheduleItems() {
		this.dailySchedules = [];
		for (let i = this.schedules.length - 1; i >= 0; i--) {
			const sched = this.schedules[i];
			const curr = new DailyScheduleRow();
			curr.user = sched.user;
			curr.quarterHours = [];
			curr.color = sched.task && sched.task.textColor ? sched.task.textColor : 'gray';
			curr.description = (sched.shift && sched.task ? sched.shift.shiftName + " - " + sched.task.taskName : "");
			this.dailySchedules.push(curr);

			const start = moment(sched.startTime);
			const end = moment(sched.endTime);
			const startInc = Math.round(start.hour() * 4 + (start.minute() / 15));
			const endInc = end.isBefore(start) ? 95 : Math.round(end.hour() * 4 + (end.minute() / 15));
			curr.startIncrement = startInc;
			curr.colspan = endInc - startInc;
			curr.scheduleTime = `${start.format("LT")} - ${end.format("LT")}`;

			for (let i = 0; i < 96; i++) {
				if (i <= startInc || i >= endInc)
				curr.quarterHours.push(i);
			}
		}
	}

	async previous() {
		const dt = moment(this.scheduleDate);
		dt.day(dt.day() - 1);
		this.scheduleDate = dt.toDate();
		await this.refreshSchedule();
	}

	async next() {
		const dt = moment(this.scheduleDate);
		dt.day(dt.day() + 1);
		this.scheduleDate = dt.toDate();
		await this.refreshSchedule();
	}

	async sendSchedules(isText) {
		let scheduleIds = this.schedules.map(s => s.scheduleId);
		const r = await this.dialogService.showYesNoDialog(`${isText ? 'Text' : 'Email'} Schedules`,
			`Are you sure you want to ${isText ? 'text' : 'email'} employee schedules?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				await this.dataService.post(`${this.apiUrl}/sendSchedules`, {
					scheduleIds,
					isText
				}).toPromise();
				showToastSuccess(this.toastr, "Schedules have been emailed.");
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}
}