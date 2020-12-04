import { Component, OnInit, ViewChild } from '@angular/core';
import { GridView, DataColumn, FieldType, PagingType, GridViewComponent, RowArguments, SelectColumn, DetailGridView, CellArguments, ButtonColumn, DialogResult, TextAreaColumn } from 'pajama-angular';
import { SortDirection } from 'pajama-angular';
import { AuthDataService } from '../shared/services/data.service';
import { UserClock, User } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import * as moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { ROLE, FILTER_DELAY } from '../shared/constants';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { ILookups } from '../shared/interfaces';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { DialogService } from '../shared/services/dialog.service';
import { getGridQueryString, getDateRangeWhere } from '../shared/utils';

@Component({
	selector: 'hours',
	templateUrl: './hours.component.html',
})
export class HoursComponent implements OnInit {
	forUser = false;
	startDate = moment().toDate();
	endDate = moment().toDate();
	gridHours: GridView;
	loading = false;
	user: User;
	role = ROLE;
	lookups: ILookups
	groupedBy = 0;
	totalHours = 0;

	private _apiUrl: string;
	private _userCol: SelectColumn;
	private _groupedData: Array<any>;

	private _changedRows: { [tmpKey: string]: { [type: number]: Array<any> } } = {};
	private CHANGED = 0;
	private DELETED = 1;

	selectedUsers: Array<User> = [];

	private _printHeader: string;
	get printHeader(): string {
		if (!this._printHeader)
			this._printHeader = `${moment(this.startDate).format("L")} - ${moment(this.endDate).format("L")}`;
		return this._printHeader;
	}

	constructor(private dataService: AuthDataService, private configService: ConfigService,
		private toastr: ToastrService, private route: ActivatedRoute, private dialogService: DialogService,
		private authService: AuthService) {
		this.forUser = this.route.snapshot.data[0] && this.route.snapshot.data[0].forUser;
		this.initGrid();
	}

	async startEndChanged() {
		this._printHeader = null;
		await this.filterChanged();
	}

	private datePlusTime(date: any, time: any) {
		return moment(`${moment(date).format('YYYY-MM-DD')}T${moment(time).format('HH:mm:ss')}`);
	}

	private calcDifferenceNumeric(rows: Array<UserClock>): number {
		let total = 0;
		for (let row of rows) {
			if (!row.clockOutDate) continue;
			let outDate = this.datePlusTime(row['datePart'], row.clockOutDate);
			let inDate = this.datePlusTime(row['datePart'], row.clockInDate);
			if (inDate.isAfter(outDate))
				outDate = outDate.add(1, 'days');
			inDate.seconds(0);
			inDate.milliseconds(0);
			outDate.seconds(0);
			outDate.milliseconds(0);
			total += moment.duration(outDate.diff(inDate)).asMinutes();
		}
		return Math.round(100 * total / 60) / 100;
	}

	private calcDifference(rows: Array<UserClock>): string {
		let total = this.calcDifferenceNumeric(rows);
		return total == 0 ? "" : total.toString();
	}

