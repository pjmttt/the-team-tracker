import { Component, OnInit, ViewChild, NgZone, ViewContainerRef, EventEmitter } from '@angular/core';
import { GridView, ButtonColumn, DataColumn, FieldType, FilterMode, PagingType, GridViewComponent, RowArguments, DetailGridView, SelectColumn, TextAreaColumn, CellArguments, NumericColumn, ModalDialogComponent, DialogResult } from 'pajama-angular';
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

@Component({
	selector: 'available-extras',
	templateUrl: './available-extras.component.html',
})
export class AvailableExtrasComponent implements OnInit {
	lookups: ILookups;
	gridEntries: GridView;
	loading = false;
	private _taskCol: SelectColumn;

	@ViewChild(GridViewContainerComponent)
	gridEntriesContainer: GridViewContainerComponent;

	get gridEntriesComponent(): GridViewComponent {
		if (this.gridEntriesContainer == null) return null;
		return this.gridEntriesContainer.gridViewComponent;
	}

	apiUrl: string;
	entry: Entry;
	canEdit = false;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private router: Router,
		private toastr: ToastrService, private route: ActivatedRoute,
		private authService: AuthService, private dialogService: DialogService) {
		this.canEdit = this.authService.loggedInUser.user.roles.indexOf(ROLE.MANAGER.value) >= 0;
		this.initGrid();

	}

	private getForInsertUpdate(raw: Entry): Entry {
		const entry = Object.assign({}, raw);
		delete entry.task;
		return entry;
	}

	private initGrid() {
		this.gridEntries = new GridView();
		this.gridEntries.pagingType = PagingType.Disabled;
		this.gridEntries.allowEdit = this.canEdit;
		this.gridEntries.allowDelete = this.canEdit;
		if (this.gridEntries.allowEdit) {
			this.gridEntries.rowSave.subscribe((r: RowArguments) => {
				this.saveRow(r);
			});
			this.gridEntries.rowCreate.subscribe((args: RowArguments) => {
				args.row.enteredById = this.authService.loggedInUser.user.userId;
				args.row.entryType = 1;
			})
			this.gridEntries.rowInvalidated.subscribe((columns: DataColumn[]) => {
				showToastError(this.toastr, `The following fields are required: ${columns.map(c => c.caption, true).join(', ')}`);
			});
			this.gridEntries.rowDelete.subscribe((args: RowArguments) => {
				this.loading = true;
				this.dataService.delete(`${this.apiUrl}/generalentries/${args.row.entryId}`).subscribe(() => {
					this.loading = false;
					showToastSuccess(this.toastr, `Task has been deleted`);
				}, (e) => {
					this.loading = false;
					showToastError(this.toastr, e);
				});
			});
		}
		this._taskCol = new SelectColumn("taskId", "Task");
		this._taskCol.width = "450px";
		this._taskCol.displayMember = "taskName";
		this._taskCol.valueMember = "taskId";
		this._taskCol.parentField = "task";
		this._taskCol.name = "taskCol";
		this._taskCol.required = true;
		this._taskCol.sortable = true;
		this.gridEntries.columns.push(this._taskCol);

		this.gridEntries.cellValueChanged.subscribe((args: CellArguments) => {
			if (args.column.name && args.column.name == this._taskCol.name) {
				args.row.task = this.lookups.tasks.find(t => t.taskId == args.row.taskId);
			}
		});

		this.gridEntries.columns.push(new TextAreaColumn("comments"));

		const selectCol = new ButtonColumn();
		selectCol.text = "Select";
		selectCol.width = "80px";
		selectCol.getRowCellClass = (row: Entry) => {
			if (!row.entryId) return 'hide-me';
			return "";
		}
		selectCol.click.subscribe(async (row: any) => {
			const r = await this.dialogService.showYesNoDialog(`Select Task`,
				`Are you sure you want to select "${row.task.taskName}"?`).toPromise();
			if (r == DialogResult.Yes) {
				this.loading = true;
				try {
					await (this.dataService.post(`${this.apiUrl}/pickupEntry`, { entryId: row.entryId })).toPromise();
					showToastSuccess(this.toastr, `Task has been selected`);
					this.refreshGrid();
				}
				catch (e) {
					this.loading = false;
					showToastError(this.toastr, e);
				}
			}
		});
		this.gridEntries.columns.push(selectCol);
	}

	private saveRow(rowArguments: RowArguments) {
		const row = <Entry>rowArguments.row;
		let observable: Observable<Entry>;
		const toInsertUpdate = this.getForInsertUpdate(row);
		if (toInsertUpdate.entryId) {
			observable = this.dataService.put(`${this.apiUrl}/generalentries/${toInsertUpdate.entryId}`, toInsertUpdate);
		}
		else {
			observable = this.dataService.post(`${this.apiUrl}/generalentries`, toInsertUpdate);
		}
		this.loading = true;
		observable.subscribe(e => {
			row.entryId = e.entryId;
			row.companyId = e.companyId;
			this.loading = false;
			showToastSuccess(this.toastr, `Task has been saved`);
		}, (e) => {
			this.loading = false;
			showToastError(this.toastr, e);
			this.gridEntriesComponent.editRow(row);
		});
	}
	async ngOnInit() {
		this.loading = true;
		this.apiUrl = this.configService.apiUrl;
		try {
			this.lookups = await this.dataService.get<ILookups>(`${this.apiUrl}/lookups?lookupType=1`).toPromise();
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
			return;
		}
		this._taskCol.selectOptions = this.lookups.tasks;
		await this.refreshGrid();
	}

	async refreshGrid() {
		this.loading = true;
		this.gridEntries.showNoResults = false;
		this.gridEntries.data = [];
		try {
			const entries = await this.dataService.getItems<Entry>(`${this.apiUrl}/generalentries?extras=true`).toPromise();
			this.gridEntries.data = entries.data;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}
