import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import * as moment from 'moment-timezone';
import { Schedule, User, ScheduleTrade } from "../shared/models";
import { newGuid } from "../shared/utils";
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { ScheduleDate, MyScheduleRow } from "./schedule-classes";
import { AuthService } from "../shared/services/auth.service";
import { DataService, DialogResult } from "pajama-angular";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";
import { TRADE_STATUS } from "../shared/constants";

@Component({
	selector: 'my-schedule',
	templateUrl: 'my-schedule.component.html',
	styleUrls: ['my-schedule.component.css']
})
export class MyScheduleComponent implements OnInit {

	apiUrl: string;
	loading = false;

	dates: Array<ScheduleDate> = [];
	increments: Array<string> = [];
	incrementInts: Array<number> = [];
	schedules: Array<Schedule>;
	displaySchedules: { [dayName: string]: { [inc: number]: MyScheduleRow } } = {};

	private _startDate: Date;
	get startDate(): Date {
		return this._startDate;
	}
	set startDate(d: Date) {
		this._startDate = d;
		this.dates = [];
		const curr = moment(d);
		while (curr.day() != this.authService.loggedInUser.user.company.weekStart)
			curr.days(curr.days() - 1);
		for (let i = 0; i < 7; i++) {
			const scheduleDate = new ScheduleDate();
			const dt = moment(curr);
			scheduleDate.dateFormatted = moment(dt).format("L");
			scheduleDate.dayName = moment(dt).format("ddd");
			scheduleDate.dayNumber = dt.day();
			scheduleDate.date = dt.toDate();
			this.dates.push(scheduleDate);
			curr.days(curr.days() + 1);
		}
	}

	constructor(public configService: ConfigService, private authService: AuthService, private dataService: AuthDataService,
		private toastr: ToastrService, private dialogService: DialogService) {

		this.startDate = new Date();
		const curr = moment("1900-01-01");
		for (let i = 0; i < 24; i++) {
			const padded = i < 10 ? `0${i}` : i.toString();
			this.increments.push(moment(`1900-01-01 ${padded}:00`).format("LT"));
			if (!this.configService.isMobile)
				this.increments.push(moment(`1900-01-01 ${padded}:30`).format("LT"));
			this.incrementInts.push(i * 10000);
			if (!this.configService.isMobile)
				this.incrementInts.push(i * 10000 + 3000);
		}
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
			const end = new Date(this.startDate);
			end.setDate(end.getDate() + 6);
			this.schedules = (await this.dataService.getItems<Schedule>(`${this.apiUrl}/schedules?start=${moment(this.dates[0].date).format("MM-DD-YYYY")}&end=${moment(this.dates[6].date).format("MM-DD-YYYY")}&forUser=true`).toPromise()).data;
			this.schedules.sort((a, b) => {
				if (a.scheduleDate > b.scheduleDate) return -1;
				if (a.scheduleDate < b.scheduleDate) return 1;
				let aint = parseInt(moment(a.startTime).format("HHmmss"));
				if (aint < 10000) aint += 240000;
				let bint = parseInt(moment(b.startTime).format("HHmmss"));
				if (bint < 10000) bint += 240000;
				return aint - bint;

			})
			this.populateScheduleItems();
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}

	private populateScheduleItems() {
		this.displaySchedules = {};
		for (let i = this.schedules.length - 1; i >= 0; i--) {
			const sched = this.schedules[i];
			const formatted = moment(sched.scheduleDate).format("L");
			let dt = this.dates.find(x => x.dateFormatted == formatted);
			this.displaySchedules[dt.dayName] = {};
			const start = parseInt(moment(sched.startTime).format("HHmmss"));
			let end = parseInt(moment(sched.endTime).format("HHmmss"));
			if (end < 10000) {
				end += 240000;
			}
			if (end < start) {
				const copy = Object.assign({}, sched);
				let dt2 = moment(copy.scheduleDate).add(1, 'day');

				copy.scheduleDate = dt2.toDate();
				const newStartTime = new Date(copy.startTime);
				newStartTime.setHours(0);
				newStartTime.setMinutes(0);
				newStartTime.setSeconds(0);
				copy.startTime = newStartTime;

				const newEndTime = new Date(sched.endTime);
				newEndTime.setHours(0);
				newEndTime.setMinutes(0);
				newEndTime.setSeconds(0);
				sched.endTime = newEndTime;
				this.schedules.push(copy);
				const formatted2 = dt2.format("L");
				if (!this.dates.some(d => d.dateFormatted == formatted2)) {
					let scheduleDate = new ScheduleDate();
					scheduleDate.dateFormatted = formatted2;
					scheduleDate.dayName = dt2.format("ddd");
					scheduleDate.dayNumber = dt2.day();
					scheduleDate.date = dt2.toDate();
					this.dates.push(scheduleDate);
				}
			}
		}
		// for (let sched of this.schedules) {
		for (let i = this.schedules.length - 1; i >= 0; i--) {
			const sched = this.schedules[i];
			const formatted = moment(sched.scheduleDate).format("L");
			let dt = this.dates.find(x => x.dateFormatted == formatted);
			let schedStart = moment(sched.startTime);
			let schedEnd = moment(sched.endTime);
			let j = 1;
			const start = parseInt(schedStart.format("HHmmss"));
			let end = parseInt(schedEnd.format("HHmmss"));
			if (end < 10000) {
				end += 240000;
			}
			for (let k = 0; k < this.incrementInts.length; k++) {
				let inc = this.incrementInts[k];
				if (inc >= start && inc <= end) {
					const existing = this.displaySchedules[dt.dayName][this.increments[k]];
					if (existing && moment(sched.endTime).isBefore(moment(existing.schedule.startTime))) continue;
					this.displaySchedules[dt.dayName][this.increments[k]] = {
						schedule: sched,
						index: j++,
						color: this.getColorForSchedule(sched),
						upForTrade: this.isUpForTrade(sched)
					};
				}
				else {
					j = 1;
				}
			}
		}
	}

	private getColorForSchedule(sched: Schedule) {
		// return this.isUpForTrade(sched) ? '#9191ff' : '#0040ff';
		return sched.task == null || !sched.task.textColor ? '#D3D3D3' : sched.task.textColor;
	}

	private isUpForTrade(sched: Schedule) {
		return sched.scheduleTrades && sched.scheduleTrades.find(st => st.tradeStatus < TRADE_STATUS.APPROVED.value) != null;
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

	async sendSchedules(isText) {
		let scheduleIds = this.schedules.map(s => s.scheduleId);
		const r = await this.dialogService.showYesNoDialog(`Send Schedules`, `Are you sure you want to send the schedules?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				await this.dataService.post(`${this.apiUrl}/sendSchedules`, {
					scheduleIds,
					isText,
				}).toPromise();
				showToastSuccess(this.toastr, "Schedules have been sent.");
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}

	async tradeSchedule(displaySchedule: MyScheduleRow, dayName) {
		const r = await this.dialogService.showYesNoDialog(`Trade Schedule`, `Are you sure you want to trade this schedule?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				await this.dataService.post(`${this.apiUrl}/postTrade`, {
					scheduleId: displaySchedule.schedule.scheduleId
				}).toPromise();
				showToastSuccess(this.toastr, "Schedule has been marked for trade.");
				await this.refreshSchedule();
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}

	formatTime(time) {
		return moment(time).format("LT");
	}
}