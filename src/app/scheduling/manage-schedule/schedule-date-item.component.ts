import { Component, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { ScheduleDateItem } from "../schedule-classes";
import { ILookups } from "../../shared/interfaces";
import { Schedule, UserAvailability, LeaveRequest } from "../../shared/models";
import { ModalDialogComponent, Button } from "pajama-angular";
import * as moment from 'moment-timezone';

@Component({
	selector: 'schedule-date-item',
	templateUrl: 'schedule-date-item.component.html',
	styleUrls: ['schedule.component.css']
})
export class ScheduleDateItemComponent {
	@Input()
	scheduleDateItem: ScheduleDateItem;

	@Input()
	lookups: ILookups;

	@Output()
	removeSchedule = new EventEmitter<Schedule>();

	@Output()
	saveSchedule = new EventEmitter<Schedule>();

	@Output()
	cancelSchedule = new EventEmitter<Schedule>();

	@Output()
	addSchedule = new EventEmitter<any>();

	@Output()
	sendSchedules = new EventEmitter<any>();

	@Output()
	editSchedule = new EventEmitter<any>();

	@Output()
	tradeSchedule = new EventEmitter<Schedule>();

	@Input()
	unscheduled: boolean;

	availabilities: Array<UserAvailability> = [];
	leaveRequests: Array<LeaveRequest> = [];
	pendingAvailabilities: Array<UserAvailability> = [];
	pendingLeaveRequests: Array<LeaveRequest> = [];

	hourPart: number;
	minutePart: number;
	ampm: number;

	shiftChanged(schedule: Schedule) {
		schedule.shift = this.lookups.shifts.find(s => s.shiftId == schedule.shiftId);
		if (!schedule.startTime && schedule.shift && schedule.shift.startTime) {
			schedule.startTime = new Date(schedule.shift.startTime);
		}
		if (!schedule.endTime && schedule.shift && schedule.shift.endTime) {
			schedule.endTime = new Date(schedule.shift.endTime);
		}
	}

	taskChanged(schedule: Schedule) {
		schedule.task = this.lookups.tasks.find(t => t.taskId == schedule.taskId);
	}

	formatTime(time: string) {
		return moment(new Date(time)).format("LT");
	}

	availabilityOpen() {
		this.availabilities = this.scheduleDateItem.availabilities.slice();
	}

	availabilityClose() {
		this.availabilities = [];
	}

	getLRDateRange(lr: LeaveRequest) {
		let startDt = new Date(lr.startDate);
		let str = '';
		if (startDt.getHours() == 0 && startDt.getMinutes() == 0) {
			str = moment(startDt).format("L");
		}
		else {
			str = moment(startDt).format("L LT");
		}

		if (lr.endDate) {
			let endDt = new Date(lr.endDate);
			str += " - ";
			if (endDt.getHours() == 0 && endDt.getMinutes() == 0) {
				str += moment(endDt).format("L");
			}
			else {
				str += moment(endDt).format("L LT");
			}
		}

		return str;
	}

	pendingOpen() {
		this.pendingAvailabilities = this.scheduleDateItem.pendingAvailabilities.slice();
		this.pendingLeaveRequests = this.scheduleDateItem.pendingLeaveRequests.slice();
	}

	pendingClose() {
		this.pendingAvailabilities = [];
		this.pendingLeaveRequests = [];
	}

	leaveRequestOpen() {
		this.leaveRequests = this.scheduleDateItem.leaveRequests.slice();
	}

	leaveRequestClose() {
		this.leaveRequests = [];
	}

	sendSchedulesForDay(isText) {
		this.sendSchedules.emit({
			scheduleIds: this.scheduleDateItem.scheduleItems.map(si => si.scheduleId),
			isText
		});
	}
}