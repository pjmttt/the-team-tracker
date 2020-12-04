import { Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { UserComment, User, UserCommentReply } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { AuthDataService } from '../shared/services/data.service';
import { AuthService } from '../shared/services/auth.service';
import { showToastError, showToastSuccess } from '../shared/toast-helper';
import { GridView, PagingType, DataColumn, FieldType, SortDirection, DetailGridView, TextAreaColumn, RowArguments, DialogResult, Button, ModalDialogComponent, ButtonColumn } from 'pajama-angular';
import { ToastrService } from 'ngx-toastr';
import { ILookups } from '../shared/interfaces';
import * as moment from 'moment';
import { FILTER_DELAY } from '../shared/constants';
import { getGridQueryString } from '../shared/utils';
import { Observable } from 'rxjs';

@Component({
	selector: 'message-list',
	template: `
<modal-dialog #replyModal [showBackdrop]='true' headerText='Add Reply'>
	<div *ngIf="replyToUserComment" class="modal-dialog-body">
		<div fxLayout="row">
			<div fxFlex="100%">
				Reply:
				<ckeditor [(ngModel)]="replyToUserComment.replyText" *ngIf="!configService.isMobile"></ckeditor>
				<textarea [(ngModel)]="replyToUserComment.replyText" *ngIf="configService.isMobile" rows="6" style="width:100%"></textarea>
			</div>
		</div>
	</div>
</modal-dialog>
<div fxLayout="row" fxLayoutGap="15px">
	<div fxFlex="50%" fxFlex.lt-md="100%">
		Employee(s):
		<checklist [dataSource]="lookups?.users" [selectedItems]="selectedUsers" (selectionChanged)="filterChanged()" displayMember="displayName"></checklist>
	</div>
</div>
<br />
<div style="min-width:800px">
	<gridview (sortChanged)="refreshGrid(false)" (pageChanged)="refreshGrid(false)" [grid]="gridMain"></gridview>
</div>
<overlay [loading]="loading"></overlay>
`
})
export class MessageListComponent implements OnInit {

	loading = false;
	gridMain: GridView;

	lookups: ILookups;
	selectedUsers: Array<User> = [];
	replyToUserComment: UserCommentReply;

	@ViewChild("replyModal")
	replyModal: ModalDialogComponent;

	private _apiUrl: string;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService) {

		this.initGrid();
	}

	private initGrid() {
		this.gridMain = new GridView();
		this.gridMain.pagingType = PagingType.Manual;
		this.gridMain.pageSize = 25;
		this.gridMain.saveGridStateToStorage = true;
		this.gridMain.name = "gridMessages";
		this.gridMain.disableAutoSort = true;

		this.gridMain.columns.push(new DataColumn("user.displayName", "User").setWidth("150px").setSortable());
		this.gridMain.columns.push(new DataColumn("subject", "Subject").setWidth("150px"));
		const toCol = new DataColumn(null, "Recipient(s)");
		toCol.render = (row: UserComment): string => {
			if (!row.userIds) return '';
			const names = [];
			for (let u of row.userIds) {
				let user = this.lookups.users.find(x => x.userId == u);
				if (user) {
					names.push(user['displayName']);
				}
				if (names.length > 19) {
					names.push('...');
				}
			}
			return names.join(', ');
		};
		this.gridMain.columns.push(toCol);
		this.gridMain.columns.push(new DataColumn("comment", "Message"));
		this.gridMain.columns.push(new DataColumn("commentDate", "Date").setWidth("150px").setFieldType(FieldType.Date).setSortable().setSortDirection(SortDirection.Desc));

		const col = new ButtonColumn();
		col.text = "Reply";
		col.width = "60px";
		col.click.subscribe(async (row: UserComment) => {
			await this.addReply(row);
		})
		col.getRowCellClass = (row: UserComment) => {
			if (!row.userCommentId) return 'hide-me';
			return '';
		}
		this.gridMain.columns.push(col);
		
		const gridDetail = new DetailGridView();
		gridDetail.pagingType = PagingType.Disabled;
		gridDetail.allowAdd = false;
		gridDetail.allowDelete = false;
		gridDetail.columns.push(new TextAreaColumn("replyText").setRequired().setWidth("100%").setReadOnly());
		gridDetail.columns.push(new DataColumn("replyDate").setFieldType(FieldType.Date).setWidth("120px").setSortable().setSortDirection(SortDirection.Desc));
		gridDetail.rowCreate.subscribe(async (r: RowArguments) => {
			r.cancel = true;
			await this.addReply((<DetailGridView>r.grid).parentRow);
			this.gridMain.refreshData();
		});
		gridDetail.getChildData = (parent: UserComment) => {
			return new Observable(o => o.next(parent.userCommentReplys));
		}
		this.gridMain.detailGridView = gridDetail;
		
		this.gridMain.loadGridState();
	}

	private async addReply(userComment: UserComment) {
		this.replyToUserComment = new UserCommentReply();
		this.replyToUserComment.replyDate = new Date();
		this.replyToUserComment.userCommentId = userComment.userCommentId;
		this.replyModal.show(Button.OKCancel).subscribe(async (r: DialogResult) => {
			if (r == DialogResult.OK) {
				this.loading = true;
				try {
					const created = await this.dataService.post<UserCommentReply, UserCommentReply>(`${this._apiUrl}/userCommentReplys`, this.replyToUserComment).toPromise();
					userComment.userCommentReplys.push(created);
					const dind = this.gridMain.data.findIndex(d => d.userCommentId == created.userCommentId);
					const dgv = this.gridMain.gridViewComponent.detailGridViewComponents[this.gridMain.data[dind]._tmp_key_field].detailGridViewInstance;
					dgv.refreshData();
					showToastSuccess(this.toastr, "Reply has been sent.");
					this.loading = false;
				}
				catch (err) {
					showToastError(this.toastr, err);
				}
				this.loading = false;
			}
			this.replyToUserComment = null;
		});
	}

	async ngOnInit() {
		this._apiUrl = this.configService.apiUrl;
		this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=1000`).toPromise();
		await this.refreshGrid(true);
	}

	private _lastChange: Date;
	async filterChanged() {
		this._lastChange = new Date();
		setTimeout(async () => {
			if (moment().diff(moment(this._lastChange)) > FILTER_DELAY - 50) {
				await this.refreshGrid(true);
			}
		}, FILTER_DELAY);
	}

	async refreshGrid(resetPage: boolean) {
		if (resetPage) {
			this.gridMain.currentPage = 1;
		}

		this.loading = true;
		try {

			let url = `${this._apiUrl}/userComments?${getGridQueryString(this.gridMain)}`;
			if (this.selectedUsers.length > 0 && this.selectedUsers.length != this.lookups.users.length) {
				url += `&where=userId%20in%20${this.selectedUsers.map(u => u.userId).join(';')}`;
			}
			const messages = await this.dataService.getItems<UserComment>(url).toPromise();
			this.gridMain.data = messages.data;
			this.gridMain.totalRecords = messages.count;
			this.gridMain.showNoResults = true;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}
