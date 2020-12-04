import { Component, ViewContainerRef, OnInit, ViewChild } from "@angular/core";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { ActivatedRoute } from "@angular/router";
import { GridView, DetailGridView, PagingType, DataColumn, FieldType, ButtonColumn, SortDirection, RowArguments, SelectColumn, CellArguments, DialogResult, ModalDialogComponent, TextAreaColumn } from "pajama-angular";
import * as moment from 'moment-timezone';
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { AuthService } from "../shared/services/auth.service";
import { Observable } from "rxjs";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";
import { UserProgressChecklist, UserProgressItem, User } from "../shared/models";
import { ILookups } from "../shared/interfaces";
import { GridViewContainerComponent } from "../shared/gridview-container.component";
import { FILTER_DELAY } from "../shared/constants";

@Component({
	selector: 'user-progress-checklist',
	templateUrl: 'user-progress-checklist.component.html'
})
export class UserProgressChecklistComponent implements OnInit {
	forUser = false;
	gridMain: GridView;
	loading = false;
	lookups: ILookups;
	selectedUsers: Array<User> = [];

	private _apiUrl: string;
	private _progressChecklistCol: SelectColumn;
	private _userCol: SelectColumn;

	@ViewChild(GridViewContainerComponent)
	gridViewContainerComponent: GridViewContainerComponent;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService, private route: ActivatedRoute, private dialogService: DialogService) {
		this.forUser = this.route.snapshot.data[0] && this.route.snapshot.data[0].forUser;
		this.initGrid();
	}

	private initGrid() {
		this.gridMain = new GridView();
		this.gridMain.pagingType = PagingType.Disabled;

		this._progressChecklistCol = new SelectColumn("progressChecklistId", "Checklist");
		this._progressChecklistCol.name = "progressChecklistCll";
		this._progressChecklistCol.displayMember = "checklistName";
		this._progressChecklistCol.valueMember = "progressChecklistId";
		this._progressChecklistCol.setSortable();
		this.gridMain.columns.push(this._progressChecklistCol);

		if (!this.forUser) {
			this._userCol = <SelectColumn>new SelectColumn("userId", "Employee").setSortable().setRequired();
			this._userCol.valueMember = "userId";
			this._userCol.displayMember = "displayName";
			this._userCol.parentField = "user";
			this.gridMain.columns.push(this._userCol);
			this.gridMain.cellValueChanged.subscribe((a: CellArguments) => {
				if (a.column.name == this._progressChecklistCol.name) {
					const userProgressChecklist = <UserProgressChecklist>a.row;
					userProgressChecklist.progressChecklist = this.lookups.progressChecklists.find(c => c.progressChecklistId ==
						userProgressChecklist.progressChecklistId);
					userProgressChecklist.userProgressItems = userProgressChecklist.progressChecklist.progressItems.map(i => {
						const item = new UserProgressItem();
						item.progressItem = i;
						item.progressItemId = i.progressItemId;
						return item;
					});
					const dgv = this.gridViewContainerComponent.gridViewComponent.detailGridViewComponents[a.row['_tmp_key_field']];
					dgv.detailGridViewInstance.data = userProgressChecklist.userProgressItems;
					dgv.detailGridViewInstance.refreshData();
					dgv.gridViewComponent.editAll();
				}
			});
		}

		const managerCol = new DataColumn("manager.displayName", "Entered By").setSortable();
		managerCol.readonly = true;
		this.gridMain.columns.push(managerCol);

		const startDate = new DataColumn("startDate").setSortable().setSortDirection(SortDirection.Asc).setFieldType(FieldType.Date).setRequired();
		this.gridMain.columns.push(startDate);

		const completedDate = new DataColumn("completedDate").setSortable().setFieldType(FieldType.Date);
		this.gridMain.columns.push(completedDate);

		const gridDetail = new DetailGridView();


		if (!this.forUser) {
			this.gridMain.allowEdit = true;
			this.gridMain.allowDelete = true;
			this.gridMain.rowSave.subscribe((r: RowArguments) => {
				r.cancel = !this.saveRow(r);
			});
			this.gridMain.rowCreate.subscribe((r: RowArguments) => {
				r.row.manager = this.authService.loggedInUser.user;
				r.row.managerId = r.row.manager.userId;
				r.row.startDate = new Date();
			});
			this.gridMain.rowInvalidated.subscribe((columns: DataColumn[]) => {
				showToastError(this.toastr, `The following fields are required: ${columns.map(c => c.caption, true).join(', ')}`);
			});
			this.gridMain.rowDelete.subscribe((args: RowArguments) => {
				this.loading = true;
				this.dataService.delete(`${this._apiUrl}/userProgressChecklists/${args.row.userProgressChecklistId}`).subscribe(() => {
					this.loading = false;
					showToastSuccess(this.toastr, `Progress checklist has been deleted`);
					const ind = this.gridMain.data.findIndex(e => e.userProgressChecklistId == args.row.userProgressChecklistId);
					this.gridMain.data.splice(ind, 1);
				}, (e) => {
					this.loading = false;
					showToastError(this.toastr, e);
				});
			});
			gridDetail.allowEdit = true;
		}

		gridDetail.columns.push(new DataColumn("progressItem.sequence", "Seq").setReadOnly().setSortDirection(SortDirection.Asc).setWidth("40px"));
		gridDetail.columns.push(new DataColumn("progressItem.itemDescription", "Item").setReadOnly());
		const completedDateCol = new DataColumn("completedDate", "Completed").setFieldType(FieldType.Date).setWidth("120px");
		completedDateCol.readonly = this.forUser;
		completedDateCol.name = "completedDateCol";
		gridDetail.columns.push(completedDateCol);
		const completedByCol = new DataColumn("completedBy.displayName", "Completed By").setWidth("180px");
		completedByCol.readonly = true;
		gridDetail.columns.push(completedByCol);
		const commentsCol = new TextAreaColumn("comments");
		commentsCol.readonly = this.forUser;
		commentsCol.rows = 1;
		gridDetail.columns.push(commentsCol);
		gridDetail.columns.push(new DataColumn().setReadOnly().setWidth("2px"));
		gridDetail.pagingType = PagingType.Disabled;
		gridDetail.getChildData = (parent: UserProgressChecklist) => {
			return new Observable(o => o.next(parent.userProgressItems));
		}
		gridDetail.cellValueChanged.subscribe((a: CellArguments) => {
			if (a.column.name == completedDateCol.name) {
				if (a.row.completedDate) {
					a.row.completedBy = this.authService.loggedInUser.user;
					a.row.completedById = a.row.completedBy.userId;
				}
			}
		})
		this.gridMain.detailGridView = gridDetail;
	}

	private getForInsertUpdate(raw: UserProgressChecklist): UserProgressChecklist {
		const upcl = Object.assign({}, raw);
		delete upcl.company;
		delete upcl.manager;
		delete upcl.progressChecklist;
		delete upcl.user;
		upcl.userProgressItems = [];
		if (raw.userProgressItems) {
			for (let rawes of raw.userProgressItems) {
				const upi = Object.assign({}, rawes);
				delete upi.completedBy;
				delete upi.progressItem;
				delete upi.userProgressChecklist;
				upcl.userProgressItems.push(upi);
			}
		}

		return upcl;
	}


	private saveRow(rowArguments: RowArguments): boolean {
		const row = this.getForInsertUpdate(<UserProgressChecklist>rowArguments.row);
		let observable: Observable<UserProgressChecklist>;
		if (row.userProgressChecklistId) {
			observable = this.dataService.put(`${this._apiUrl}/userProgressChecklists/${row.userProgressChecklistId}`, row);
		}
		else {
			observable = this.dataService.post(`${this._apiUrl}/userProgressChecklists`, row);
		}
		this.loading = true;
		observable.subscribe(e => {
			Object.assign(row, e);
			this.loading = false;
			showToastSuccess(this.toastr, 'Checklist has been saved');
		}, (e) => {
			this.loading = false;
			showToastError(this.toastr, e);
		});
		return true;
	}

	private _lastChange: Date;
	async filterChanged() {
		this._lastChange = new Date();
		setTimeout(async() => {
			if (moment().diff(moment(this._lastChange)) > FILTER_DELAY - 50) await this.refreshGrid();
		}, FILTER_DELAY);
	}

	async ngOnInit() {
		this._apiUrl = this.configService.apiUrl;
		this.loading = true;
		this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=5`).toPromise();
		this._progressChecklistCol.selectOptions = this.lookups.progressChecklists;
		if (!this.forUser) {
			this._userCol.selectOptions = this.lookups.users;
		}
		await this.refreshGrid();
	}

	async refreshGrid() {
		try {
			this.loading = true;
			let url = `${this._apiUrl}/userProgressChecklists?1=1${this.forUser ? '&forUser=true' : ''}`;
			if (this.selectedUsers.length > 0 && this.selectedUsers.length != this.lookups.users.length) {
				url += `&where=userId%20in%20${this.selectedUsers.map(u => u.userId).join(';')},`;
			}
			const data = (await this.dataService.getItems<UserProgressChecklist>(url).toPromise()).data;
			this.gridMain.data = data;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}