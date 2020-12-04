import { Type, Component, ViewContainerRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { SetupComponent } from "./setup.component";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { User, Position, AttendanceReason, Status, EmailTemplate } from "../shared/models";
import { ROLE, DAYS, MODULE } from "../shared/constants";
import { ButtonColumn, SortDirection, FieldType, DataColumn, FilterMode, SelectColumn, CellArguments } from "pajama-angular";
import { getErrorMessage, updateArrayFromSelection } from "../shared/utils";
import { StatusEmailTemplateComponent } from "./status-email-template.component";
import { DialogService } from "../shared/services/dialog.service";
import { ToastrService } from "ngx-toastr";
import { ColorPickerEditComponent } from "../shared/color-picker-edit-template.component";
import * as moment from 'moment-timezone';

@Component({
	selector: 'attendance-reasons',
	templateUrl: 'setup.component.html',
})
export class AttendanceReasonsComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
		this.minWidth = "550px";
	}

	private classes: { [name: string]: string } = {};


	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("reasonName").setSortDirection(SortDirection.Asc).setRequired());
		const backgroundCol = new DataColumn("backgroundColor");
		backgroundCol.editTemplate = ColorPickerEditComponent;
		backgroundCol.getRowCellStyle = (row: AttendanceReason) => {
			if (!row.backgroundColor) return null;
			const style: any = {};
			if (row.backgroundColor) {
				style.backgroundColor = row.backgroundColor;
				style.color = row.backgroundColor;
			}
			return style;
		}
		this.gridMain.columns.push(backgroundCol);

		const textCol = new DataColumn("textColor");
		textCol.editTemplate = ColorPickerEditComponent;
		textCol.getRowCellStyle = (row: AttendanceReason) => {
			if (!row.textColor) return null;
			const style: any = {};
			if (row.textColor) {
				style.backgroundColor = row.textColor;
				style.color = row.textColor;
			}
			return style;
		}
		this.gridMain.columns.push(textCol)
	}

	get pluralTitle(): string {
		return "Attendance Reasons";
	}

	get wizardText() {
		return `Employee attendance is important to any business. There may be several reasons such as being late or sick.
		Configure possible reasons here. Make sure to configure colors to make glancing easier.`;
	}

	protected initGrid() {
		this.hidePrintButton = true;
		this.gridMain.keyFieldName = "attendanceReasonId";
		this.gridMain.name = "attendanceReasons"
	}
}


@Component({
	selector: 'positions',
	templateUrl: 'setup.component.html',
})
export class PositionsComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
	}

	get pluralTitle(): string {
		return "Positions";
	}

	get wizardText() {
		return `Here you may configure positions such as manager or general manager to be associated to employees in the next step.`;
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("positionName").setSortDirection(SortDirection.Asc).setWidth("200px"));

		const textColorCol = new DataColumn("textColor");
		textColorCol.printVisible = false;
		textColorCol.editTemplate = ColorPickerEditComponent;
		textColorCol.getRowCellStyle = (row: Position) => {
			const style: any = {};
			if (row.textColor) {
				style.backgroundColor = row.textColor;
				style.color = row.textColor;
			}
			return style;
		}
		this.gridMain.columns.push(textColorCol);


	}

	protected initGrid() {
		this.gridMain.keyFieldName = "positionId";
		this.gridMain.name = "positions"
	}

	rowSaved = (row: Position) => {
		if (!this.lookups.positions.find(p => p.positionId == row.positionId)) {
			this.lookups.positions.push(row);
		}
		return Promise.resolve();
	}
}

@Component({
	selector: 'shifts',
	templateUrl: 'setup.component.html',
})
export class ShiftsComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
		this.minWidth = "640px";
	}

	get pluralTitle(): string {
		return "Shifts";
	}

	get wizardText() {
		return 'Most likely your employees work different shifts such as AM or PM. Specify those shifts here.';
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("shiftName").setSortDirection(SortDirection.Asc).setSortable().setRequired());
		this.gridMain.columns.push(new DataColumn("startTime").setSortable().setFieldType(FieldType.Time).setRequired());
		this.gridMain.columns.push(new DataColumn("endTime").setSortable().setFieldType(FieldType.Time).setRequired());
		this.gridMain.columns.push(new DataColumn("lunchDuration").setFieldType(FieldType.Numeric));
	}

	protected initGrid() {
		this.gridMain.keyFieldName = "shiftId";
		this.gridMain.name = "shifts"
	}
}

@Component({
	selector: 'pay-rates',
	templateUrl: 'setup.component.html',
})
export class PayRatesComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
	}

	get pluralTitle(): string {
		return "Pay Rates";
	}

	// TODO: remove abstract
	get wizardText() {
		return null;
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("description", "Pay Rate").setSortDirection(SortDirection.Asc));
	}

	protected initGrid() {
		this.gridMain.keyFieldName = "payRateId";
		this.gridMain.name = "payRates";
	}
}

@Component({
	selector: 'inventory-categories',
	templateUrl: 'setup.component.html',
})
export class InventoryCategoriesComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("categoryName").setSortDirection(SortDirection.Asc));
	}

	get pluralTitle(): string {
		return "Inventory Categories";
	}

	get wizardText() {
		return `Now that you have your vendors configured, enter some categories to help organize your inventory such as medical supplies or office supplies.`;
	}

	protected initGrid() {
		this.gridMain.keyFieldName = "inventoryCategoryId";
		this.gridMain.name = "inventoryCategories"
	}
}

@Component({
	selector: 'vendors',
	templateUrl: 'setup.component.html',
})
export class VendorsComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
	}

	get wizardText() {
		return `You most likely purchase your inventory from external vendors or stores, configure them here.`;
	}

	get pluralTitle(): string {
		return "Vendors";
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("vendorName").setSortDirection(SortDirection.Asc));
	}

	protected initGrid() {
		this.gridMain.keyFieldName = "vendorId";
		this.gridMain.name = "vendors"
	}
}

@Component({
	selector: 'cell-phone-carriers',
	templateUrl: 'setup.component.html',
})
export class CellPhoneCarriersComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
	}

	get pluralTitle(): string {
		return "Cell Phone Carriers";
	}

	// TODO: remove abstract once done
	get wizardText() {
		return null;
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("carrierName", "Carrier").setSortDirection(SortDirection.Asc));
		this.gridMain.columns.push(new DataColumn("domain", "Domain"));
	}

	protected initGrid() {
		this.gridMain.keyFieldName = "cellPhoneCarrierId";
		this.gridMain.name = "cellPhoneCarriers"
	}
}
