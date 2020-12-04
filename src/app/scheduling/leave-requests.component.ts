import { Component, ViewContainerRef, OnInit, ViewChild } from "@angular/core";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { ActivatedRoute } from "@angular/router";
import { GridView, PagingType, DataColumn, FieldType, ButtonColumn, SortDirection, SelectColumn, RowArguments, ModalDialogComponent, DialogResult } from "pajama-angular";
import { LeaveRequest, User } from "../shared/models";
import * as moment from 'moment-timezone';
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { AuthService } from "../shared/services/auth.service";
import { LeaveRequestComponent } from "./leave-request.component";
import { ILookups } from "../shared/interfaces";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";
import { getGridQueryString, getDateRangeWhere } from "../shared/utils";
import { FILTER_DELAY } from "../shared/constants";

@Component({
	selector: 'leave-requests',
	templateUrl: 'leave-requests.component.html'
})
export class LeaveRequestsComponent implements OnInit {
	forUser = false;
	gridMain: GridView;
	loading = false;
	lookups: ILookups;
	selectedUsers: Array<User> = [];
	startDate: Date;
	endDate: Date;

	private _apiUrl: string;
	private _userCol: SelectColumn;

	@ViewChild(ModalDialogComponent)
	leaveRequestModal: ModalDialogComponent;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService, private route: ActivatedRoute, private dialogService: DialogService) {
		this.forUser = this.route.snapshot.data[0] && this.route.snapshot.data[0].forUser;
		this.initGrid();
	}

	private assumeZero(dt: Date) {
		return dt.getHours() == 0 && dt.getMinutes() == 0;
	}

	private async updateLeaveRequestStatus(leaveRequest: LeaveRequest, status: number) {
		const r = await this.dialogService.showYesNoDialog(`${status == 1 ? 'Approve' : 'Deny'} Request`,
			`Are you sure you want to ${status == 1 ? 'approve' : 'deny'} the request for ${leaveRequest.user['displayName']}?`).toPromise();
		if (r != DialogResult.Yes) return;

		leaveRequest.status = status;
		leaveRequest.approvedDeniedDate = new Date();
		leaveRequest.approvedDeniedById = this.authService.loggedInUser.user.userId;
		leaveRequest.approvedDeniedBy = this.authService.loggedInUser.user;
		this.loading = true;
		try {
			await this.dataService.put<LeaveRequest, LeaveRequest>(`${this._apiUrl}/leaveRequests/${leaveRequest.leaveRequestId}`, leaveRequest).toPromise();
			showToastSuccess(this.toastr, "Status updated");
		}
		catch (e) {
			leaveRequest.status = 0;
			leaveRequest.approvedDeniedDate = null;
			leaveRequest.approvedDeniedBy = null;
			leaveRequest.approvedDeniedById = null;
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	private initGrid() {
		this.gridMain = new GridView();
		this.gridMain.pagingType = PagingType.Manual;
		this.gridMain.pageSize = 25;
		this.gridMain.disableAutoSort = true;
		this.gridMain.saveGridStateToStorage = true;
		this.gridMain.name = "leaveRequests";
		this.gridMain.allowDelete = true;
		this.gridMain.keyFieldName = "leaveRequestId";

		if (!this.forUser) {
			this._userCol = <SelectColumn>new SelectColumn("userId", "Employee").setSortable();
			this._userCol.valueMember = "userId";
			this._userCol.displayMember = "displayName";
			this._userCol.parentField = "user";
			this.gridMain.columns.push(this._userCol);
		}

		const requestedDateCol = new DataColumn("requestedDate").setSortable().setFieldType(FieldType.Date);
		this.gridMain.columns.push(requestedDateCol);

		const startCol = new DataColumn("startDate").setSortable().setSortDirection(SortDirection.Asc);
		startCol.render = (row: LeaveRequest) => {
			const startDt = new Date(row.startDate);
			if (this.assumeZero(startDt)) {
				return moment(startDt).format("L");
			}
			return moment(startDt).format("L LT");
		}
		this.gridMain.columns.push(startCol);

		const endCol = new DataColumn("endDate");
		endCol.render = (row: LeaveRequest) => {
			if (!row.endDate) return '';
			const endDt = new Date(row.endDate);
			if (this.assumeZero(endDt)) {
				return moment(endDt).format("L");
			}
			return moment(endDt).format("LT");
		}
		this.gridMain.columns.push(endCol);

		this.gridMain.columns.push(new DataColumn("reason"));

		const statusCol = new DataColumn("status").setSortable();
		statusCol.render = (row: LeaveRequest) => {
			let append = "";
			if (row.approvedDeniedDate) {
				append = ` on ${moment(new Date(row.approvedDeniedDate)).format("MM/DD/YYYY")}`;
			}
			if (row.approvedDeniedBy) {
				append += ` by ${row.approvedDeniedBy['displayName']}`;
			}
			switch (row.status) {
				case 0:
					return `Pending`;
				case 1:
					return `Approved${append}`;
				case 2:
					return `Denied${append}`;
			}
			return row.status.toString();
		}
		this.gridMain.columns.push(statusCol);

		if (!this.forUser) {
			for (let i = 0; i < 2; i++) {
				const col = new ButtonColumn();
				col.text = i == 0 ? "Approve" : "Deny";
				col.width = "70px";
				col.getRowCellClass = (row: LeaveRequest) => {
					if (row.status != 0 || row.userId == this.authService.loggedInUser.user.userId) {
						return 'hidden-column';
					}
					return '';
				}
				col.click.subscribe(async (row: LeaveRequest) => await this.updateLeaveRequestStatus(row, i + 1));
				col.printVisible = false;
				this.gridMain.columns.push(col);
			}
		}

		this.gridMain.rowDelete.subscribe((args: RowArguments) => {
			this.loading = true;
			this.dataService.delete(`${this._apiUrl}/leaveRequests/${args.row.leaveRequestId}`).subscribe(() => {
				this.loading = false;
				showToastSuccess(this.toastr, `Time off has been deleted`);
				const ind = this.gridMain.data.findIndex(e => e.leaveRequestId == args.row.leaveRequestId);
				this.gridMain.data.splice(ind, 1);
			}, (e) => {
				this.loading = false;
				showToastError(this.toastr, e);
			});
		});
		this.gridMain.loadGridState();
	}

	async ngOnInit() {
		this._apiUrl = this.configService.apiUrl;
		try {
			this.loading = true;
			if (!this.forUser) {
				this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=1000`).toPromise();
				this._userCol.selectOptions = this.lookups.users.slice();
			}
			await this.refreshGrid(true);
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	private _lastChange: Date;
	async filterChanged() {
		this._lastChange = new Date();
		setTimeout(async() => {
			if (moment().diff(moment(this._lastChange)) > FILTER_DELAY - 50) await this.refreshGrid(true);
		}, FILTER_DELAY);
	}

	async refreshGrid(resetPage: boolean) {
		if (resetPage) {
			this.gridMain.currentPage = 1;
		}
		try {
			this.loading = true;
			let url = `${this._apiUrl}/leaveRequests?1=1${this.forUser ? '&forUser=true' : ''}&${getGridQueryString(this.gridMain).replace("requestedDate", "created_at")}`;
			url += `&where=${getDateRangeWhere('startDate', this.startDate, this.endDate)}`;
			if (this.selectedUsers.length > 0 && this.selectedUsers.length != this.lookups.users.length) {
				url += `,userId%20in%20${this.selectedUsers.map(u => u.userId).join(';')},`;
			}
			const leaveRequests = await this.dataService.getItems<LeaveRequest>(url).toPromise();
			this.gridMain.data = leaveRequests.data;
			this.gridMain.totalRecords = leaveRequests.count;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	async clearSearch() {
		this.startDate = null;
		this.endDate = null;
		this.selectedUsers = [];
		await this.refreshGrid(true);
	}

	addRequest = () => {
		this.leaveRequestModal.show().subscribe(() => {
			if (this.leaveRequestModal.tag) {
				this.gridMain.data.push(this.leaveRequestModal.tag);
		 		this.gridMain.refreshData();
			}
			this.leaveRequestModal.tag = null;
		})
	}
}