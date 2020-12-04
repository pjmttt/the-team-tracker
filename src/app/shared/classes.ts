export class EntrySearchParameters {
	startDate: Date;
	endDate: Date;
	notesOnly: boolean;
	users: Array<string>;
	tasks: Array<string>;
	shifts: Array<string>;
	entryType: number;
}
