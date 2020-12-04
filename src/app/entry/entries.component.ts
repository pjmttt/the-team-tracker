import { Component, OnInit, ViewChild, NgZone, ViewContainerRef, EventEmitter } from '@angular/core';
import { GridView, ButtonColumn, DataColumn, FieldType, FilterMode, PagingType, GridViewComponent, RowArguments, DetailGridView, SelectColumn, TextAreaColumn, CellArguments, NumericColumn, ModalDialogComponent, DialogResult, TEMP_KEY_FIELD, Items } from 'pajama-angular';
import { SortDirection } from 'pajama-angular';
import { AuthDataService } from '../shared/services/data.service';
import { Entry, Task, User, Shift, Status, EntrySubtask, Subtask } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ILookups } from '../shared/interfaces';
import * as moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { EntryStatusComponent } from './entry-status.component';
import { AuthService } from '../shared/services/auth.service';
import { ROLE } from '../shared/constants';
import { NotifyStatusChangedComponent } from './notify-status-changed.component';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { DialogService } from '../shared/services/dialog.service';
import { GridViewContainerComponent } from '../shared/gridview-container.component';
import { EntrySearchParameters } from '../shared/classes';
import { getGridQueryString } from '../shared/utils';

@Component({
	selector: 'entries',
	templateUrl: './entries.component.html',
})
export class EntriesComponent implements OnInit {
	lookups: ILookups;
	selectedDate = new Date();
	gridEntries: GridView;
	viewType = 0;
	forUser = false;
	loading = false;
	entryType = 0;
	startDate: Date;
	endDate: Date;
	suburl = 'entries';
	notesOnly = false;
	selectedTasks: Array<Task> = [];
	selectedUsers: Array<User> = [];
	selectedShifts: Array<Shift> = [];
	selectedStatuses: Array<Status> = [];
	private _shiftCol: SelectColumn;
	private _statusCol: SelectColumn;
	private _taskCol: SelectColumn;
	private _userCol: SelectColumn;
	private _entryDateCol: DataColumn;
	private _enteredByCol: SelectColumn;
	private _subtaskEnteredByCol: SelectColumn;

	@ViewChild(GridViewContainerComponent)
	gridEntriesContainer: GridViewContainerComponent;

	get gridEntriesComponent(): GridViewComponent {
		if (this.gridEntriesContainer == null) return null;
		return this.gridEntriesContainer.gridViewComponent;
	}

	@ViewChild("notifyStatusChangedModal")
	notifyStatusChangedModal: ModalDialogComponent;

