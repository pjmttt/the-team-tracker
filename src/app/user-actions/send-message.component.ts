import { Component, ViewChild, OnInit, ViewContainerRef, NgZone } from '@angular/core';
import { UserComment, User, Position } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { NgForm } from '@angular/forms';
import { validateFormFields } from '../shared/utils';
import { AuthDataService } from '../shared/services/data.service';
import { AuthService } from '../shared/services/auth.service';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { ToastrService } from 'ngx-toastr';
import { ILookups } from '../shared/interfaces';
import { CKEDITOR_CONFIG } from '../shared/ckeditor.config';
import { CKEditorComponent } from 'ng2-ckeditor';
import { CheckListComponent } from 'pajama-angular';

@Component({
	selector: 'send-message',
	template: `
<div class="small-container">
	<div fxLayout="row" fxLayoutGap="15px">
		<div fxFlex="30%" fxFlex.lt-md="50%" *ngIf="lookups">
			To:
			<checklist #toChecklist [dataSource]="lookups.users" [selectedItems]="selectedUsers" displayMember="displayName"></checklist>
		</div>
		<div fxFlex="30%" fxFlex.lt-md="50%" *ngIf="lookups">
			Position:
			<checklist #positionChecklist [dataSource]="positions" [selectedItems]="selectedPositions" displayMember="positionName"></checklist>
		</div>
	</div>
	<div fxLayout="row" fxLayoutGap="15px">
		<div fxFlex="60%" fxFlex.lt-md="100%">
			<mat-form-field class="full-width">
				<input matInput placeholder="Subject" [(ngModel)]="userComment.subject" />
			</mat-form-field>
		</div>
	</div>
	<div fxLayout="row" *ngIf="!configService.isMobile">
		<ckeditor [(ngModel)]="userComment.comment" (click)="hideChecklist()" (ready)="editorReady($event)" [config]="ckEditorConfig" #ckeditor></ckeditor>
	</div>
	<div fxLayout="row" *ngIf="configService.isMobile">
		<textarea [(ngModel)]="userComment.comment" rows="10" style="width:100%"></textarea>
	</div>
	<mat-checkbox [(ngModel)]="userComment.sendEmail" placeholder="Email">Email</mat-checkbox>&nbsp;&nbsp;
	<mat-checkbox [(ngModel)]="userComment.sendText" placeholder="Text Message">Text Message</mat-checkbox>
	<div fxLayout="row" fxLayoutAlign="end">
		<button mat-raised-button color="primary" (click)="send()">Send</button>
	</div>
</div>
<overlay [loading]="loading"></overlay>
`
})
export class SendMessageComponent implements OnInit {

	userComment: UserComment;
	loading = false;
	lookups: ILookups;
	ckEditorConfig = CKEDITOR_CONFIG;
	selectedUsers: Array<User> = [];
	selectedPositions: Array<Position> = [];
	positions: Array<Position> = [];

	private _apiUrl: string;

	@ViewChild("form")
	form: NgForm;

	@ViewChild("ckeditor")
	editor: any;

	@ViewChild("toChecklist")
	toChecklist: CheckListComponent;

	@ViewChild("positionChecklist")
	positionChecklist: CheckListComponent;

	constructor(private dataService: AuthDataService, public configService: ConfigService, private authService: AuthService,
		private toastr: ToastrService, private zone: NgZone) {
		this.userComment = new UserComment();
		this.userComment.sendEmail = true;
		this.userComment.sendText = true;
	}

	editorReady(event) {
		event.editor.document.on('click', () => {
			this.hideChecklist();
		});
	}

	hideChecklist() {
		this.zone.run(() => 
		{
			this.toChecklist.dropdownVisible = false;
			this.positionChecklist.dropdownVisible = false;
		});
	}

	async ngOnInit() {
		this._apiUrl = this.configService.apiUrl;
		this.loading = true;
		try {
			this.loading = true;
			this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=1000`).toPromise();
			for (let u of this.lookups.users) {
				if (u.positionId && !this.positions.some(p => p.positionId == u.positionId)) {
					this.positions.push(u.position);
				}
			}
			this.positions.sort((a, b) => {
				if (a.positionName > b.positionName) return 1;
				if (a.positionName < b.positionName) return -1;
				return 0;
			})
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	send() {
		if (!this.userComment.subject || !this.userComment.comment ||
			(!this.userComment.sendEmail && !this.userComment.sendText) || (this.selectedUsers.length < 1 && this.selectedPositions.length < 1)) {
			showToastError(this.toastr, "Subject, comments, email or text and at least one employee or position is required.", true);
			return;
		}
		this.loading = true;
		this.userComment.commentDate = new Date();
		this.userComment.userId = this.authService.loggedInUser.user.userId;
		this.userComment.userIds = this.selectedUsers.map(u => u.userId);
		for (let p of this.selectedPositions) {
			let usrs = this.lookups.users.filter(u => u.positionId && u.positionId == p.positionId);
			for (let u of usrs) {
				if (this.userComment.userIds.indexOf(u.userId) < 0) {
					this.userComment.userIds.push(u.userId);
				}
			}
		}
		this.dataService.post<UserComment, UserComment>(`${this._apiUrl}/userComments`, this.userComment).subscribe(() => {
			this.loading = false;
			showToastSuccess(this.toastr, "Thank you, your message has been sent!");
			this.userComment = new UserComment();
			this.userComment.sendEmail = true;
			this.userComment.sendText = true;
			this.selectedUsers = [];
			this.selectedPositions = [];
		}, (e) => {
			this.loading = false;
			showToastError(this.toastr, e);
		});
	}
}