	private initBaseColumns(grid: GridView) {
		grid.columns.push(new DataColumn("datePart", "Date").setFieldType(FieldType.Date).setSortable().setSortDirection(SortDirection.Asc).setRequired());
		grid.columns.push(new DataColumn("clockInDate", "In").setFieldType(FieldType.Time).setSortable().setSortDirection(SortDirection.Asc).setRequired());
		grid.columns.push(new DataColumn("clockOutDate", "Out").setFieldType(FieldType.Time).setSortable());
		grid.columns.push(new TextAreaColumn("notes"));
		grid.getRowClass = (row: UserClock) => {
			if (row.status > 1) return 'hide-row';
			return null;
		}
		const col = new DataColumn(null, "Duration");
		col.readonly = true;
		col.render = (row: UserClock) => {
			if (!row['difference'])
				row['difference'] = this.calcDifference([row]);
			return row['difference'];
		}
		grid.cellValueChanged.subscribe((c: CellArguments) => {
			c.row.difference = null;
			if (this._groupedData) {
				const g = this._groupedData.find(d => d.userId == c.row.userId);
				if (g) g.total = null;
			}
			// this.totalHours = this.calcDifferenceNumeric(hours.data);
		});
		grid.columns.push(col);
		if (!this.forUser) {
			for (let i = 0; i < 2; i++) {
				const approveDenyCol = new ButtonColumn();
				approveDenyCol.printVisible = false;
				approveDenyCol.text = i == 0 ? "Approve" : "Deny";
				approveDenyCol.width = "70px";
				approveDenyCol.getRowCellClass = (row: UserClock) => {
					if (!row.userClockId || row.status == 0) return "hide-me";
					return "";
				}
				approveDenyCol.click.subscribe(async (row: UserClock) => {
					const r = await this.dialogService.showYesNoDialog(`${i == 0 ? 'Approve' : 'Deny'} Request`,
						`Are you sure you want to ${i == 0 ? 'approve' : 'deny'} the request for ${row.user['displayName']}?`
					).toPromise();
					if (r != DialogResult.Yes) return;

					this.loading = true;
					try {
						if (i == 0) {
							row.status = 0;
							await this.dataService.put<UserClock, UserClock>(`${this._apiUrl}/userClocks/${row.userClockId}`, row).toPromise();
						}
						else {
							await this.dataService.delete(`${this._apiUrl}/userClocks/${row.userClockId}`).toPromise();
							if (this.groupedBy > 0) {
								const dinds = this.gridHours.data.filter(d => d.userId == row.userId);
								for (let dind of dinds) {
									const dgv = this.gridHours.gridViewComponent.detailGridViewComponents[this.gridHours.data[dind]._tmp_key_field].detailGridViewInstance;
									const ind = dgv.data.findIndex(d => d.userClockId == row.userClockId);
									if (ind >= 0) dgv.data.splice(ind, 1);
									dgv.refreshData();
								}
							}
							else {
								const ind = grid.data.findIndex(d => d.userClockId == row.userClockId);
								if (ind >= 0) grid.data.splice(ind, 1);
								grid.refreshData();
							}
						}
						this.loading = false;
						showToastSuccess(this.toastr, "Item(s) have been saved.");
					}
					catch (err) {
						showToastError(this.toastr, err);
						this.loading = false;
					}
				});
				grid.columns.push(approveDenyCol);
			}
		}
	}

