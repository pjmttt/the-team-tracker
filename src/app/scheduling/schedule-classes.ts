import { Schedule, User, UserAvailability, LeaveRequest, ScheduleTrade } from "../shared/models";

export class UserSchedule {
	scheduleIds: Array<string> = [];
	dates: { [formattedDate: string]: ScheduleDateItem } = {};
	totalHours: number;
}

export class ScheduleDate {
	date: Date;
	dayName: string;
	dayNumber: number;
	dateFormatted: string;
}

export class ScheduleTradeItem {
	scheduleTrade: ScheduleTrade;
	startEnd: string;
}

export class ScheduleItem {
	schedule: Schedule;
	scheduleId: string;
	startEnd: string;
	isConflict: boolean;
}

export class ScheduleDateItem {
	scheduleItems: Array<ScheduleItem>;
	leaveRequests: Array<LeaveRequest>;
	pendingLeaveRequests: Array<LeaveRequest>;
	availabilities: Array<UserAvailability>;
	pendingAvailabilities: Array<UserAvailability>;
	isConflicted: boolean;
	tradePending: boolean;
}

export class DailyScheduleRow {
	user: User;
	color: string;
	description: string;
	startIncrement: number;
	colspan: number;
	scheduleTime: string;
	quarterHours: Array<number> = [];
}

export class MyScheduleRow {
	schedule: Schedule;
	index: number;
	color: string;
	upForTrade: boolean;
}

export class RowNumberMap {
	taskId: string;
	shiftId: string;
	rowNumber: number;
}