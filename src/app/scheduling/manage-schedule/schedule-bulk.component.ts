import { Component, ViewChild, ViewContainerRef, Inject, Input } from "@angular/core";
import { DAYS } from "../../shared/constants";
import { Shift, Task, Schedule } from "../../shared/models";
import { NgForm } from "@angular/forms";
import { AuthDataService } from "../../shared/services/data.service";
import { ConfigService } from "../../shared/services/config.service";
import { LeaveRequestComponent } from "../leave-request.component";
import { validateFormFields } from "../../shared/utils";
import { showToastError, showToastSuccess } from "../../shared/toast-helper";
import { AuthService } from "../../shared/services/auth.service";
import { ModalDialogComponent, DialogResult } from "pajama-angular";
import { ILookups } from "../../shared/interfaces";
import { ToastrService } from "ngx-toastr";
import * as moment from 'moment-timezone';

@Component({
	selector: 'schedule-bulk',
	templateUrl: 'schedule-bulk.component.html'
})
export class ScheduleBulkComponent {
	days = DAYS;
	loading = false;
	selectedDays: Array<any> = [];


	schedule: Schedule;
	dayOfWeek: number;

	@ViewChild("form")
	form: NgForm;

	@Input()
	bulkScheduleModal: ModalDialogComponent;

	@Input()
	startDate: Date;

	@Input()
	weekIsPublished: boolean;

	@Input()
	lookups: ILookups;

	constructor(private dataService: AuthDataService, private toastr: ToastrService,
		private configService: ConfigService, private authService: AuthService) {

	}

	shiftChanged() {
		this.schedule.shift = this.lookups.shifts.find(s => s.shiftId == this.schedule.shiftId);
		this.schedule.startTime = new Date(this.schedule.shift.startTime);
		this.schedule.endTime = new Date(this.schedule.shift.endTime);
	}

	taskChanged() {
		this.schedule.task = this.lookups.tasks.find(t => t.taskId == this.schedule.taskId);
	}

	userChanged() {
		this.schedule.user = this.lookups.users.find(u => u.userId == this.schedule.userId);
	}

	async save() {
		const err = validateFormFields(this.form);
		if (err) {
			showToastError(this.toastr, err, true);
			return;
		}

		try {
			this.loading = true;
			const apiUrl = this.configService.apiUrl;
			if (this.schedule.scheduleId) {
				this.dataService.put(`${apiUrl}/schedules/${this.schedule.scheduleId}`, this.schedule).toPromise();
				showToastSuccess(this.toastr, "Schedule updated");
			}
			else {
				const schedules = [];
				const user = this.authService.loggedInUser.user;
				const startOfWeek = moment(this.startDate);
				while (startOfWeek.day() != user.company.weekStart) {
					startOfWeek.day(startOfWeek.day() - 1);
				}
				for (let d of this.selectedDays) {
					const schedule = Object.assign({}, this.schedule);
					schedule.published = this.weekIsPublished;
					let dow = d.value - user.company.weekStart;
					if (dow < 0) {
						dow += 7;
					}
					let schedDate = moment(startOfWeek);
					schedDate.date(schedDate.date() + dow);
					schedule.scheduleDate = schedDate.toDate();
					schedules.push(schedule);
				}
				const createds = await this.dataService.post<Schedule[], Schedule[]>(`${apiUrl}/schedules`, schedules).toPromise();
				for (let c of createds) {
					c.task = this.lookups.tasks.find(t => t.taskId == c.taskId);
					c.shift = this.lookups.shifts.find(s => s.shiftId == c.shiftId);
				}
				this.bulkScheduleModal.tag = createds;
				showToastSuccess(this.toastr, "Schedule created");
			}
			this.schedule = null;
			this.bulkScheduleModal.hide(DialogResult.OK);
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	cancel() {
		this.bulkScheduleModal.hide();
	}
}