	private statusClasses: { [name: string]: string } = {};
	apiUrl: string;
	entry: Entry;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private router: Router,
		private toastr: ToastrService, private route: ActivatedRoute,
		private authService: AuthService, private dialogSerice: DialogService) {
		this.forUser = this.route.snapshot.data[0] && this.route.snapshot.data[0].forUser;
		this.entryType = this.route.snapshot.data[0].entryType;
		this.suburl = this.entryType == 0 ? 'entries' : 'generalentries';
		this.initGrid();

	}

	private getForInsertUpdate(raw: Entry): Entry {
		const entry = Object.assign({}, raw);
		delete entry.enteredBy;
		delete entry.shift;
		delete entry.task;
		delete entry.user;
		entry.entrySubtasks = [];
		if (raw.entrySubtasks) {
			for (let rawes of raw.entrySubtasks) {
				const es = Object.assign({}, rawes);
				delete es.enteredBy;
				delete es.status;
				delete es.subtask;
				entry.entrySubtasks.push(es);
			}
		}

		return entry;
	}

	private initGrid() {
		this.gridEntries = new GridView();
		this.gridEntries.pagingType = PagingType.Disabled;
		this.gridEntries.allowEdit = !this.forUser;
		this.gridEntries.allowDelete = !this.forUser;
		this.gridEntries.name = "gridHours";
		if (this.gridEntries.allowEdit) {
			this.gridEntries.rowSave.subscribe((r: RowArguments) => {
				const entry = <Entry>r.row;
				if (this.entryType == 0) {
					if (entry.entrySubtasks && entry.entrySubtasks.find((et) => et.status != null)) {
						// for (let et of entry.entrySubtasks) {
						// 	if (!et.status) {
						// 		showToastError(this.toastr, `Status required for all subtasks`, true);
						// 		r.cancel = true;
						// 		return;
						// 	}
						// }
					}
					else {
						entry.entrySubtasks = [];
					}
				}
				this.saveRow(entry);
			});
			this.gridEntries.rowCreate.subscribe((args: RowArguments) => {
				args.row.enteredById = this.authService.loggedInUser.user.userId;
			})
			this.gridEntries.rowInvalidated.subscribe((columns: DataColumn[]) => {
				showToastError(this.toastr, `The following fields are required: ${columns.map(c => c.caption, true).join(', ')}`);
			});
			this.gridEntries.rowEdit.subscribe((args: RowArguments) => {
				if (this.entryType == 0) {
					const dgv = this.gridEntriesComponent.detailGridViewComponents[args.row["_tmp_key_field"]];
					for (let d of dgv.detailGridViewInstance.data) {
						dgv.gridViewComponent.editingRows[d["_tmp_key_field"]] = Object.assign({}, d);
					}
				}
			});
			this.gridEntries.rowDelete.subscribe((args: RowArguments) => {
				this.loading = true;
				this.dataService.delete(`${this.apiUrl}/${this.suburl}/${args.row.entryId}`).subscribe(() => {
					this.loading = false;
					showToastSuccess(this.toastr, `Entry has been deleted`);
					// const ind = this.gridEntries.data.findIndex(e => e.entryId == args.row.entryId);
					// this.gridEntries.data.splice(ind, 1);
				}, (e) => {
					this.loading = false;
					showToastError(this.toastr, e);
				});
			});
		}
		if (this.entryType == 0)
			this.gridEntries.customEvents["statusChanged"] = new EventEmitter<any>();
		this._entryDateCol = new DataColumn("entryDate", "Date");
		this._entryDateCol.width = "85px";
		this._entryDateCol.fieldType = FieldType.Date;
		this._entryDateCol.visible = false;
		this._entryDateCol.sortable = true;
		this._entryDateCol.readonly = true;
		this.gridEntries.columns.push(this._entryDateCol);

		if (!this.forUser) {
			this._userCol = new SelectColumn("userId", "Employee");
			this._userCol.width = "140px";
			this._userCol.displayMember = "displayName";
			this._userCol.valueMember = "userId";
			this._userCol.parentField = "user";
			// this._userCol.required = true;
			this._userCol.sortable = true;
			this.gridEntries.columns.push(this._userCol);
		}

		if (this.entryType == 0) {
			this._shiftCol = new SelectColumn("shiftId", "Shift");
			this._shiftCol.width = "100px";
			this._shiftCol.displayMember = "shiftName";
			this._shiftCol.valueMember = "shiftId";
			this._shiftCol.parentField = "shift";
			this._shiftCol.required = true;
			this._shiftCol.sortable = true;
			this.gridEntries.columns.push(this._shiftCol);
		}

		this._taskCol = new SelectColumn("taskId", "Task");
		this._taskCol.width = this.entryType == 1 ? "400px" : (this.forUser ? "180px" : "160px");
		this._taskCol.displayMember = "taskName";
		this._taskCol.valueMember = "taskId";
		this._taskCol.parentField = "task";
		this._taskCol.name = "taskCol";
		this._taskCol.required = true;
		this._taskCol.sortable = true;
		this.gridEntries.columns.push(this._taskCol);

		if (this.entryType == 0) {
			const statusDisplayCol = new DataColumn(null, "Status");
			statusDisplayCol.width = "130px";
			statusDisplayCol.readonly = true;
			statusDisplayCol.template = EntryStatusComponent;
			statusDisplayCol.editTemplate = EntryStatusComponent;
			statusDisplayCol.getRowCellClass = () => "statuses-cell";
			this.gridEntries.columns.push(statusDisplayCol);
		}

		this._enteredByCol = new SelectColumn("enteredById", "Entered By");
		this._enteredByCol.width = this.forUser ? "160px" : "140px";
		this._enteredByCol.displayMember = "displayName";
		this._enteredByCol.valueMember = "userId";
		this._enteredByCol.parentField = "enteredBy";
		this._enteredByCol.readonly = true;
		this.gridEntries.columns.push(this._enteredByCol);

		if (this.entryType == 1) {
			const ratingCol = new DataColumn("rating", "Rating (0-5)").setFieldType(FieldType.Numeric).setWidth("90px").setName("ratingCol");
			this.gridEntries.columns.push(ratingCol);
			const scoreCol = new DataColumn(null, "Total Score").setWidth("90px").setReadOnly();
			scoreCol.render = (row: Entry) => {
				if (!row.task || !row.task.difficulty || !row.rating) return "";
				return (row.task.difficulty * row.rating).toString();
			}
			this.gridEntries.columns.push(scoreCol);
			this.gridEntries.cellValueChanged.subscribe((args: CellArguments) => {
				if (args.column.name && args.column.name == this._taskCol.name) {
					args.row.task = this.lookups.tasks.find(t => t.taskId == args.row.taskId);
				}
				else if (args.column.name && args.column.name == ratingCol.name) {
					if (args.row.rating > 5) {
						args.row.rating = 5;
					}
					if (args.row.rating < 0) {
						args.row.rating = 0;
					}
				}
			});
		}

		this.gridEntries.columns.push(new TextAreaColumn("comments"));

		if (!this.forUser && this.entryType == 0) {
			const notesCol = new TextAreaColumn("notes");
			notesCol.printVisible = false;
			this.gridEntries.columns.push(notesCol);
			const sendCol = new ButtonColumn();
			sendCol.text = "Send";
			sendCol.width = "50px";
			sendCol.getRowCellClass = (row: Entry) => {
				if (!row.entrySubtasks || !row.entrySubtasks.length || row.entrySubtasks.some(s => !s.statusId))
					return 'hide-me';
				return '';
			}
			sendCol.click.subscribe((row: Entry) => {
				this.emailEntries([row]);
			});
			this.gridEntries.columns.push(sendCol);
		}

		if (this.entryType == 0) {
			this.gridEntries.cellValueChanged.subscribe((args: CellArguments) => {
				if (args.column.name && args.column.name == this._taskCol.name) {
					const dgv = this.gridEntriesComponent.detailGridViewComponents[args.row['_tmp_key_field']];
					const allEntrySubtasks = this.getEntrySubtasksForGrid(args.row);
					dgv.detailGridViewInstance.data = allEntrySubtasks;
					dgv.detailGridViewInstance.refreshData();
					args.row.task = this.lookups.tasks.find(t => t.taskId == args.row.taskId);
				}
			});

			this.gridEntries.rowCancelled.subscribe((args: RowArguments) => {
				const dgv = this.gridEntriesComponent.detailGridViewComponents[args.row['_tmp_key_field']];
				const entry = <Entry>args.row;
				if (!entry.entrySubtasks || !entry.entrySubtasks.some(es => es.entrySubtaskId != null)) {
					const allEntrySubtasks = this.getEntrySubtasksForGrid(args.row);

					dgv.detailGridViewInstance.data = allEntrySubtasks;
					dgv.detailGridViewInstance.refreshData();
					args.row.task = this.lookups.tasks.find(t => t.taskId == args.row.taskId);
				}
			});

			const detailGridView = new DetailGridView();
			detailGridView.showHeader = false;
			detailGridView.allowEdit = true;
			detailGridView.allowDelete = false;
			detailGridView.pagingType = PagingType.Disabled;
			detailGridView.visible = false;
			detailGridView.hideExpandButton = true;

			const seqColumn = new DataColumn("subtask.sequence", "Seq").setFieldType(FieldType.Numeric);
			seqColumn.readonly = true;
			seqColumn.width = "60px";
			seqColumn.render = (row: EntrySubtask) => {
				if (row["dummy"]) {
					return 'Addressed:';
				}
				return row.subtask ? row.subtask.sequence.toString() : '';
			}
			seqColumn.setSortDirection(SortDirection.Asc);
			detailGridView.columns.push(seqColumn);

			detailGridView.columns.push(new DataColumn("addressed").setFieldType(FieldType.Boolean).setWidth("40px").setName("addressed"));

			const subTaskNameColumn = new DataColumn("subtask.subtaskName", "Subtask");
			subTaskNameColumn.readonly = true;
			subTaskNameColumn.width = "150px";
			subTaskNameColumn.getRowCellClass = ((row: EntrySubtask) => {
				if (!row.subtask.subtaskId) {
					return 'font-bold-italic';
				}
				return '';
			})
			detailGridView.columns.push(subTaskNameColumn);

			this._statusCol = new SelectColumn("statusId", "Status");
			this._statusCol.width = "110px";
			this._statusCol.valueMember = "statusId";
			this._statusCol.displayMember = "statusName";
			this._statusCol.name = "statusColumn";
			this._statusCol.getRowCellStyle = (row: EntrySubtask) => {
				if (!row.status) return null;
				const style: any = {};
				if (row.status.textColor) {
					style.color = row.status.textColor;
				}
				if (row.status.backgroundColor) {
					style.backgroundColor = row.status.backgroundColor;
				}
				return style;
			}
			detailGridView.columns.push(this._statusCol);

			this._subtaskEnteredByCol = new SelectColumn("enteredById", "Entered By");
			this._subtaskEnteredByCol.displayMember = "displayName";
			this._subtaskEnteredByCol.valueMember = "userId";
			this._subtaskEnteredByCol.parentField = "enteredBy";
			this._subtaskEnteredByCol.readonly = true;
			this._subtaskEnteredByCol.width = "130px";
			detailGridView.columns.push(this._subtaskEnteredByCol);

			const subcommentsColumn = new TextAreaColumn("comments");
			subcommentsColumn.rows = 1;
			subcommentsColumn.getRowCellClass = (row: EntrySubtask) => {
				if (!row.subtask.subtaskId) {
					return 'hidden-column';
				}
				return 'textarea-column';
			};
			detailGridView.columns.push(subcommentsColumn);
			detailGridView.dataChanged.subscribe((d) => {
				const dgv = <DetailGridView>d;
				const parentKey = dgv.parentRow["_tmp_key_field"];
				if (this.gridEntriesComponent.editingRows[parentKey]) {
					const dgvComponent = this.gridEntriesComponent.detailGridViewComponents[parentKey];
					for (let row of dgv.data) {
						dgvComponent.gridViewComponent.editRow(row);
					}
				}
			});
			detailGridView.rowSave.subscribe((args: RowArguments) => {
				// parent will take care
				args.cancel = true;
			});
			detailGridView.getChildData = (parent: any) => {
				const entry = <Entry>parent;
				let allEntrySubtasks: Array<EntrySubtask> = [];
				if (entry.entrySubtasks && entry.entrySubtasks.length > 0) {
					const dummy = new EntrySubtask();
					dummy["dummy"] = true;
					dummy.subtask = new Subtask();
					dummy.subtask.subtaskName = "All";
					dummy.subtask.sequence = -100;
					dummy.entryId = entry.entryId;
					allEntrySubtasks.push(dummy);
					allEntrySubtasks = allEntrySubtasks.concat(entry.entrySubtasks);
				}
				else if (entry.task) {
					allEntrySubtasks = this.getEntrySubtasksForGrid(entry);
				}
				return new Observable(o => o.next(allEntrySubtasks));
			}
			detailGridView.cellValueChanged.subscribe((args: CellArguments) => {
				if (args.column && (args.column.name == this._statusCol.name || args.column.name == "addressed")) {
					const entrySubtask = <EntrySubtask>args.row;
					if (args.column.name == this._statusCol.name) {
						const user = this.authService.loggedInUser.user;
						if (args.row["dummy"]) {
							for (let d of args.parentGridView.data) {
								const est = <EntrySubtask>d;
								if (est.statusId && est.enteredById) continue;
								est.statusId = args.row.statusId;
								est.status = this.lookups.statuses.find(s => s.statusId == args.row.statusId);
								est.enteredBy = user;
								est.enteredById = user.userId;
							}
							entrySubtask.statusId = null;
						}
						else {
							entrySubtask.status = this.lookups.statuses.find(s => s.statusId == args.row.statusId);
						}
						if (entrySubtask.enteredById && entrySubtask.enteredById != user.userId) {
							entrySubtask["enteredByChanged"] = true;
						}
						(<EntrySubtask>args.row).enteredBy = user;
						(<EntrySubtask>args.row).enteredById = user.userId;
						(<EventEmitter<any>>this.gridEntries.customEvents["statusChanged"]).emit(args.row);
					}
					else if (args.row["dummy"]) {
						for (let d of args.parentGridView.data) {
							d.addressed = args.row.addressed;
						}
					}
				}
			});
			detailGridView.getRowClass = (row: any) => {
				if (row["dummy"] && row.entryId) {
					const row2 = this.gridEntriesComponent.displayData.find(d => d.entryId == row.entryId);
					if (!this.gridEntriesComponent.editingRows[row2["_tmp_key_field"]]) {
						return 'hide-row';
					}
					// if (row.entrySubtasks.find(es => es.statusId != null)) {
					// 	return 'hide-row';
					// }
				}
				return '';
			}
			this.gridEntries.detailGridView = detailGridView;
		}
	}

	private getEntrySubtasksForGrid(entry: Entry): Array<EntrySubtask> {
		entry.entrySubtasks = [];
		const allEntrySubtasks = [];
		const dummy = new EntrySubtask();
		dummy["dummy"] = true;
		dummy.subtask = new Subtask();
		dummy.subtask.subtaskName = "All";
		dummy.subtask.sequence = -100;
		dummy.entryId = entry.entryId;
		allEntrySubtasks.push(dummy);
		for (let st of this.lookups.tasks.find(t => t.taskId == entry.taskId).subtasks) {
			const est = new EntrySubtask();
			est.subtask = st;
			est.subtaskId = st.subtaskId;
			entry.entrySubtasks.push(est);
			allEntrySubtasks.push(est);
		}
		return allEntrySubtasks;
	}

	private async emailEntries(rows: Entry[]) {
		const r = await this.dialogSerice.showYesNoDialog("Send reports", `Are you sure you want to send duty report(s)?`).toPromise();
		if (r != DialogResult.Yes) return;

		try {
			const entryIds = [];
			for (let row of rows) {
				let toSend = row;
				if (this.gridEntriesComponent.editingRows[row[TEMP_KEY_FIELD]] ||
					this.gridEntriesComponent.newRows[row[TEMP_KEY_FIELD]]) {
					toSend = await this.saveRow(row);
					delete this.gridEntriesComponent.editingRows[row[TEMP_KEY_FIELD]];
					delete this.gridEntriesComponent.newRows[row[TEMP_KEY_FIELD]];
				}
				const subtasks = toSend.entrySubtasks || row.entrySubtasks;
				if (!subtasks || subtasks.length < 1 || subtasks.some(s => s.statusId == null)) continue;
				entryIds.push(toSend.entryId);
			}
			this.loading = true;
			await (this.dataService.post(`${this.apiUrl}/sendEntries`, {
				entryIds
			})).toPromise();

			this.loading = false;
			showToastSuccess(this.toastr, `Duties have been sent`);
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	private async saveRow(row: Entry): Promise<Entry> {
		let observable: Observable<Entry>;
		if (!row.entryDate) {
			row.entryDate = this.selectedDate;
		}
		const toInsertUpdate = this.getForInsertUpdate(row);
		if (toInsertUpdate.entryId) {
			observable = this.dataService.put(`${this.apiUrl}/${this.suburl}/${toInsertUpdate.entryId}`, toInsertUpdate);
		}
		else {
			observable = this.dataService.post(`${this.apiUrl}/${this.suburl}`, toInsertUpdate);
		}
		this.loading = true;
		try {
			const e = await observable.toPromise();
			row.entryId = e.entryId;
			row.companyId = e.companyId;
			if (this.entryType == 0) {
				const dgv = this.gridEntriesComponent.detailGridViewComponents[row["_tmp_key_field"]];
				if (row.entrySubtasks && row.entrySubtasks.length > 0 && dgv.detailGridViewInstance.data) {
					for (let i = dgv.detailGridViewInstance.data.length - 1; i >= 0; i--) {
						const d = dgv.detailGridViewInstance.data[i];
						d.entryId = e.entryId;
						// if (d["dummy"])
						// 	dgv.detailGridViewInstance.data.splice(i, 1);
						// else
						delete dgv.gridViewComponent.editingRows[d["_tmp_key_field"]];
					}
				}
				else {
					dgv.detailGridViewInstance.data = this.getEntrySubtasksForGrid(row);
				}
				dgv.detailGridViewInstance.refreshData();
			}
			this.loading = false;
			showToastSuccess(this.toastr, `${this.entryType == 0 ? 'Entry' : 'Task'} has been saved`);
			if (row.entrySubtasks)
				this.checkChanged(row);
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
			this.gridEntriesComponent.editRow(row);
		}
		return row;
	}

	private checkChanged(entry: Entry) {
		let changed = false;
		for (let st of entry.entrySubtasks) {
			if (st["enteredByChanged"]) {
				changed = true;
				delete st["enteredByChanged"];
			}

		}
		if (changed) {
			this.entry = entry;
			this.notifyStatusChangedModal.show().subscribe(() => {
				this.entry = null;
			});
		}
	}

	async ngOnInit() {
		this.loading = true;
		this.apiUrl = this.configService.apiUrl;
		try {
			this.lookups = await this.dataService.get<ILookups>(`${this.apiUrl}/lookups?lookupType=${this.entryType}`).toPromise();
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
			return;
		}
		this._taskCol.selectOptions = this.lookups.tasks;
		this._enteredByCol.selectOptions = this.lookups.users;

		if (!this.forUser)
			this._userCol.selectOptions = this.lookups.users;

		if (this.entryType == 0) {
			this._subtaskEnteredByCol.selectOptions = this.lookups.users;
			this._statusCol.selectOptions = this.lookups.statuses;
			this._shiftCol.selectOptions = this.lookups.shifts;
		}
		await this.refreshGrid();
	}

	async viewTypeChanged() {
		if (this.viewType == 1) {
			this.gridEntries.pagingType = PagingType.Manual;
			this.gridEntries.pageSize = 25;
			this.gridEntries.disableAutoSort = true;
		}
		else {
			this.gridEntries.pagingType = PagingType.Disabled;
			this.gridEntries.pageSize = 0;
			this.gridEntries.disableAutoSort = false;
		}
		await this.refreshGrid();
	}

	async refreshGrid(resetDate = false, resetPage = false) {
		this.loading = true;
		this.gridEntries.showNoResults = false;
		if (this.viewType != 1)
			this.gridEntries.data = [];
		this._entryDateCol.visible = this.forUser || this.viewType == 1;
		if (resetDate) this.selectedDate = new Date();
		if (resetPage) this.gridEntries.currentPage = 1;
		let startDt: Date;
		let endDt: Date;
		let searchParams: EntrySearchParameters;
		if (this.viewType == 1) {
			searchParams = new EntrySearchParameters();
			searchParams.notesOnly = this.notesOnly;
			searchParams.users = this.selectedUsers.map(u => u.userId);
			searchParams.shifts = this.selectedShifts.map(s => s.shiftId);
			searchParams.tasks = this.selectedTasks.map(t => t.taskId);
			// searchParams.statuses = this.selectedStatuses.map(s => s.statusId);
			searchParams.startDate = this.startDate;
			searchParams.endDate = this.endDate;
			searchParams.entryType = this.entryType;
		}
		else {
			startDt = new Date(this.selectedDate);
			endDt = new Date(this.selectedDate);
			if (this.forUser) {
				startDt.setMonth(startDt.getMonth() - 1);
			}
		}
		try {
			if (this.somethingThere) {
				if (this.viewType == 1) {
					const entries = await this.dataService.post<EntrySearchParameters, Items<Entry>>(`${this.apiUrl}/searchEntries?${getGridQueryString(this.gridEntries)}`, searchParams).toPromise();
					this.gridEntries.data = entries.data;
					this.gridEntries.totalRecords = entries.count;
					if (this.notesOnly) {
						this.gridEntries.data = this.gridEntries.data.filter(e => e.notes != '');
					}
				}
				else {
					const entries = await this.dataService.getItems<Entry>(`${this.apiUrl}/${this.suburl}?start=${moment(startDt).format("MM-DD-YYYY")}&end=${moment(endDt).format("MM-DD-YYYY")}${this.forUser ? '&forUser=true' : ''}`).toPromise();
					this.gridEntries.data = entries.data;
				}
			}
			else {
				this.gridEntries.data = [];
			}
			this.gridEntries.showNoResults = true;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	async previousDay() {
		let dt = new Date(this.selectedDate);
		dt.setDate(dt.getDate() - 1);
		this.selectedDate = dt;
		await this.refreshGrid();
	}

	async nextDay() {
		let dt = new Date(this.selectedDate);
		dt.setDate(dt.getDate() + 1);
		this.selectedDate = dt;
		await this.refreshGrid();
	}

	openEntry(id) {
		this.router.navigate(['entry', id]);
	}

	private get somethingThere(): boolean {
		if (this.viewType == 0) return true;
		if (this.startDate) return true;
		if (this.endDate) return true;
		if (this.selectedUsers.length > 0) return true;
		if (this.selectedTasks.length > 0) return true;
		if (this.entryType == 0) {
			if (this.selectedShifts.length > 0) return true;
			if (this.selectedStatuses.length > 0) return true;
		}
		return false;
	}

	async populateFromSchedule() {
		const r = await this.dialogSerice.showYesNoDialog("Populate from schedule", `Are you sure you want to populate entries from today's schedule?`).toPromise();
		if (r != DialogResult.Yes) return;
		this.loading = true;
		await this.dataService.post(`${this.apiUrl}/entriesFromSchedule`, { forDate: moment(this.selectedDate).format("MM/DD/YYYY") }).toPromise();
		await this.refreshGrid();
	}
}
