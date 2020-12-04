import { Component, OnInit, ViewChild, NgZone, ViewContainerRef } from '@angular/core';
import { GridView, DataColumn, FieldType, GridViewComponent, RowArguments, PagingType, SelectColumn, TextAreaColumn, CellArguments } from 'pajama-angular';
import { SortDirection } from 'pajama-angular';
import { AuthDataService } from '../shared/services/data.service';
import { Entry, Task, User, Shift, Status, Attendance, AttendanceReason } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ILookups } from '../shared/interfaces';
import * as moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { getGridQueryString } from '../shared/utils';
import { FILTER_DELAY } from '../shared/constants';

@Component({
	selector: 'attendance',
	templateUrl: './attendance.component.html',
})
export class AttendanceComponent implements OnInit {
	loading = false;
	gridAttendances: GridView;
	lookups: ILookups;
	selectedUsers: Array<User> = [];
	selectedReasons: Array<AttendanceReason> = [];
	forUser = false;
	private _userCol: SelectColumn;
	private _attendanceReasonCol: SelectColumn;

	private reasonClasses: { [name: string]: string } = {};
	private _apiUrl: string;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private router: Router,
		private toastr: ToastrService, private route: ActivatedRoute) {
		this.forUser = this.route.snapshot.data[0] && this.route.snapshot.data[0].forUser;
		this.initGrid();

	}

	private initGrid() {
		this.gridAttendances = new GridView();
		this.gridAttendances.pagingType = PagingType.Manual;
		this.gridAttendances.pageSize = 25;
		this.gridAttendances.saveGridStateToStorage = true;
		this.gridAttendances.name = "gridAttendance";
		this.gridAttendances.disableAutoSort = true;
		this.gridAttendances.allowEdit = !this.forUser;
		this.gridAttendances.rowSave.subscribe((r: RowArguments) => {
			this.saveRow(r);
		});
		this.gridAttendances.rowCreate.subscribe((r: RowArguments) => {
			r.row.attendanceDate = new Date();
		})
		this.gridAttendances.rowInvalidated.subscribe((columns: DataColumn[]) => {
			showToastError(this.toastr, `The following fields are required: ${columns.map(c => c.caption, true).join(', ')}`);
		});

		const attendanceDateCol = new DataColumn("attendanceDate", "Date");
		attendanceDateCol.width = "110px";
		attendanceDateCol.fieldType = FieldType.Date;
		attendanceDateCol.sortable = true;
		attendanceDateCol.sortDirection = SortDirection.Desc;
		this.gridAttendances.columns.push(attendanceDateCol);

		if (!this.forUser) {
			this._userCol = new SelectColumn("userId", "Employee");
			this._userCol.displayMember = "displayName";
			this._userCol.valueMember = "userId";
			this._userCol.parentField = "user";
			this._userCol.width = "140px";
			this._userCol.required = true;
			this._userCol.sortable = true;
			this.gridAttendances.columns.push(this._userCol);
		}

		this._attendanceReasonCol = new SelectColumn("attendanceReasonId", "Reason");
		this._attendanceReasonCol.width = "140px";
		this._attendanceReasonCol.displayMember = "reasonName";
		this._attendanceReasonCol.valueMember = "attendanceReasonId";
		this._attendanceReasonCol.parentField = "attendanceReason";
		this._attendanceReasonCol.required = true;
		this._attendanceReasonCol.sortable = true;
		this._attendanceReasonCol.getRowCellStyle = (row: Attendance) => {
			if (!row.attendanceReason) return null;
			const style: any = {};
			if (row.attendanceReason.textColor) {
				style.color = row.attendanceReason.textColor;
			}
			if (row.attendanceReason.backgroundColor) {
				style.backgroundColor = row.attendanceReason.backgroundColor;
			}
			return style;
		}
		this.gridAttendances.columns.push(this._attendanceReasonCol);
		this.gridAttendances.columns.push(new TextAreaColumn("comments"));

		this.gridAttendances.cellValueChanged.subscribe((args: CellArguments) => {
			if (args.column && args.column.name == this._attendanceReasonCol.name) {
				args.row.attendanceReason = this.lookups.attendanceReasons.find(s => s.attendanceReasonId == args.row.attendanceReasonId);
			}
		});
		this.gridAttendances.loadGridState();
	}

	private _lastChange: Date;
	async filterChanged() {
		this._lastChange = new Date();
		setTimeout(async() => {
			if (moment().diff(moment(this._lastChange)) > FILTER_DELAY - 50) await this.refreshGrid(true);
		}, FILTER_DELAY);
	}

	private saveRow(rowArguments: RowArguments) {
		rowArguments.observable = Observable.create(o => {
			const row = <Attendance>rowArguments.row;
			let observable: Observable<Attendance>;
			if (row.attendanceId) {
				observable = this.dataService.put(`${this._apiUrl}/attendance/${row.attendanceId}`, row);
			}
			else {
				observable = this.dataService.post(`${this._apiUrl}/attendance`, row);
			}
			this.loading = true;
			observable.subscribe(e => {
				Object.assign(row, e);
				this.loading = false;
				showToastSuccess(this.toastr, 'Attendance has been saved');
				o.next();
			}, (e) => {
				this.loading = false;
				showToastError(this.toastr, e);
				o.error(e);
			});
		});
	}

	async ngOnInit() {
		this.loading = true;
		this._apiUrl = this.configService.apiUrl;
		try {
			this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=3`).toPromise();
			if (!this.forUser)
				this._userCol.selectOptions = this.lookups.users;

			this._attendanceReasonCol.selectOptions = this.lookups.attendanceReasons;
		}
		catch (e) {
			showToastError(this.toastr, e);
			this.loading = false;
			return;
		}
		await this.refreshGrid(true);
	}

	async refreshGrid(resetPage: boolean) {
		if (resetPage){
			this.gridAttendances.currentPage = 1;
		}
		this.loading = true
		this.gridAttendances.showNoResults = false;
		try {
			let url = `${this._apiUrl}/attendance?1=1${this.forUser ? '&forUser=true' : ''}&${getGridQueryString(this.gridAttendances)}`;
			if ((this.selectedUsers.length > 0 && this.selectedUsers.length != this.lookups.users.length)
				|| (this.selectedReasons.length > 0 && this.selectedReasons.length != this.lookups.attendanceReasons.length)) {
				url += "&where=";
				if (this.selectedUsers.length > 0 && this.selectedUsers.length != this.lookups.users.length) {
					url += `userId%20in%20${this.selectedUsers.map(u => u.userId).join(';')},`;
				}
				if (this.selectedReasons.length > 0 && this.selectedReasons.length != this.lookups.attendanceReasons.length) {
					url += `attendanceReasonId%20in%20${this.selectedReasons.map(r => r.attendanceReasonId).join(';')}`;
				}
			}
			const attendance = await this.dataService.getItems<Attendance>(url).toPromise();
			this.gridAttendances.data = attendance.data;
			this.gridAttendances.totalRecords = attendance.count;
			this.gridAttendances.showNoResults = true;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}
