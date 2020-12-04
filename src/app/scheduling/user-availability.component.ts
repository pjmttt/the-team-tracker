import { Component, ViewContainerRef, OnInit, ViewChild } from "@angular/core";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { ActivatedRoute } from "@angular/router";
import { GridView, DetailGridView, PagingType, DataColumn, FieldType, ButtonColumn, SortDirection, RowArguments, GridViewComponent, SelectColumn, CellArguments, DialogResult, ModalDialogComponent } from "pajama-angular";
import { UserAvailability } from "../shared/models";
import * as moment from 'moment-timezone';
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { AuthService } from "../shared/services/auth.service";
import { Observable } from "rxjs";
import { DAYS, ROLE } from "../shared/constants";
import { ILookups } from "../shared/interfaces";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";
import { UserAvailabilityBulkComponent } from "./user-availability-bulk.component";
import { GridViewContainerComponent } from "../shared/gridview-container.component";

@Component({
	selector: 'user-availability',
	templateUrl: 'user-availability.component.html'
})
export class UserAvailabilityComponent implements OnInit {
	forUser = false;
	gridMain: GridView;
	loading = false;
	disableNotifications = false;

	@ViewChild("gridViewContainer")
	gridViewContainer: GridViewContainerComponent;

	@ViewChild("bulkModal")
	bulkModal: ModalDialogComponent;

	@ViewChild("bulkComponent")
	bulkComponent: UserAvailabilityBulkComponent;

