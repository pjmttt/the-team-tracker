// !!!! DON'T MAKE CHANGES HERE, THEY WILL BE OVERWRITTEN !!!!
				
export class Attendance {
	attendanceDate: Date;
	attendanceId: string;
	attendanceReasonId: string;
	comments: string;
	companyId: string;
	updatedBy: string;
	userId: string;
	attendanceReason: AttendanceReason;
	company: Company;
	user: User;
}
export class AttendanceReason {
	attendanceReasonId: string;
	backgroundColor: string;
	companyId: string;
	reasonName: string;
	textColor: string;
	updatedBy: string;
	attendances: Array<Attendance>;
	company: Company;
}
export class Company {
	city: string;
	companyId: string;
	companyName: string;
	country: string;
	expirationDate: Date;
	geoLocation: string;
	ipAddress: string;
	minClockDistance: number;
	minutesBeforeLate: number;
	modules: Array<number>;
	postalCode: string;
	promoCode: string;
	stateProvince: string;
	streetAddress1: string;
	streetAddress2: string;
	subscriptionRequestNumber: string;
	subscriptionTransactionNumber: string;
	timezone: string;
	updatedBy: string;
	weekStart: number;
	attendances: Array<Attendance>;
	attendanceReasons: Array<AttendanceReason>;
	cellPhoneCarriers: Array<CellPhoneCarrier>;
	documents: Array<Document>;
	emailTemplates: Array<EmailTemplate>;
	entrys: Array<Entry>;
	inventoryCategorys: Array<InventoryCategory>;
	inventoryItems: Array<InventoryItem>;
	maintenanceRequests: Array<MaintenanceRequest>;
	payRates: Array<PayRate>;
	positions: Array<Position>;
	progressChecklists: Array<ProgressChecklist>;
	schedules: Array<Schedule>;
	scheduleTemplates: Array<ScheduleTemplate>;
	shifts: Array<Shift>;
	statuss: Array<Status>;
	tasks: Array<Task>;
	users: Array<User>;
	userComments: Array<UserComment>;
	userProgressChecklists: Array<UserProgressChecklist>;
	vendors: Array<Vendor>;
}
export class User {
	cellPhoneCarrierId: string;
	clockedIn: boolean;
	companyId: string;
	email: string;
	emailNotifications: Array<number>;
	enableEmailNotifications: boolean;
	enableTextNotifications: boolean;
	firstName: string;
	forgotPassword: string;
	hireDate: Date;
	isFired: boolean;
	lastActivity: Date;
	lastName: string;
	lastRaiseDate: Date;
	lastReviewDate: Date;
	middleName: string;
	notes: string;
	password: string;
	payRateId: string;
	phoneNumber: string;
	positionId: string;
	roles: Array<number>;
	runningScore: number;
	showOnSchedule: boolean;
	textNotifications: Array<number>;
	updatedBy: string;
	userId: string;
	userName: string;
	wage: number;
	attendances: Array<Attendance>;
	entrys: Array<Entry>;
	enteredByEntrys: Array<Entry>;
	enteredByEntrySubtasks: Array<EntrySubtask>;
	enteredByInventoryTransactions: Array<InventoryTransaction>;
	approvedDeniedByLeaveRequests: Array<LeaveRequest>;
	leaveRequests: Array<LeaveRequest>;
	assignedToMaintenanceRequests: Array<MaintenanceRequest>;
	requestedByMaintenanceRequests: Array<MaintenanceRequest>;
	schedules: Array<Schedule>;
	tradeUserScheduleTrades: Array<ScheduleTrade>;
	approvedDeniedByUserAvailabilitys: Array<UserAvailability>;
	userAvailabilitys: Array<UserAvailability>;
	userClocks: Array<UserClock>;
	userComments: Array<UserComment>;
	userCommentReplys: Array<UserCommentReply>;
	userNotes: Array<UserNote>;
	managerUserProgressChecklists: Array<UserProgressChecklist>;
	userProgressChecklists: Array<UserProgressChecklist>;
	completedByUserProgressItems: Array<UserProgressItem>;
	userTaskQueues: Array<UserTaskQueue>;
	cellPhoneCarrier: CellPhoneCarrier;
	company: Company;
	payRate: PayRate;
	position: Position;
}
export class Shift {
	companyId: string;
	endTime: Date;
	lunchDuration: number;
	shiftId: string;
	shiftName: string;
	startTime: Date;
	updatedBy: string;
	entrys: Array<Entry>;
	schedules: Array<Schedule>;
	company: Company;
}
export class Task {
	companyId: string;
	difficulty: number;
	notifyAfter: number;
	taskId: string;
	taskName: string;
	taskType: number;
	textColor: string;
	updatedBy: string;
	entrys: Array<Entry>;
	schedules: Array<Schedule>;
	subtasks: Array<Subtask>;
	userTaskQueues: Array<UserTaskQueue>;
	company: Company;
}
export class Status {
	abbreviation: string;
	backgroundColor: string;
	companyId: string;
	managerEmailTemplateId: string;
	notifyManagerAfter: number;
	statusId: string;
	statusName: string;
	textColor: string;
	updatedBy: string;
	entrySubtasks: Array<EntrySubtask>;
	userSubtasks: Array<UserSubtask>;
	company: Company;
	managerEmailTemplate: EmailTemplate;
}
export class Subtask {
	sequence: number;
	subtaskId: string;
	subtaskName: string;
	taskId: string;
	updatedBy: string;
	entrySubtasks: Array<EntrySubtask>;
	userSubtasks: Array<UserSubtask>;
	task: Task;
}
export class Entry {
	comments: string;
	companyId: string;
	enteredById: string;
	entryDate: Date;
	entryId: string;
	entryType: number;
	notes: string;
	rating: number;
	shiftId: string;
	taskId: string;
	updatedBy: string;
	userId: string;
	entrySubtasks: Array<EntrySubtask>;
	userEntryQueues: Array<UserEntryQueue>;
	company: Company;
	shift: Shift;
	task: Task;
	user: User;
	enteredBy: User;
}
export class EntrySubtask {
	addressed: boolean;
	comments: string;
	enteredById: string;
	entryId: string;
	entrySubtaskId: string;
	statusId: string;
	subtaskId: string;
	updatedBy: string;
	entry: Entry;
	status: Status;
	subtask: Subtask;
	enteredBy: User;
}
export class UserEntryQueue {
	entryId: string;
	userEntryQueueId: string;
	entry: Entry;
}
export class UserSubtask {
	entrySubtaskIds: Array<string>;
	statusId: string;
	subtaskId: string;
	updatedBy: string;
	userId: string;
	userSubtaskId: string;
	status: Status;
	subtask: Subtask;
}
export class EmailTemplate {
	body: string;
	bodyText: string;
	companyId: string;
	emailTemplateId: string;
	subject: string;
	templateType: number;
	updatedBy: string;
	managerEmailTemplateStatuss: Array<Status>;
	company: Company;
}
export class Position {
	companyId: string;
	positionId: string;
	positionName: string;
	textColor: string;
	updatedBy: string;
	users: Array<User>;
	company: Company;
}
export class UserComment {
	comment: string;
	commentDate: Date;
	companyId: string;
	sendEmail: boolean;
	sendText: boolean;
	subject: string;
	userCommentId: string;
	userId: string;
	userIds: Array<string>;
	userCommentReplys: Array<UserCommentReply>;
	company: Company;
	user: User;
}
export class UserCommentReply {
	replyDate: Date;
	replyText: string;
	updatedBy: string;
	userCommentId: string;
	userCommentReplyId: string;
	userId: string;
	user: User;
	userComment: UserComment;
}
export class UserNote {
	note: string;
	noteDate: Date;
	userId: string;
	userNoteId: string;
	user: User;
}
export class ScheduleTemplate {
	companyId: string;
	scheduleTemplateId: string;
	templateName: string;
	updatedBy: string;
	schedules: Array<Schedule>;
	company: Company;
}
export class InventoryItem {
	companyId: string;
	costOnHand: number;
	expirationDate: Date;
	inventoryCategoryId: string;
	inventoryItemId: string;
	inventoryItemName: string;
	lastUpdated: Date;
	minimumQuantity: number;
	notes: string;
	quantityOnHand: number;
	unitCost: number;
	vendorId: string;
	inventoryTransactions: Array<InventoryTransaction>;
	company: Company;
	inventoryCategory: InventoryCategory;
	vendor: Vendor;
}
export class InventoryTransaction {
	comments: string;
	costPer: number;
	enteredById: string;
	inventoryItemId: string;
	inventoryTransactionId: string;
	quantity: number;
	quantityRemaining: number;
	transactionDate: Date;
	transactionType: number;
	updatedBy: string;
	vendorId: string;
	inventoryItem: InventoryItem;
	enteredBy: User;
	vendor: Vendor;
}
export class LeaveRequest {
	approvedDeniedById: string;
	approvedDeniedDate: Date;
	endDate: Date;
	leaveRequestId: string;
	reason: string;
	startDate: Date;
	status: number;
	updatedBy: string;
	userId: string;
	user: User;
	approvedDeniedBy: User;
}
export class Vendor {
	companyId: string;
	updatedBy: string;
	vendorId: string;
	vendorName: string;
	inventoryItems: Array<InventoryItem>;
	inventoryTransactions: Array<InventoryTransaction>;
	company: Company;
}
export class InventoryCategory {
	categoryName: string;
	companyId: string;
	inventoryCategoryId: string;
	updatedBy: string;
	inventoryItems: Array<InventoryItem>;
	company: Company;
}
export class MaintenanceRequest {
	assignedToId: string;
	comments: string;
	companyId: string;
	isAddressed: boolean;
	maintenanceRequestId: string;
	requestDate: Date;
	requestDescription: string;
	requestedById: string;
	updatedBy: string;
	maintenanceRequestImages: Array<MaintenanceRequestImage>;
	maintenanceRequestReplys: Array<MaintenanceRequestReply>;
	company: Company;
	requestedBy: User;
	assignedTo: User;
}
export class MaintenanceRequestImage {
	imageType: string;
	maintenanceRequestId: string;
	maintenanceRequestImageId: string;
	updatedBy: string;
	maintenanceRequest: MaintenanceRequest;
}
export class MaintenanceRequestReply {
	maintenanceRequestId: string;
	maintenanceRequestReplyId: string;
	replyDate: Date;
	replyText: string;
	updatedBy: string;
	maintenanceRequest: MaintenanceRequest;
}
export class PayRate {
	companyId: string;
	description: string;
	payRateId: string;
	updatedBy: string;
	users: Array<User>;
	company: Company;
}
export class Schedule {
	companyId: string;
	dayOfWeek: number;
	endTime: Date;
	notes: string;
	published: boolean;
	scheduleDate: Date;
	scheduleId: string;
	scheduleTemplateId: string;
	shiftId: string;
	startTime: Date;
	taskId: string;
	updatedBy: string;
	userId: string;
	scheduleTrades: Array<ScheduleTrade>;
	tradeForScheduleScheduleTrades: Array<ScheduleTrade>;
	company: Company;
	scheduleTemplate: ScheduleTemplate;
	shift: Shift;
	task: Task;
	user: User;
}
export class UserAvailability {
	allDay: boolean;
	approvedDeniedById: string;
	approvedDeniedDate: Date;
	dayOfWeek: number;
	endTime: Date;
	markedForDelete: boolean;
	startTime: Date;
	status: number;
	updatedBy: string;
	userAvailabilityId: string;
	userId: string;
	user: User;
	approvedDeniedBy: User;
}
export class ContactUs {
	contactUsId: string;
	message: string;
	userId: string;
}
export class CellPhoneCarrier {
	carrierName: string;
	cellPhoneCarrierId: string;
	companyId: string;
	domain: string;
	updatedBy: string;
	users: Array<User>;
	company: Company;
}
export class UserClock {
	clockInDate: Date;
	clockOutDate: Date;
	notes: string;
	status: number;
	userClockId: string;
	userId: string;
	user: User;
}
export class ScheduleTrade {
	comments: string;
	scheduleId: string;
	scheduleTradeId: string;
	tradeForScheduleId: string;
	tradeStatus: number;
	tradeUserId: string;
	schedule: Schedule;
	tradeForSchedule: Schedule;
	tradeUser: User;
}
export class UserTaskQueue {
	entryIds: Array<string>;
	taskId: string;
	userId: string;
	userTaskQueueId: string;
	task: Task;
	user: User;
}
export class ProgressChecklist {
	checklistName: string;
	companyId: string;
	progressChecklistId: string;
	updatedBy: string;
	progressItems: Array<ProgressItem>;
	userProgressChecklists: Array<UserProgressChecklist>;
	company: Company;
}
export class ProgressItem {
	itemDescription: string;
	progressChecklistId: string;
	progressItemId: string;
	sequence: number;
	updatedBy: string;
	userProgressItems: Array<UserProgressItem>;
	progressChecklist: ProgressChecklist;
}
export class UserProgressChecklist {
	companyId: string;
	completedDate: Date;
	managerId: string;
	progressChecklistId: string;
	startDate: Date;
	updatedBy: string;
	userId: string;
	userProgressChecklistId: string;
	userProgressItems: Array<UserProgressItem>;
	company: Company;
	progressChecklist: ProgressChecklist;
	user: User;
	manager: User;
}
export class UserProgressItem {
	comments: string;
	completedById: string;
	completedDate: Date;
	progressItemId: string;
	updatedBy: string;
	userProgressChecklistId: string;
	userProgressItemId: string;
	progressItem: ProgressItem;
	completedBy: User;
	userProgressChecklist: UserProgressChecklist;
}
export class EmailQueue {
	body: string;
	emailDate: Date;
	emailQueueId: string;
	isText: boolean;
	parentId: string;
	replyTo: string;
	subject: string;
	tos: Array<string>;
	emailQueueAttachments: Array<EmailQueueAttachment>;
}
export class EmailQueueAttachment {
	attachment: any;
	attachmentName: string;
	attachmentType: string;
	emailQueueAttachmentId: string;
	emailQueueId: string;
	emailQueue: EmailQueue;
}
export class Document {
	companyId: string;
	documentId: string;
	documentName: string;
	mimeType: string;
	positions: Array<string>;
	updatedBy: string;
	company: Company;
}
export class DemoRequest {
	companyName: string;
	demoRequestId: string;
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
}
