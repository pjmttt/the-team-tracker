import { Component, Type, ViewContainerRef, ViewChild } from "@angular/core";
import { SetupComponent } from "./setup.component";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { DataColumn, SortDirection, FieldType, SelectColumn, NumericColumn, ButtonColumn, DialogResult, GridViewComponent } from "pajama-angular";
import { User, Position } from "../shared/models";
import { ROLE, MODULE } from "../shared/constants";
import { ToastrService } from 'ngx-toastr';
import { CheckListEditComponent } from "../shared/checklist-edit-template.component";
import { updateArrayFromSelection } from "../shared/utils";
import { DialogService } from "../shared/services/dialog.service";
import { showToastError, showToastSuccess } from "../shared/toast-helper";
import { ColorPickerEditComponent } from "../shared/color-picker-edit-template.component";
import { GridViewContainerComponent } from "../shared/gridview-container.component";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	selector: 'employees',
	template: `
<div>
	<div class="header">{{pluralTitle}}</div>
	<div *ngIf="wizard">{{wizardText}}</div>
	<div fxLayout="row" fxLayoutGap="15px" *ngIf="!wizard">
		<div fxFlex="100px">
			Terminated:<br />
			<input type="checkbox" [(ngModel)]="includeTerminated" (ngModelChange)="refreshGrid(true)" />
		</div>
		<div fxFlex="50%">
			Position(s):
			<checklist [dataSource]="lookups?.positions" [selectedItems]="selectedPositions" (selectionChanged)="refreshGrid(true)" displayMember="positionName"></checklist>
		</div>
	</div>
	<br />
	<div style="min-width:1350px">
		<gridview-container [grid]="gridMain" (refreshGrid)="refreshGrid(false)" [loading]="loading" [hideButtons]="true"></gridview-container>
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
`,
})
export class EmployeesComponent extends SetupComponent {
	selectedPositions: Array<Position> = [];
	includeTerminated = false;

	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router,
		private dialogService: DialogService) {
		super(dataService, configService, authService, toastr, route, router);
	}

	get pluralTitle(): string {
		return "Employees";
	}

	get wizardText() {
		return `The last step for setting up your employees will consist of sepcifying information designated towards human resources.`;
	}

	protected initColumns() {
		const user = this.authService.loggedInUser;
		this.gridMain.columns.push(new DataColumn("displayName", "User").setSortable().setSortDirection(SortDirection.Asc).setReadOnly());
		this.gridMain.columns.push(new DataColumn("hireDate").setSortable().setFieldType(FieldType.Date).setWidth("120px"));
		this.gridMain.columns.push(new DataColumn("lastReviewDate").setSortable().setFieldType(FieldType.Date).setWidth("150px"));
		if (user.user.roles.indexOf(ROLE.ADMIN.value) >= 0) {
			this.gridMain.columns.push(new NumericColumn("wage").setWidth("100px"));
			const payRateCol = new SelectColumn("payRateId", "Pay Rate");
			payRateCol.width = "100px";
			payRateCol.selectOptions = this.lookups.payRates;
			payRateCol.valueMember = "payRateId";
			payRateCol.displayMember = "description";
			this.gridMain.columns.push(payRateCol);
			this.gridMain.columns.push(new DataColumn("lastRaiseDate").setSortable().setFieldType(FieldType.Date).setWidth("120px"));
		}
		const positionCol = new SelectColumn("positionId", "Position")
		positionCol.displayMember = "positionName";
		positionCol.valueMember = "positionId";
		positionCol.selectOptions = this.lookups.positions;
		positionCol.getRowCellStyle = (obj: User) => {
			if (!obj.position || !obj.position.textColor) return {};
			return { color: obj.position.textColor, fontWeight: 'bold' };
		}
		this.gridMain.columns.push(positionCol);

		const soc = new DataColumn("showOnSchedule").setWidth("120px").setFieldType(FieldType.Boolean);
		soc.printVisible = false;
		this.gridMain.columns.push(soc);

		const firedCol = new DataColumn("isFired", "Terminated").setWidth("100px").setFieldType(FieldType.Boolean);
		firedCol.printVisible = false;
		this.gridMain.columns.push(firedCol);

		this.gridMain.columns.push(new DataColumn("runningScore").setWidth("90px").setFieldType(FieldType.Numeric));
	}

	protected initGrid() {
		this.gridMain.keyFieldName = "userId";
		this.gridMain.name = "users"
		this.gridMain.disableFilterRow = true;
		this.gridMain.allowDelete = false;
	}

	protected getWhereClause(): string {
		let where = '';
		if (!this.includeTerminated) {
			where += `isFired%20ne%20true,`;
		}
		if (this.selectedPositions.length > 0 && this.selectedPositions.length != this.lookups.positions.length) {
			where += `positionId%20in%20${this.selectedPositions.map(p => p.positionId).join(';')},`
		}
		return where ? `&where=${where}` : "";
	}
}
