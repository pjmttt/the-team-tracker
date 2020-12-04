import { Component, ViewContainerRef, OnInit, ViewChild } from "@angular/core";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { ActivatedRoute } from "@angular/router";
import { GridView, PagingType, DataColumn, FieldType, ButtonColumn, SortDirection, RowArguments, GridViewComponent, SelectColumn, CellArguments, DialogResult, ModalDialogComponent, Button } from "pajama-angular";
import { ScheduleTrade, Schedule } from "../shared/models";
import * as moment from 'moment-timezone';
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { AuthService } from "../shared/services/auth.service";
import { DAYS, TRADE_STATUS } from "../shared/constants";
import { ILookups } from "../shared/interfaces";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";
import { ScheduleSummaryComponent } from "./schedule-summary.component";
import { Observable } from "rxjs";

@Component({
	selector: 'schedule-trade',
	templateUrl: 'schedule-trade.component.html'
})
export class ScheduleTradeComponent implements OnInit {
	gridMain: GridView;
	loading = false;
	forUser = false;
	comments: string;

	@ViewChild("tradeApproveDenyModal")
	tradeApproveDenyModal: ModalDialogComponent;

	private _apiUrl: string;
	private approveDenyCols: Array<ButtonColumn> = [];
	private lookups: ILookups;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService, private dialogService: DialogService, private route: ActivatedRoute) {
		this.forUser = this.route.snapshot.data[0] && this.route.snapshot.data[0].forUser;
		this.initGrid();
	}

	private async acceptDeclineTrade(scheduleTrade: ScheduleTrade, accept: boolean) {
		const r = await this.dialogService.showYesNoDialog(`${accept ? 'Accept' : 'Decline'} Trade`,
			`Are you sure you want to ${accept ? 'accept' : 'decline'} the request for ${scheduleTrade.tradeUser ? scheduleTrade.tradeUser['displayName'] : ''}?`
		).toPromise();
		if (r != DialogResult.Yes) return;

		this.loading = true;
		try {
			await this.dataService.put(`${this._apiUrl}/acceptDeclineTrade/${scheduleTrade.scheduleTradeId}`, {
				accept,
				comments: scheduleTrade.comments,
			}).toPromise();
			await this.refreshGrid();
			showToastSuccess(this.toastr, "Trade Status updated");
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	private async approveDenyTrade(scheduleTrade: ScheduleTrade, approve: boolean) {
		this.tradeApproveDenyModal.headerText = `${approve ? 'Approve' : 'Deny'} Trade`;
		const r = await this.tradeApproveDenyModal.show(Button.OKCancel).toPromise();
		if (r != DialogResult.OK) return;

		this.loading = true;
		try {
			await this.dataService.put(`${this._apiUrl}/approveDenyTrade/${scheduleTrade.scheduleTradeId}`, {
				approve,
				comments: this.comments,
			}).toPromise();
			this.comments = "";
			await this.refreshGrid();
			showToastSuccess(this.toastr, "Trade Updated");
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	private initGrid() {
		this.gridMain = new GridView();
		this.gridMain.pagingType = PagingType.Disabled;
		this.gridMain.allowDelete = true;
		this.gridMain.keyFieldName = "scheduleTradeId";

		const sortCol = new DataColumn("schedule.scheduleDate").setSortDirection(SortDirection.Asc);
		sortCol.visible = false;
		sortCol.printVisible = false;
		this.gridMain.columns.push(sortCol);

		const schedCol = new DataColumn("schedule", "Schedule");
		schedCol.template = ScheduleSummaryComponent;
		this.gridMain.columns.push(schedCol);

		const tradeForSchedCol = new DataColumn("tradeForSchedule", "Trade For");
		tradeForSchedCol.template = ScheduleSummaryComponent;
		this.gridMain.columns.push(tradeForSchedCol);

		const tradeUserCol = new DataColumn("tradeUser.displayName", "To");
		this.gridMain.columns.push(tradeUserCol);

		const statusCol = new DataColumn("tradeStatus", "Status");
		this.gridMain.columns.push(statusCol);
		statusCol.render = (row: ScheduleTrade) => Object.keys(TRADE_STATUS).map(k => TRADE_STATUS[k]).find(s => s.value == row.tradeStatus).label;

		this.gridMain.columns.push(new DataColumn("comments"));

		const approveCol = new ButtonColumn();
		approveCol.width = "70px";
		approveCol.printVisible = false;

		const userRowCellClass = (row: ScheduleTrade) => {
			if (row.tradeStatus != TRADE_STATUS.REQUESTED.value) return 'hide-me';
			if (row.schedule && row.schedule.userId != this.authService.loggedInUser.user.userId) return 'hide-me';
			return '';
		};

		if (this.forUser) {
			approveCol.click.subscribe(async (row: ScheduleTrade) => await this.acceptDeclineTrade(row, true));
			approveCol.text = "Accept";
			approveCol.getRowCellClass = userRowCellClass;
		}
		else {
			approveCol.click.subscribe(async (row: ScheduleTrade) => await this.approveDenyTrade(row, true));
			approveCol.text = "Approve";
		}
		this.gridMain.columns.push(approveCol);

		const denyCol = new ButtonColumn();
		denyCol.width = "70px";
		denyCol.printVisible = false;
		if (this.forUser) {
			denyCol.click.subscribe(async (row: ScheduleTrade) => await this.acceptDeclineTrade(row, false));
			denyCol.text = "Decline";
			denyCol.getRowCellClass = userRowCellClass;
		}
		else {
			denyCol.click.subscribe(async (row: ScheduleTrade) => await this.approveDenyTrade(row, false));
			denyCol.text = "Deny";
		}
		this.gridMain.columns.push(denyCol);

		this.gridMain.rowDelete.subscribe((args: RowArguments) => {
			args.observable = Observable.create(async (o) => {
				this.loading = true;
				const id = (<ScheduleTrade>args.row).scheduleTradeId;
				try {
					await this.dataService.delete(`${this._apiUrl}/scheduleTrades/${id}`).toPromise();
					await this.refreshGrid();
					showToastSuccess(this.toastr, "Trade has been deleted.");
					this.loading = false;
					o.next();
				}
				catch (err) {
					showToastError(this.toastr, err);
					this.loading = false;
					o.error(err);
				}
			});
		})
	}

	async ngOnInit() {
		this._apiUrl = this.configService.apiUrl;
		await this.refreshGrid();
	}

	async refreshGrid() {
		try {
			this.loading = true;
			this.gridMain.data = (await this.dataService.getItems<ScheduleTrade>(`${this._apiUrl}/scheduleTrades?${this.forUser ? 'forUser=true' : `status=${TRADE_STATUS.PENDING_APPROVAL.value}`}`).toPromise()).data;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}