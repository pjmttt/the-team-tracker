import { Component, Type, ViewContainerRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { SetupComponent } from "./setup.component";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { DataColumn, SortDirection, FieldType, ButtonColumn, CheckListComponent, RowArguments, DialogResult } from "pajama-angular";
import { User, Position } from "../shared/models";
import { updateArrayFromSelection, newGuid } from "../shared/utils";
import { ROLE, NOTIFICATION } from "../shared/constants";
import { CheckListEditComponent } from "../shared/checklist-edit-template.component";
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";

@Component({
	selector: 'users',
	template: `
<div class="small-container">
	<div class="header">{{pluralTitle}}</div>
	<div *ngIf="wizard">{{wizardText}}</div>
	<div style="min-width:1150px">
		<gridview-container [grid]="gridMain" (refreshGrid)="refreshGrid(false)" [loading]="loading" [hidePrintButton]="hidePrintButton" [hideButtons]="hideButtons" [helpModal]="helpModal">
		</gridview-container>
	</div>
	<div *ngIf="wizard" fxLayout="row">
		<div *ngIf="wizard" fxFlex="100%" fxLayoutAlign="end" style="margin-top:10px">
			<button mat-raised-button color="primary" (click)="next()">Next</button>
		</div>
	</div>
</div>
<modal-dialog #helpModal [showBackdrop]='true' headerText='Help' [showFooter]="false">
	<div class="modal-dialog-content">
		<div *ngFor="let r of roleKeys" style="margin-bottom:6px">
			<strong>{{role[r].label}}:</strong> {{role[r].description}}<br />
		</div>
	</div>
</modal-dialog>	
`,
})
export class UsersComponent extends SetupComponent {

	templates: { [id: string]: any } = {};
	role = ROLE;
	roleKeys = Object.keys(ROLE);

	constructor(protected dataService: AuthDataService, protected configService: ConfigService, private dialogService: DialogService,
		protected authService: AuthService, protected toastr: ToastrService, protected activatedRoute: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, activatedRoute, router);
		
	}

	get pluralTitle() {
		return "Users";
	}

	get wizardText() {
		return `Your basic user information for your employees may be entered below. This will also specify their login information and roles indicating the types of access they will have.
		Once their information has been entered, you may send them an invite to allow them to configure their password. See help for more information.`;
	}

	protected initColumns() {
		// this.gridMain.columns.push(new DataColumn("userName").setSortDirection(SortDirection.Asc).setSortable().setRequired());
		this.gridMain.columns.push(new DataColumn("firstName").setSortable().setRequired().setWidth("150px"));
		this.gridMain.columns.push(new DataColumn("middleName", "Middle").setWidth("150px"));
		this.gridMain.columns.push(new DataColumn("lastName").setSortable().setRequired().setWidth("150px"));
		this.gridMain.columns.push(new DataColumn("email").setRequired().setWidth("230px"));
		// this.gridMain.columns.push(new DataColumn("phoneNumber", "Phone #").setWidth("80px"));

		const rolesCol = new DataColumn(null, "Roles");
		rolesCol.render = (row: User) => {
			return row.roles.map(r => {
				const role = ROLE[Object.keys(ROLE).find(k => ROLE[k].value == r)]
				if (role) return role.label;
				return '';
			}).filter(r => r != '').join(', ');
		}
		// rolesCol.width = "200px";
		rolesCol.editTemplate = CheckListEditComponent;
		rolesCol.templateInit.subscribe((template: CheckListEditComponent) => {
			const user = <User>template.row;
			const roles = Object.keys(ROLE).map(r => {
				return {
					label: ROLE[r].label,
					value: ROLE[r].value
				}
			});
			template.dataSource = roles;
			template.displayMember = "label";

			if (user.roles) {
				template.selectedItems = user.roles.map(ur => roles.find(r => r.value == ur)).filter(r => r != null);
			}
			const id = newGuid();
			this.templates[id] = template;
			user['rolesTemplateInstanceId'] = id;
		});

		this.gridMain.columns.push(rolesCol);
	}

	private async inviteUser(user: User) {
		const r = await this.dialogService.showYesNoDialog(`Send invitation`,
			`Are you sure you want to send an invitation?`).toPromise();
		if (r == DialogResult.Yes) {
			this.loading = true;
			const apiUrl = this.configService.apiUrl;
			try {
				await this.dataService.post(`${apiUrl}/sendInvitation`, { userId: user.userId }).toPromise();
				this.loading = false;
				showToastSuccess(this.toastr, "Invitation has been sent.");
			}
			catch (e) {
				this.loading = false;
				showToastError(this.toastr, e);
			}
		}
	}

	protected initGrid() {
		this.gridMain.setTempKeyField();
		this.gridMain.name = "users"
		this.gridMain.customProps["idField"] = "userId";
		this.gridMain.customProps["editWidth"] = 1000;
		this.hidePrintButton = true;

		const inviteCol = new ButtonColumn(null, "");
		inviteCol.text = "Invite";
		inviteCol.width = "80px";
		inviteCol.getRowCellClass = (row: User) => {
			if (row.lastActivity || !row.userId) return 'hide-me';
			return '';
		};
		inviteCol.click.subscribe((row: User) => {
			this.inviteUser(row);
		});
		inviteCol.printVisible = false;
		this.gridMain.columns.push(inviteCol);
		this.gridMain.rowCreate.subscribe((args: RowArguments) => {
			const usr = <User>args.row;
			usr.showOnSchedule = true;
			usr.roles = [];
			usr.emailNotifications = [NOTIFICATION.TRADE_REQUESTS.value, NOTIFICATION.DAILY_REPORT.value];
			usr.textNotifications = [NOTIFICATION.TRADE_REQUESTS.value, NOTIFICATION.DAILY_REPORT.value];
		})
	}

	rowSaving = (row: User) => {
		row.roles = [];
		const roleTemplate = <CheckListEditComponent>this.templates[row['rolesTemplateInstanceId']];
		for (let i of roleTemplate.selectedItems) {
			row.roles.push(i.value);
		}
		return Promise.resolve();
	}

	rowSaved = (row: User) => {
		delete this.templates[row['rolesTemplateInstanceId']];
		delete row['rolesTemplateInstanceId'];
		return Promise.resolve();
	}
}
