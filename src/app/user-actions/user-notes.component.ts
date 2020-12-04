import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { GridView, DataColumn, FieldType, GridViewComponent, RowArguments, PagingType, NumericColumn, SelectColumn, ButtonColumn, TextAreaColumn, DetailGridView, ModalDialogComponent, Button, DialogResult } from 'pajama-angular';
import { SortDirection } from 'pajama-angular';
import { AuthDataService } from '../shared/services/data.service';
import { User, UserNote } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../shared/services/auth.service';
import { ILookups } from '../shared/interfaces';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { GridViewContainerComponent } from '../shared/gridview-container.component';

@Component({
	selector: 'user-notes',
	templateUrl: 'user-notes.component.html'
})
export class UserNotesComponent implements OnInit {
	loading = false;
	gridNotes: GridView;

	users: Array<User> = [];
	
	private _apiUrl: string;

	userNote: UserNote;

	@ViewChild(ModalDialogComponent)
	noteModal: ModalDialogComponent;

	@ViewChild(GridViewContainerComponent)
	gridViewContainer: GridViewContainerComponent;

	constructor(private dataService: AuthDataService, public configService: ConfigService, private router: Router,
		private toastr: ToastrService, private route: ActivatedRoute, private authService: AuthService) {
		this.initGrid();

	}

	private initGrid() {
		this.gridNotes = new GridView();
		this.gridNotes.keyFieldName = "userId";
		this.gridNotes.pagingType = PagingType.Disabled;

		this.gridNotes.columns.push(new DataColumn("displayName", "Employee"));
		this.gridNotes.columns.push(new DataColumn("position.positionName", "Position"));

		const col = new ButtonColumn();
		col.text = "Add Note";
		col.width = "140px";
		col.click.subscribe(async (row: User) => {
			await this.addNote(row);
		})
		this.gridNotes.columns.push(col);

		const gridDetail = new DetailGridView();
		gridDetail.pagingType = PagingType.Disabled;
		gridDetail.allowAdd = false;
		gridDetail.allowDelete = false;
		gridDetail.columns.push(new DataColumn("note").setWidth("calc(100% - 120px)"));
		gridDetail.columns.push(new DataColumn("noteDate").setFieldType(FieldType.Date).setWidth("120px").setSortable().setSortDirection(SortDirection.Desc));
		gridDetail.getChildData = (parent: User) => {
			return new Observable(o => o.next(parent.userNotes));
		}
		this.gridNotes.detailGridView = gridDetail;
	}

	private async addNote(user: User) {
		this.userNote = new UserNote();
		this.userNote.noteDate = new Date();
		this.userNote.userId = user.userId;
		this.noteModal.show(Button.OKCancel).subscribe(async (r: DialogResult) => {
			if (r == DialogResult.OK) {
				this.loading = true;
				try {
					const created = await this.dataService.post<UserNote, UserNote>(`${this._apiUrl}/userNotes`, this.userNote).toPromise();
					user.userNotes.push(created);
					this.gridViewContainer.gridViewComponent.detailGridViewComponents[user.userId].detailGridViewInstance.refreshData()
					showToastSuccess(this.toastr, "Note as been created.");
					this.loading = false;
				}
				catch (err) {
					showToastError(this.toastr, err);
				}
				this.loading = false;
			}
			this.userNote = null;
		});
	}

	async ngOnInit() {
		this.loading = true;
		this._apiUrl = this.configService.apiUrl;
		try {
			const lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=1000`).toPromise();
			this.users = lookups.users;
			await this.refreshGrid();
		}
		catch (e) {
			showToastError(this.toastr, e);
			this.loading = false;
		}
	}

	async refreshGrid() {
		this.loading = true
		this.gridNotes.showNoResults = false;
		this.gridNotes.data = [];
		for (let usr of this.users) {
			usr.userNotes = [];
		}
		try {
			const userNotes = await this.dataService.getItems<UserNote>(`${this._apiUrl}/userNotes`).toPromise();
			for (let un of userNotes.data) {
				let usr = this.users.find(u => u.userId == un.userId);
				if (!usr) continue;
				usr.userNotes.push(un);
			}
			this.gridNotes.data = this.users;
			this.gridNotes.showNoResults = true;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}