	private initGrid() {
		this.user = this.authService.loggedInUser.user;
		if (this.forUser) {
			let start = moment();
			while (start.day() > this.user.company.weekStart) {
				start.day(start.day() - 1);
			}
			let end = moment(start);
			end.day(end.day() + 6);
			this.startDate = start.toDate();
			this.endDate = end.toDate();
		}

		this.gridHours = new GridView();
		this.gridHours.pagingType = PagingType.Disabled;
		if (!this.forUser) {
			this._userCol = new SelectColumn("userId", "Employee");
			this._userCol.sortable = true;
			this._userCol.valueMember = "userId";
			this._userCol.displayMember = "displayName";
			this._userCol.parentField = "user";
			this._userCol.readonly = this.groupedBy > 0;
			if (this.lookups)
				this._userCol.selectOptions = this.lookups.users;
			this.gridHours.columns.push(this._userCol);

			if (this.groupedBy > 0) {
				if (this.groupedBy == 2) {
					this.gridHours.columns.push(new DataColumn("datePart", "Date").setFieldType(FieldType.Date).setSortable()
						.setSortDirection(SortDirection.Desc).setWidth("200px"));
				}
				const totalsCol = new DataColumn(null, "Total").setWidth("200px");
				totalsCol.readonly = true;
				totalsCol.render = (row: any) => {
					if (!row.total) row.total = this.calcDifference(row.userClocks);
					return row.total;
				}
				this.gridHours.columns.push(totalsCol);
				this._userCol.sortDirection = SortDirection.Asc;
			}
		}

		let gridToSave: GridView;
		if (this.groupedBy > 0) {
			const detailGridView = new DetailGridView();
			this.initBaseColumns(detailGridView);
			this.gridHours.detailGridView = detailGridView;
			detailGridView.getChildData = (parent: any) => Observable.create(o => o.next(parent.userClocks));
			detailGridView.pagingType = PagingType.Disabled;
			gridToSave = detailGridView;
			gridToSave.allowAdd = true;
		}
		else {
			this.initBaseColumns(this.gridHours);
			gridToSave = this.gridHours;
			this.gridHours.pagingType = PagingType.Manual;
			this.gridHours.pageSize = 25;
			this.gridHours.disableAutoSort = true;
			this.gridHours.saveGridStateToStorage = true;
			this.gridHours.name = "gridHours";
			this.gridHours.loadGridState();
		}


		this.gridHours.allowEdit = true;
		gridToSave.allowEdit = true;
		gridToSave.allowDelete = true;
		this.gridHours.rowSave.subscribe((args: RowArguments) => {
			args.observable = Observable.create(async o => {
				this.loading = true;
				const rowsToUpdate: Array<UserClock> = [];
				const rowsToDelete: Array<UserClock> = [];
				const row = <UserClock>args.row;
				if (this.groupedBy > 0) {
					if (this._changedRows[row["_tmp_key_field"]]) {
						const cr = this._changedRows[row["_tmp_key_field"]];
						if (cr[this.DELETED]) {
							for (let d of cr[this.DELETED]) {
								rowsToDelete.push(d);
							}
						}
						if (cr[this.CHANGED]) {
							for (let c of cr[this.CHANGED]) {
								rowsToUpdate.push(c);
							}
						}
						this._changedRows[row["_tmp_key_field"]] = null;
					}
				}
				else {
					rowsToUpdate.push(row)
				}
				for (let u of rowsToUpdate) {
					u.clockInDate = this.datePlusTime(u['datePart'], u.clockInDate).toDate();
					if (u.clockOutDate) {
						u.clockOutDate = this.datePlusTime(u['datePart'], u.clockOutDate).toDate();
					}
					if (!u.userId && this.forUser) {
						u.userId = this.authService.loggedInUser.user.userId;
					}
				}

				try {
					if (rowsToUpdate.length > 0) {
						await this.dataService.post(`${this._apiUrl}/userClocks`, rowsToUpdate).toPromise();
					}
					if (rowsToDelete.length > 0) {
						for (let d of rowsToDelete) {
							await this.dataService.delete(`${this._apiUrl}/userClocks/${d.userClockId}`).toPromise();
						}
					}
					// await this.refreshGrid(false);
					this.loading = false;
					showToastSuccess(this.toastr, "Item(s) have been saved.");
					return o.next();
				}
				catch (err) {
					showToastError(this.toastr, err);
					this.loading = false;
					return o.error(err);
				}
			});
		});

		if (this.groupedBy > 0) {
			gridToSave.rowDelete.subscribe((r: RowArguments) => {
				const row = (<DetailGridView>r.grid).parentRow;
				if (!this._changedRows[row._tmp_key_field]) {
					this._changedRows[row._tmp_key_field] = {};
				}
				if (!this._changedRows[row._tmp_key_field][this.DELETED]) {
					this._changedRows[row._tmp_key_field][this.DELETED] = [];
				}
				this._changedRows[row._tmp_key_field][this.DELETED].push(r.row);
			});

			gridToSave.cellValueChanged.subscribe((c: CellArguments) => {
				const row = (<DetailGridView>c.parentGridView).parentRow;
				if (!this._changedRows[row._tmp_key_field]) {
					this._changedRows[row._tmp_key_field] = {};
				}
				if (!this._changedRows[row._tmp_key_field][this.CHANGED]) {
					this._changedRows[row._tmp_key_field][this.CHANGED] = [];
				}
				this._changedRows[row._tmp_key_field][this.CHANGED].push(c.row);
			});
		}
		else {
			this.gridHours.rowDelete.subscribe(async (args: RowArguments) => {
				this.loading = true;
				const id = args.row["userClockId"];
				try {
					await this.dataService.delete(`${this._apiUrl}/userClocks/${id}`).toPromise();
					await this.refreshGrid(false, false);
					showToastSuccess(this.toastr, "Item has been deleted.");
				}
				catch (err) {
					showToastError(this.toastr, err);
				}
				this.loading = false;
			})
		}

		gridToSave.rowCreate.subscribe((r: RowArguments) => {
			if (this.groupedBy >= 0) {
				r.row.userId = (<DetailGridView>r.grid).parentRow.userId;
			}
			else if (this.forUser) {
				r.row.userId = this.authService.loggedInUser.user.userId;
			}
			r.row.clockInDate = new Date();
			r.row.clockInDate.setHours(0);
			r.row.clockInDate.setMinutes(0);
			r.row.clockInDate.setSeconds(0);
			r.row.datePart = moment(r.row.clockInDate).toDate();
		});
	}

