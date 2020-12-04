import { Component, Type, ViewContainerRef, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { SetupComponent } from "./setup.component";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { DataColumn, SortDirection, FieldType, ButtonColumn, CheckListComponent, RowArguments, DialogResult, SelectColumn } from "pajama-angular";
import { User, Position, CellPhoneCarrier } from "../shared/models";
import { updateArrayFromSelection } from "../shared/utils";
import { NOTIFICATION } from "../shared/constants";
import { CheckListEditComponent } from "../shared/checklist-edit-template.component";
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";

@Component({
	selector: 'user-notifications',
	template: `
	<div class="small-container">
	<div class="header">{{pluralTitle}}</div>
	<div *ngIf="wizard">{{wizardText}}</div>
	<div style="min-width:1150px">
		<gridview-container [grid]="gridMain" (refreshGrid)="refreshGrid(false)" [loading]="loading" [hidePrintButton]="hidePrintButton" [hideButtons]="hideButtons" [helpModal]="helpModal">
		</gridview-container>
	</div>
	<div *ngIf="wizard" fxLayout="row">
		<div fxFlex="50%" style="margin-top:10px">
			<button mat-raised-button color="primary" (click)="back()">Back</button>
		</div>
		<div fxFlex="50%" fxLayoutAlign="end" style="margin-top:10px">
			<button mat-raised-button color="primary" (click)="next()">Next</button>
		</div>
	</div>
</div>
<modal-dialog #helpModal [showBackdrop]='true' headerText='Help' [showFooter]="false">
	<div class="modal-dialog-content">
		<div *ngFor="let n of notificationKeys" style="margin-bottom:6px">
			<strong>{{notification[n].label}}:</strong> {{notification[n].description}}<br />
		</div>
	</div>
</modal-dialog>	
`
})
export class UserNotificationsComponent extends SetupComponent {
	notification = NOTIFICATION;
	notificationKeys = Object.keys(NOTIFICATION);

	private _carrierCol: SelectColumn;

	constructor(protected dataService: AuthDataService, protected configService: ConfigService, private dialogService: DialogService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
			this.hideButtons = true;
	}

	get pluralTitle() {
		return "User Notifications";
	}

	get wizardText() {
		return `Now that you have your employee login information established, you may specify notification information for each. Notifications may
		be sent via email, text message, or both. Note, email addresses cannot be modified on this page since they will affect an employee's login
		information. Once their contact information has been established, you may specify which events will trigger notifications to the specified
		employee. See help for more information.`;
	}

	async ngOnInit() {
		this.loading = true;
		const apiUrl = this.configService.apiUrl;
		const carriers = (await this.dataService.getItems<CellPhoneCarrier>(`${apiUrl}/cellPhoneCarriers`).toPromise()).data;
		await super.ngOnInit();
		this._carrierCol.selectOptions = carriers
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("displayName").setReadOnly().setSortDirection(SortDirection.Asc).setSortable().setWidth("150px"));
		this.gridMain.columns.push(new DataColumn("phoneNumber").setWidth("100px"));
		this.gridMain.columns.push(new DataColumn("email").setRequired().setWidth("200px").setReadOnly());
		this.gridMain.allowDelete = false;

		this._carrierCol = new SelectColumn("cellPhoneCarrierId", "Carrier");
		this._carrierCol.width = "120px";
		this._carrierCol.valueMember = "cellPhoneCarrierId";
		this._carrierCol.displayMember = "carrierName";
		this.gridMain.columns.push(this._carrierCol);

		this.gridMain.columns.push(new DataColumn("enableEmailNotifications", "Enable Emails").setFieldType(FieldType.Boolean).setWidth("90px"));
		const emailNotificationsCol = new DataColumn(null, "Email Notifications");
		emailNotificationsCol.render = (row: User) => {
			return row.emailNotifications.map(n => {
				const notification = NOTIFICATION[Object.keys(NOTIFICATION).find(k => NOTIFICATION[k].value == n)]
				if (notification) return notification.label;
				return '';
			}).filter(n => n != '').join(', ');
		}
		emailNotificationsCol.editTemplate = CheckListEditComponent;
		emailNotificationsCol.templateInit.subscribe((template: CheckListEditComponent) => {
			const user = <User>template.row;
			const notifications = Object.keys(NOTIFICATION).map(n => {
				return {
					label: NOTIFICATION[n].label,
					value: NOTIFICATION[n].value
				}
			});
			template.dataSource = notifications;
			template.displayMember = "label";

			if (user.emailNotifications) {
				template.selectedItems = user.emailNotifications.map(un => notifications.find(n => n.value == un)).filter(n => n != null);
			}
			user['emailNotificationsCol'] = template;
		})

		this.gridMain.columns.push(emailNotificationsCol);

		this.gridMain.columns.push(new DataColumn("enableTextNotifications", "Enable Text").setFieldType(FieldType.Boolean).setWidth("90px"));
		const textMessageNotificationsCol = new DataColumn(null, "Text Notifications");
		textMessageNotificationsCol.render = (row: User) => {
			return row.textNotifications.map(n => {
				const notification = NOTIFICATION[Object.keys(NOTIFICATION).find(k => NOTIFICATION[k].value == n)]
				if (notification) return notification.label;
				return '';
			}).filter(n => n != '').join(', ');
		}
		textMessageNotificationsCol.editTemplate = CheckListEditComponent;
		textMessageNotificationsCol.templateInit.subscribe((template: CheckListEditComponent) => {
			const user = <User>template.row;
			const notifications = Object.keys(NOTIFICATION).map(n => {
				return {
					label: NOTIFICATION[n].label,
					value: NOTIFICATION[n].value
				}
			});
			template.dataSource = notifications;
			template.displayMember = "label";

			if (user.textNotifications) {
				template.selectedItems = user.textNotifications.map(un => notifications.find(n => n.value == un)).filter(n => n != null);
			}
			user['textMessageNotificationsCol'] = template;
		})

		this.gridMain.columns.push(textMessageNotificationsCol);

	}

	protected initGrid() {
		this.gridMain.keyFieldName = "userId";
		this.gridMain.name = "users"
		this.gridMain.customProps["editWidth"] = 1000;
	}

	rowSaving = (row: User) => {
		row.emailNotifications = [];
		row.textNotifications = [];
		
		let notificationTemplate = <CheckListEditComponent>row['emailNotificationsCol'];
		row['emailNotificationsCol'] = null;

		for (let si of notificationTemplate.selectedItems)
		{
			row.emailNotifications.push(si.value);
		}

		notificationTemplate = <CheckListEditComponent>row['textMessageNotificationsCol'];
		row['textMessageNotificationsCol'] = null;
		
		for (let si of notificationTemplate.selectedItems)
		{
			row.textNotifications.push(si.value);
		}
		return Promise.resolve();
	}
}
