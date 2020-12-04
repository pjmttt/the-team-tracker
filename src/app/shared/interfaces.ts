import { User, Shift, Status, Task, Position, PayRate, AttendanceReason, ProgressChecklist } from './models';

export interface IUserToken {
	accessToken: string;
	user: User;
}

export interface ILookups {
	shifts: Array<Shift>;
	tasks: Array<Task>;
	statuses: Array<Status>;
	users: Array<User>;
	positions: Array<Position>;
	payRates: Array<PayRate>;
	attendanceReasons: Array<AttendanceReason>;
	progressChecklists: Array<ProgressChecklist>;
}