	async ngOnInit() {
		this._apiUrl = this.configService.apiUrl;
		this.loading = true;
		try {
			this.loading = true;
			if (!this.forUser) {
				this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=1000`).toPromise();
				this._userCol.selectOptions = this.lookups.users;
			}
			await this.refreshGrid(false, true);
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	hasRole(role) {
		return this.user.roles.indexOf(role.value) >= 0;
	}

	private _lastChange: Date;
	async filterChanged() {
		this._lastChange = new Date();
		setTimeout(async () => {
			if (moment().diff(moment(this._lastChange)) > FILTER_DELAY - 50) {
				await this.refreshGrid(false, true);
			}
		}, FILTER_DELAY);
	}

	async refreshGrid(reinit: boolean, resetPage: boolean) {
		if (reinit) {
			this.gridHours.data = null;
			this.initGrid();
		}
		else if (this.groupedBy < 1 && resetPage) {
			this.gridHours.currentPage = 1;
		}
		this.loading = true;
		try {
			let url = `${this._apiUrl}/userClocks?1=1${this.forUser ? '&forUser=true' : ''}&${getGridQueryString(this.gridHours).replace("datePart", "clockInDate")}`;
			url += `&where=${getDateRangeWhere('clockInDate', this.startDate, this.endDate)}`;
			if (this.selectedUsers.length > 0 && this.selectedUsers.length != this.lookups.users.length) {
				url += `,userId%20in%20${this.selectedUsers.map(u => u.userId).join(';')},`;
			}

			const hours = await this.dataService.getItems<UserClock>(url).toPromise();
			for (let d of hours.data) {
				d["datePart"] = moment(d.clockInDate).toDate();
			}

			if (this.forUser) {
				this.gridHours.data = hours.data;
				this.totalHours = this.calcDifferenceNumeric(hours.data);
			}
			else {
				this._groupedData = [];
				for (let d of hours.data) {
					let curr = this._groupedData.find(g => g.userId == d.userId && (this.groupedBy == 1 || moment(g.datePart).format("MMDDYYYY") == moment(d["datePart"]).format("MMDDYYYY")));
					if (!curr) {
						curr = {
							userId: d.userId,
							datePart: this.groupedBy == 1 ? null : d["datePart"],
							userClocks: [],
						}
						this._groupedData.push(curr);
					}
					curr.userClocks.push(d);
				}
				this.gridHours.data = this.groupedBy ? this._groupedData.slice() : hours.data;
			}

			if (this.groupedBy < 1) this.gridHours.totalRecords = hours.count;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	printing() {
		if (this._groupedData && this.groupedBy > 0) {
			this.gridHours.data = this._groupedData.filter(g => g.userClocks.length > 0);
		}
	}

	printed() {
		if (this._groupedData && this.groupedBy > 0) {
			this.gridHours.data = this._groupedData.slice();
		}
	}
}