	private _apiUrl: string;
	private approveDenyCols: Array<ButtonColumn> = [];
	lookups: ILookups;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService, private route: ActivatedRoute, private dialogService: DialogService) {
		this.forUser = this.route.snapshot.data[0] && this.route.snapshot.data[0].forUser;
		this.initGrid();

	}

	private async updateUserAvailabilityStatus(userAvailability: UserAvailability, status: number) {
		const r = await this.dialogService.showYesNoDialog(`${status == 1 ? 'Approve' : 'Deny'} Request`,
			`Are you sure you want to ${status == 1 ? 'approve' : 'deny'} the request for ${userAvailability.user['displayName']}?`
		).toPromise();
		if (r != DialogResult.Yes) return;

		userAvailability.status = status;
		userAvailability.approvedDeniedDate = new Date();
		userAvailability.approvedDeniedById = this.authService.loggedInUser.user.userId;
		userAvailability.approvedDeniedBy = this.authService.loggedInUser.user;
		this.loading = true;
		try {
			const updated = await this.dataService.put<UserAvailability, UserAvailability>(`${this._apiUrl}/userAvailability/${userAvailability.userAvailabilityId}${this.disableNotifications ? '?disableNotifications=true' : ''}`, userAvailability).toPromise();
			showToastSuccess(this.toastr, "Status updated");
			if (userAvailability.markedForDelete && status != 2) {
				const component = this.gridViewContainer.gridViewComponent;
				for (let dgvkey of Object.keys(component.detailGridViewComponents)) {
					const inst = component.detailGridViewComponents[dgvkey].detailGridViewInstance;
					if (inst.data) {
						const ind = inst.data.findIndex(r => r.userAvailabilityId == userAvailability.userAvailabilityId);
						if (ind >= 0) {
							inst.data.splice(ind, 1);
							inst.refreshData();
							break;
						}
					}
				}
			}
		}
		catch (e) {
			userAvailability.status = 0;
			userAvailability.approvedDeniedDate = null;
			userAvailability.approvedDeniedBy = null;
			userAvailability.approvedDeniedById = null;
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	private initCoreColumns(gridView: GridView) {
		const dayCol = new SelectColumn("dayOfWeek");
		dayCol.selectOptions = DAYS;
		dayCol.displayMember = "name";
		dayCol.valueMember = "value";
		gridView.columns.push(dayCol);

		const startCol = new DataColumn("startTime").setSortable().setSortDirection(SortDirection.Asc).setFieldType(FieldType.Time);
		startCol.format = "LT";
		startCol.getRowCellClass = (row: UserAvailability) => {
			if (row.allDay) {
				return 'hidden-column';
			}
			return '';
		}
		gridView.columns.push(startCol);

		const endCol = new DataColumn("endTime").setSortable().setSortDirection(SortDirection.Asc).setFieldType(FieldType.Time);
		endCol.format = "LT";
		endCol.getRowCellClass = (row: UserAvailability) => {
			if (row.allDay) {
				return 'hidden-column';
			}
			return '';
		}
		gridView.columns.push(endCol);

		gridView.columns.push(new DataColumn("allDay").setFieldType(FieldType.Boolean).setName("allDayCol"));

		const statusCol = new DataColumn("status").setSortable();
		statusCol.readonly = true;
		statusCol.render = (row: UserAvailability) => {
			let append = "";
			if (row.approvedDeniedDate) {
				append = ` on ${moment(new Date(row.approvedDeniedDate)).format("MM/DD/YYYY")}`;
			}
			if (row.approvedDeniedBy) {
				append += ` by ${row.approvedDeniedBy['displayName']}`;
			}
			switch (row.status) {
				case 0:
					return `Pending${row.markedForDelete ? ' delete' : ''}`;
				case 1:
					return `Approved${append}`;
				case 2:
					return `Denied${append}`;
			}
			return row.status.toString();
		}
		gridView.columns.push(statusCol);

		gridView.cellValueChanged.subscribe((args: CellArguments) => {
			const ua = <UserAvailability>args.row;
			if (args.column.name == "allDayCol" && ua.allDay) {
				ua.startTime = null;
				ua.endTime = null;
			}
		});
	}

	private initGrid() {
		this.gridMain = new GridView();
		this.gridMain.pagingType = PagingType.Disabled;
		if (!this.forUser) {
			const gridDetail = new DetailGridView();
			this.initCoreColumns(gridDetail);
			gridDetail.pagingType = PagingType.Disabled;
			this.gridMain.allowEdit = true;
			this.gridMain.rowCreate.subscribe(async (r: RowArguments) => {
				r.cancel = true;
				const result = await this.bulkModal.show().toPromise();
				if (result == DialogResult.OK)
					await this.refreshGrid();
			});
			gridDetail.allowEdit = true;
			gridDetail.allowDelete = true;
			gridDetail.allowAdd = true;
			gridDetail.rowSaveAll.subscribe(async (r) => {
				r.cancel = !await this.saveRows(r);
			});
			gridDetail.rowCreate.subscribe((r: RowArguments) => {
				r.row.userId = (<DetailGridView>r.grid).parentRow.userId;
				r.row.status = 1;
				r.row.approvedDeniedDate = new Date();
				r.row.approvedDeniedById = this.authService.loggedInUser.user.userId;
				r.row.approvedDeniedBy = this.authService.loggedInUser.user;
			});
			// gridDetail.rowDelete.subscribe((args: RowArguments) => {
			// 	this.loading = true;
			// 	this.dataService.delete(`${this._apiUrl}/userAvailability/${args.row.userAvailabilityId}`).subscribe(() => {
			// 		this.loading = false;
			// 		showToastSuccess(this.toastr, `Availability has been deleted`);
			// 	}, (e) => {
			// 		this.loading = false;
			// 		showToastError(this.toastr, e);
			// 	});
			// });
			gridDetail.getChildData = (parent: any) => {
				return new Observable(o => o.next(parent.availability));
			}
			this.gridMain.detailGridView = gridDetail;
			this.gridMain.columns.push(new DataColumn("displayName", "Employee").setSortable().setReadOnly());
			for (let i = 0; i < 2; i++) {
				const col = new ButtonColumn();
				col.text = i == 0 ? "Approve" : "Deny";
				col.width = "70px";
				col.getRowCellClass = (row: UserAvailability) => {
					if (row.status != 0) return "hide-me";
					return "";
				}
				col.click.subscribe(async (row: UserAvailability) => await this.updateUserAvailabilityStatus(row, i + 1));
				gridDetail.columns.push(col);
				this.approveDenyCols.push(col);
			}
		}
		else {
			this.initCoreColumns(this.gridMain);
			this.gridMain.allowEdit = true;
			this.gridMain.allowDelete = true;
			this.gridMain.rowSave.subscribe((r: RowArguments) => {
				r.cancel = !this.saveRow(r);
			});
			this.gridMain.rowCreate.subscribe((r: RowArguments) => {
				r.row.userId = this.authService.loggedInUser.user.userId;
				r.row.status = this.authService.hasRole(ROLE.SCHEDULING.value) ? 1 : 0;
				r.row.approvedDeniedDate = new Date();
				r.row.approvedDeniedById = this.authService.loggedInUser.user.userId;
				r.row.approvedDeniedBy = this.authService.loggedInUser.user;
			});
			this.gridMain.rowInvalidated.subscribe((columns: DataColumn[]) => {
				showToastError(this.toastr, `The following fields are required: ${columns.map(c => c.caption, true).join(', ')}`);
			});
			this.gridMain.rowDelete.subscribe((args: RowArguments) => {
				this.loading = true;

				if (!this.authService.hasRole(ROLE.SCHEDULING.value)) {
					args.row.markedForDelete = true;
					args.cancel = true;
					this.dataService.put<UserAvailability, UserAvailability>(`${this._apiUrl}/userAvailability/${args.row.userAvailabilityId}`, args.row).subscribe(r => {
						this.loading = false;
						Object.assign(args.row, r);
						showToastSuccess(this.toastr, `Availability has been marked for delete`);
					}, (e) => {
						this.loading = false;
						showToastError(this.toastr, e);
					});
				}
				else {
					this.dataService.delete(`${this._apiUrl}/userAvailability/${args.row.userAvailabilityId}`).subscribe(() => {
						this.loading = false;
						showToastSuccess(this.toastr, `Availability has been deleted`);
						const ind = this.gridMain.data.findIndex(e => e.userAvailabilityId == args.row.userAvailabilityId);
						this.gridMain.data.splice(ind, 1);
					}, (e) => {
						this.loading = false;
						showToastError(this.toastr, e);
					});
				}
			});
		}
	}

	async saveRows(rowArguments: RowArguments): Promise<boolean> {
		const rows = <UserAvailability[]>rowArguments.rows;
		for (let row of rows) {
			if (!row.startTime && !row.endTime && !row.allDay) {
				showToastError(this.toastr, "Start time and end time, or all day required");
				return false;
			}
		}
		this.loading = true;
		try {
			await this.dataService.post(`${this._apiUrl}/userAvailability${this.disableNotifications ? '?disableNotifications=true' : ''}`, rows).toPromise();
			// todo bulk
			for (let del of rowArguments.deletedRows) {
				if (del.userAvailabilityId)
					await this.dataService.delete(`${this._apiUrl}/userAvailability/${del.userAvailabilityId}`).toPromise();
			}
			this.loading = false;
			showToastSuccess(this.toastr, 'Availability has been saved');
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
			// TODO: this.gridMainComponent.editRow(row);
		}
		return true;
	}

	private saveRow(rowArguments: RowArguments): boolean {
		const row = <UserAvailability>rowArguments.row;
		if (!row.startTime && !row.endTime && !row.allDay) {
			showToastError(this.toastr, "Start time and end time, or all day required");
			return false;
		}
		let observable: Observable<UserAvailability>;
		if (row.userAvailabilityId) {
			observable = this.dataService.put(`${this._apiUrl}/userAvailability/${row.userAvailabilityId}${this.disableNotifications ? '?disableNotifications=true' : ''}`, row);
		}
		else {
			observable = this.dataService.post(`${this._apiUrl}/userAvailability${this.disableNotifications ? '?disableNotifications=true' : ''}`, row);
		}
		this.loading = true;
		observable.subscribe(e => {
			Object.assign(row, e);
			this.loading = false;
			showToastSuccess(this.toastr, 'Availability has been saved');
		}, (e) => {
			this.loading = false;
			showToastError(this.toastr, e);
			// TODO: this.gridMainComponent.editRow(row);
		});
		return true;
	}

	async ngOnInit() {
		this._apiUrl = this.configService.apiUrl;
		await this.refreshGrid();
	}

	async refreshGrid() {
		try {
			this.loading = true;
			const data = (await this.dataService.getItems<UserAvailability>(`${this._apiUrl}/userAvailability${this.forUser ? '?forUser=true' : ''}`).toPromise()).data;
			if (this.forUser) {
				this.gridMain.data = data;
			}
			else {
				this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=1000`).toPromise();
				let groupedData: Array<any> = [];
				for (let u of this.lookups.users) {
					groupedData.push({
						userId: u.userId,
						displayName: u['displayName'],
						availability: []
					});
				}
				for (let d of data) {
					let curr = groupedData.find(g => g.userId == d.user.userId);
					if (curr == null) {
						curr = {
							userId: d.userId,
							displayName: d.user['displayName'],
							availability: []
						};
						groupedData.push(curr);
					}
					curr.availability.push(d);
				}
				this.gridMain.data = groupedData;
			}
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}