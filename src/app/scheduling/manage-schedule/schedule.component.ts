import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from "@angular/core";
import { AuthDataService } from "../../shared/services/data.service";
import { ConfigService } from "../../shared/services/config.service";
import { ILookups } from "../../shared/interfaces";
import * as moment from 'moment-timezone';
import { Schedule, User, ScheduleTemplate, LeaveRequest, ScheduleTrade, Position } from "../../shared/models";
import { newGuid } from "../../shared/utils";
import { ScheduleDate, UserSchedule, ScheduleItem, ScheduleDateItem, RowNumberMap } from "../schedule-classes";
import { AuthService } from "../../shared/services/auth.service";
import { ScheduleTemplateComponent } from "./schedule-template.component";
import { ScheduleTemplatesComponent } from "./schedule-templates.component";
import { ROLE } from "../../shared/constants";
import { showToastSuccess, showToastError } from "../../shared/toast-helper";
import { DialogService } from "../../shared/services/dialog.service";
import { DialogResult, ModalDialogComponent } from "pajama-angular";
import { ToastrService } from "ngx-toastr";
import { ScheduleBulkComponent } from "./schedule-bulk.component";

@Component({
	selector: 'schedule',
	templateUrl: 'schedule.component.html',
	styleUrls: ['schedule.component.css']
})
export class ScheduleComponent implements OnInit {
	private readonly IS_NEW: string = 'isNew';
	private readonly IS_EDITING: string = 'isEditing';

	weekIsPublished = true;
	lookups: ILookups;
	apiUrl: string;
	loading = false;
	role = ROLE;
	showPrintArea = false;

	scheduleUsers: Array<User> = [];

	dates: Array<ScheduleDate> = [];
	selectedPositions: Array<Position> = [];
	schedules: Array<Schedule> = [];
	scheduleTemplates: Array<ScheduleTemplate>;

	showDragList = false;
	usersSchedules: { [userId: string]: UserSchedule } = {};
	unscheduled: { [formattedDate: string]: { [rowNumber: number]: ScheduleDateItem } } = {};
	unscheduledRowNumbers: Array<number> = [];

	@ViewChild("scheduleTemplatesModal")
	scheduleTemplatesModal: ModalDialogComponent;

	@ViewChild("scheduleTemplateModal")
	scheduleTemplateModal: ModalDialogComponent;

	@ViewChild("splitSchedules")
	splitSchedulesElement: ElementRef;

	@ViewChild("bulkScheduleModal")
	bulkScheduleModal: ModalDialogComponent;

	@ViewChild("bulkScheduleComponent")
	bulkScheduleComponent: ScheduleBulkComponent;


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

	private _scheduleSplitter: any = {};
	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService, private dialogService: DialogService) {
		let start = moment(moment().format("LL"));
		const loggedInUser = this.authService.loggedInUser.user;
		const weekStart = loggedInUser.company.weekStart;
		while (start.day() != weekStart) {
			start.date(start.date() - 1);
		}
		this.startDate = start.toDate();
		try {
			const scheduleSplitterJSON = localStorage.getItem('scheduleSplitter');
			if (scheduleSplitterJSON) {
				this._scheduleSplitter = JSON.parse(scheduleSplitterJSON);
				this.showDragList = this._scheduleSplitter.showDragList;
			}
		}
		catch (e) {
			console.warn(e);
		}
	}

	toggleDragList() {
		this.showDragList = !this.showDragList
		this._scheduleSplitter.showDragList = this.showDragList;
		localStorage.setItem('scheduleSplitter', JSON.stringify(this._scheduleSplitter));
	}

	hasRole(roleId: number): boolean {
		return this.authService.hasRole(roleId);
	}

	async ngOnInit() {
		try {
			this.loading = true;
			this.apiUrl = this.configService.apiUrl;
			this.lookups = await this.dataService.get<ILookups>(`${this.apiUrl}/lookups?lookupType=4&startDate=${moment(this.dates[0].date).format("MM-DD-YYYY")}`).toPromise();
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
			this.lookups = await this.dataService.get<ILookups>(`${this.apiUrl}/lookups?lookupType=4&startDate=${moment(this.dates[0].date).format("MM-DD-YYYY")}`).toPromise();
			const end = new Date(this.startDate);
			end.setDate(end.getDate() + 6);
			this.schedules = (await this.dataService.getItems<Schedule>(`${this.apiUrl}/schedules?start=${moment(this.dates[0].date).format("MM-DD-YYYY")}&end=${moment(this.dates[6].date).format("MM-DD-YYYY")}`).toPromise()).data;
			this.weekIsPublished = this.schedules.some(s => s.userId != null) && !this.schedules.some(s => !s.published && s.userId != null);
			this.populateScheduleItems();
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}

	async tradeSchedule(schedule: Schedule) {
		const r = await this.dialogService.showYesNoDialog(`Trade Schedule`, `Are you sure you want to post this schedule on the trade board?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				await this.dataService.post(`${this.apiUrl}/postTrade`, {
					scheduleId: schedule.scheduleId
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

	cancelSchedule(schedule: Schedule) {
		if (schedule[this.IS_NEW]) {
			const sched = this.schedules.findIndex(s => s[this.IS_NEW] == schedule[this.IS_NEW]);
			this.schedules.splice(sched, 1);
			this.populateScheduleItems();
		}
	}

	getStartEndTimes(item: Schedule) {
		let str = moment(item.startTime).format("LT");
		if (item.endTime) str += ` - ${moment(item.endTime).format("LT")}`;
		return str;
	}

	async saveSchedule(schedule: Schedule) {
		if (!schedule.taskId || !schedule.shiftId || !schedule.startTime || !schedule.endTime) {
			showToastError(this.toastr, "Shift, task, start time and end time required", true);
			return;
		}
		this.loading = true;
		schedule.published = this.weekIsPublished;
		try {
			if (schedule.scheduleId) {
				await this.dataService.put<Schedule, Schedule>(`${this.apiUrl}/schedules/${schedule.scheduleId}`, schedule).toPromise();
			}
			else {
				const created = await this.dataService.post<Schedule, Schedule>(`${this.apiUrl}/schedules`, schedule).toPromise();
				schedule.scheduleId = created.scheduleId;
			}
			schedule[this.IS_NEW] = undefined;
			schedule[this.IS_EDITING] = undefined;
			this.populateScheduleItems();
			showToastSuccess(this.toastr, "Schedule saved.");
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}

	async removeSchedule(sched) {
		const r = await this.dialogService.showYesNoDialog(`Delete Schedule`,
			`Are you sure you want to delete this schedule?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				if (sched.userId) {
					sched.userId = null;
					await this.dataService.put<Schedule, Schedule>(`${this.apiUrl}/schedules/${sched.scheduleId}`, sched).toPromise();
				}
				else {
					await this.dataService.delete(`${this.apiUrl}/schedules/${sched.scheduleId}`).toPromise();
					const ind = this.schedules.findIndex(s => s.scheduleId == sched.scheduleId);
					this.schedules.splice(ind, 1);
				}
				showToastSuccess(this.toastr, "Schedule has been deleted.");
				this.populateScheduleItems();
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}

	bulkSchedule() {
		this.bulkScheduleComponent.schedule = new Schedule();
		this.bulkScheduleModal.show().subscribe(async (r: DialogResult) => {
			if (r == DialogResult.OK) {
				// this.schedules.concat(this.bulkScheduleModal.tag);
				this.bulkScheduleModal.tag = null;
				await this.refreshSchedule();
			}
		});
	}

	private leaveRequestIsInRange(lr: LeaveRequest, date: Date) {
		let startInt = parseInt(moment(new Date(lr.startDate)).format("YYYYMMDD"));
		let endInt = lr.endDate ? parseInt(moment(new Date(lr.endDate)).format("YYYYMMDD")) : -1;
		let compareInt = parseInt(moment(new Date(date)).format("YYYYMMDD"));
		if (startInt == compareInt || endInt == compareInt) return true;
		if (endInt != -1) {
			return startInt < compareInt && endInt > compareInt;
		}
		return false;
	}


	private setUsersSchedule(userId: string) {
		this.usersSchedules[userId] = { dates: {}, scheduleIds: [], totalHours: 0 };
		for (let dts of this.dates) {
			const scheduleDateItem = new ScheduleDateItem();
			scheduleDateItem.scheduleItems = [];
			const lookupUser = this.scheduleUsers.find(u => u.userId == userId);
			if (lookupUser) {
				const leaveRequests = lookupUser.leaveRequests.filter(lr => this.leaveRequestIsInRange(lr, dts.date));
				scheduleDateItem.leaveRequests = leaveRequests.filter(lr => lr.status == 1);

				scheduleDateItem.pendingLeaveRequests = leaveRequests.filter(lr => lr.status == 0);
				const availabilities = lookupUser.userAvailabilitys.filter(a =>
					a.dayOfWeek == dts.dayNumber);
				scheduleDateItem.availabilities = availabilities.filter(a => a.status == 1);
				scheduleDateItem.pendingAvailabilities = availabilities.filter(a => a.status == 0);
			}
			this.usersSchedules[userId].dates[dts.dateFormatted] = scheduleDateItem;
		}
	}

	private populateUnscheduled() {
		this.unscheduled = {};
		let mapped: Array<RowNumberMap> = [];
		this.unscheduledRowNumbers = [];

		const shifts = this.lookups.shifts.slice();
		shifts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
		const tasks = this.lookups.tasks.slice();
		tasks.sort((a, b) => {
			if (a.taskName > b.taskName) return 1;
			if (a.taskName < b.taskName) return -1;
			return 0;
		});
		let j = 1;
		for (let s of shifts) {
			for (let t of tasks) {
				this.unscheduledRowNumbers.push(j);
				mapped.push({ taskId: t.taskId, shiftId: s.shiftId, rowNumber: j });
				j++;
			}
		}

		for (let i = 0; i < this.dates.length; i++) {
			let dt = this.dates[i];
			this.unscheduled[dt.dateFormatted] = {};
			let copy = mapped.slice();
			const unscheded = this.schedules.filter(s => !s.userId && moment(s.scheduleDate).format("L") == dt.dateFormatted);
			unscheded.sort((a, b) => {
				const st = new Date(a.startTime).getTime();
				const et = new Date(b.startTime).getTime();
				if (st != et) return st - et;
				if (a.task.taskName > b.task.taskName) return 1;
				if (a.task.taskName < b.task.taskName) return -1;
				return 0;
			});
			for (let t of unscheded) {
				let j = 0;
				let currInd = copy.findIndex(c => c.shiftId == t.shiftId && c.taskId == t.taskId);
				if (currInd >= 0) {
					j = copy[currInd].rowNumber;
					copy.splice(currInd, 1);
				}
				else {
					j = mapped.length + 1;
					mapped.push({
						shiftId: t.shiftId,
						taskId: t.taskId,
						rowNumber: j
					})
				}
				this.unscheduled[dt.dateFormatted][j] = new ScheduleDateItem();
				this.unscheduled[dt.dateFormatted][j].scheduleItems = [];


				const sd = moment(t.scheduleDate);
				if (sd.day() == (i + this.authService.loggedInUser.user.company.weekStart) % 7) {
					let temp = new ScheduleItem();
					temp.schedule = t;
					temp.startEnd = this.getStartEndTimes(t);
					if (t.scheduleTrades.length > 0) this.unscheduled[dt.dateFormatted][j].tradePending = true;
					this.unscheduled[dt.dateFormatted][j].scheduleItems.push(temp);
					if (this.unscheduledRowNumbers.indexOf(j) < 0)
						this.unscheduledRowNumbers.push(j);
					j++;
				}
			}
		}

		for (let i = this.unscheduledRowNumbers.length - 1; i >= 0; i--) {
			const r = this.unscheduledRowNumbers[i];
			let hasRow = false;
			for (let k in this.unscheduled) {
				if (this.unscheduled[k][r]) {
					hasRow = true;
					break;
				}
			}
			if (!hasRow) {
				this.unscheduledRowNumbers.splice(i, 1);
			}
		}
		if (this.unscheduledRowNumbers.length < 4) {
			for (let i = 1; i <= 4; i++) {
				if (this.unscheduledRowNumbers.length < i) {
					this.unscheduledRowNumbers.push(Math.max(...this.unscheduledRowNumbers) + 1);
				}
			}
		}
	}

	private timeIntVal(date: Date) {
		return parseInt(moment(date).format("HHmm"));
	}

	private populateScheduleItems() {
		this.schedules.sort((a, b) => {
			if (a.startTime > b.startTime) return 1;
			if (a.startTime < b.startTime) return -1;
			if (a.shift && b.shift) {
				let res = a.shift.shiftName.toLowerCase().localeCompare(b.shift.shiftName.toLowerCase());
				if (res != 0) return res;
			}
			if (a.task && b.task) {
				let res = a.task.taskName.toLowerCase().localeCompare(b.task.taskName.toLowerCase());
				if (res != 0) return res;
			}
			if (a.endTime > b.endTime) return 1;
			if (a.endTime < b.endTime) return -1;
			return 0;
		})
		this.populateUnscheduled();
		this.usersSchedules = {};
		this.scheduleUsers = this.lookups.users.filter(u => u.showOnSchedule &&
			(this.selectedPositions.length < 1 || this.selectedPositions.some(p => p.positionId == u.positionId)));
		for (let usr of this.scheduleUsers) {
			this.setUsersSchedule(usr.userId);
		}
		for (let sched of this.schedules.filter(s => s.userId)) {
			const usr = this.lookups.users.find(u => u.userId == sched.userId);
			if (usr != null && this.selectedPositions.length > 0
				&& !this.selectedPositions.some(p => p.positionId == usr.positionId)) {
				continue;
			}
			if (!this.usersSchedules[sched.userId]) {
				this.setUsersSchedule(sched.userId);
			}
			const formatted = moment(sched.scheduleDate).format("L");
			const scheduleDateItem = this.usersSchedules[sched.userId].dates[formatted];

			if (scheduleDateItem) {
				const schedItem = new ScheduleItem();
				let str = moment(sched.startTime).format("LT");
				if (sched.endTime) str += ` - ${moment(sched.endTime).format("LT")}`;
				schedItem.startEnd = str;
				schedItem.schedule = sched;
				schedItem.scheduleId = sched.scheduleId;
				// schedItem.isConflict = scheduleDateItem.availabilities.length > 0 &&
				// 	scheduleDateItem.availabilities.find(a => this.timeIsLessThanGreaterThan(a.startTime, sched.startTime, false)
				// 		&& this.timeIsLessThanGreaterThan(a.endTime, sched.endTime, true)) == null;
				if (scheduleDateItem.availabilities && !scheduleDateItem.availabilities.find(a => a.allDay)) {
					if (scheduleDateItem.availabilities.length <= 0) {
						schedItem.isConflict = true;
					}
					else {
						schedItem.isConflict =
							(scheduleDateItem.availabilities.find(a => this.timeIntVal(a.startTime) <= this.timeIntVal(sched.startTime)
								&& this.timeIntVal(a.endTime) >= this.timeIntVal(sched.endTime)) == null);
					}
				}
				if (!schedItem.isConflict && scheduleDateItem.leaveRequests) {
					for (let lr of scheduleDateItem.leaveRequests) {
						if (new Date(lr.startDate) <= new Date(sched.scheduleDate) && new Date(lr.endDate) >= new Date(sched.scheduleDate)) {
							schedItem.isConflict = true;
							break;
						}

					}
				}
				if (schedItem.isConflict) {
					scheduleDateItem.isConflicted = true;
				}
				scheduleDateItem.scheduleItems.push(schedItem);
				this.usersSchedules[sched.userId].scheduleIds.push(sched.scheduleId);
				let diff = moment(sched.endTime).hours() - moment(sched.startTime).hours();
				if (diff < 0) diff += 24;
				diff -= sched.shift ? sched.shift.lunchDuration : 0;
				this.usersSchedules[sched.userId].totalHours += diff;
			}
		}
	}

	addSchedule(user: User, date: ScheduleDate) {
		const schedule = new Schedule();
		schedule[this.IS_NEW] = newGuid();
		schedule[this.IS_EDITING] = true;
		schedule.userId = user.userId;
		schedule.user = user;
		schedule.scheduleDate = date.date;
		schedule.companyId = user.companyId;
		this.schedules.push(schedule);
		this.populateScheduleItems();
	}

	editSchedule(schedule: Schedule) {
		let editingSchedule = Object.assign({}, schedule);
		this.bulkScheduleComponent.schedule = editingSchedule;
		this.bulkScheduleModal.show().subscribe(async (r: DialogResult) => {
			if (r == DialogResult.OK) {
				// Object.assign(schedule, editingSchedule);
				await new Promise(resolve => setTimeout(resolve, 200));
				await this.refreshSchedule();
			}
			editingSchedule = null;
		});
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

	async dropOnSchedule($event: any, dt: ScheduleDate, user: User) {
		const schedule = <Schedule>$event.dragData;
		if (schedule.scheduleDate && dt && moment(schedule.scheduleDate).format("YYYYMMDD") != moment(dt.date).format("YYYYMMDD")) {
			const r = await this.dialogService.showYesNoDialog(`Move Schedule`, `You are moving the schedule to a different day, continue?`).toPromise();
			if (r != DialogResult.Yes) {
				return;
			}
		}
		schedule.userId = user == null ? null : user.userId;
		schedule.user = user;
		schedule.scheduleDate = dt.date;
		schedule.published = this.weekIsPublished;

		this.loading = true;
		try {
			await this.dataService.put<Schedule, Schedule>(`${this.apiUrl}/schedules/${schedule.scheduleId}`, schedule).toPromise();
			this.populateScheduleItems();
			showToastSuccess(this.toastr, "Schedule saved.");
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
		if (schedule.user && this.weekIsPublished) {
			const sr = await this.dialogService.showYesNoDialog(`Notify`, `Would you like to notify ${user['displayName']}?`).toPromise();
			if (sr == DialogResult.Yes) {
				await this.sendSchedules([schedule.scheduleId], false, true);
				await this.sendSchedules([schedule.scheduleId], true, true);
			}
		}
	}

	async saveTemplate() {
		this.scheduleTemplateModal.show().subscribe();
	}

	async scheduleTemplateSelected(scheduleTemplateId) {
		this.loading = true;
		try {
			await this.dataService.post(`${this.apiUrl}/schedulesFromTemplate/${scheduleTemplateId}`, { forDate: moment(this.startDate).format("L") }).toPromise();
			await this.refreshSchedule();
			this.loading = false;
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	async scheduleTemplateDelete(scheduleTemplateId) {
		this.loading = true;
		await this.dataService.delete(`${this.apiUrl}/scheduleTemplates/${scheduleTemplateId}`).toPromise();
		await this.loadTemplate(true);
	}

	async loadTemplate(modalShown) {
		this.loading = true;
		try {
			const items = await this.dataService.getItems<ScheduleTemplate>(`${this.apiUrl}/scheduleTemplates`).toPromise();
			this.loading = false;
			this.scheduleTemplates = items.data;
			if (!modalShown)
				await this.scheduleTemplatesModal.show().toPromise();
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	async copyPrevious() {
		const r = await this.dialogService.showYesNoDialog(`Copy Schedule`, `Are you sure you want to copy the previous schedule?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				this.loading = true;
				await this.dataService.post(`${this.apiUrl}/schedulesFromPrevious`, { forDate: moment(this.startDate).format("L") }).toPromise();
				this.refreshSchedule();
			}
			catch (e) {
				this.loading = false;
				showToastError(this.toastr, e);
			}
		}
	}

	async sendSchedules(scheduleIds, isText, bypassPrompt = false) {
		if (!scheduleIds) scheduleIds = this.schedules.map(s => s.scheduleId);
		let dlgResult = DialogResult.Yes;
		if (!bypassPrompt) {
			dlgResult = await this.dialogService.showYesNoDialog(`${isText ? 'Text' : 'Email'} Schedules`,
				`Are you sure you want to ${isText ? 'text' : 'email'} employee schedules?`).toPromise();
		}
		if (dlgResult == DialogResult.Yes) {
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

	async publishSchedules() {
		const r = await this.dialogService.showYesNoDialog(`Publish Schedules`,
			`Are you sure you want to publish schedules?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				const schedules = this.schedules.filter(s => !s.published);
				await this.dataService.post(`${this.apiUrl}/publishSchedules`, {
					scheduleIds: schedules.map(s => s.scheduleId),
				}).toPromise();
				showToastSuccess(this.toastr, "Schedules have been published.");
				for (let s of schedules) {
					s.published = true;
				}
				this.weekIsPublished = true;
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}

	async deleteSchedules(unscheduled: boolean) {
		const r = await this.dialogService.showYesNoDialog(`Delete Schedules`, `Are you sure you want to delete ALL schedules?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				for (let dt of this.dates) {
					await this.dataService.post(`${this.apiUrl}/deleteSchedules`, {
						forDate: dt.date,
						unscheduled
					}).toPromise();
				}
				showToastSuccess(this.toastr, "Schedules have been deleted.");
				this.refreshSchedule();
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}

	async removeDate(dt: ScheduleDate) {
		const r = await this.dialogService.showYesNoDialog(`Delete Schedules`, `Are you sure you want to delete all schedules for ${dt.dateFormatted}?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			try {
				await this.dataService.post(`${this.apiUrl}/deleteSchedules`, {
					forDate: dt.date
				}).toPromise();
				showToastSuccess(this.toastr, "Schedules have been deleted.");
				this.refreshSchedule();
			}
			catch (err) {
				showToastError(this.toastr, err);
			}
			this.loading = false;
		}
	}

	dragHandler(event) {
		const splitRect = this.splitSchedulesElement.nativeElement.getBoundingClientRect();
		if (splitRect.top > event.screenY - 120) {
			this.splitSchedulesElement.nativeElement.scrollBy(0, -5)
		}
		else if (event.screenY + 120 > splitRect.bottom) {
			this.splitSchedulesElement.nativeElement.scrollBy(0, 5)
		}
	}

	printPdf() {
		this.showPrintArea = true;
		let style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = `
		@media print {
			@page {
				size: landscape
			}
		}
		`;
		document.getElementsByTagName('head')[0].appendChild(style);

		window.setTimeout(() => {
			window.print();
			window.setTimeout(() => this.showPrintArea = false, 100)
		}, 300);
	}
}