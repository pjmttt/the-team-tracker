import { Component, ViewContainerRef, ViewChild } from "@angular/core";
import { SetupComponent } from "./setup.component";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { DialogService } from "../shared/services/dialog.service";
import { DataColumn, SortDirection, SelectColumn, ButtonColumn, ModalDialogComponent } from "pajama-angular";
import { Status } from "../shared/models";
import { ToastrService } from "ngx-toastr";
import { ColorPickerEditComponent } from "../shared/color-picker-edit-template.component";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	selector: 'statuses',
	templateUrl: 'statuses.component.html',
})
export class StatusesComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService, private dialogService: DialogService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
	}

	@ViewChild(ModalDialogComponent)
	emailTemplateModal: ModalDialogComponent;

	status: Status;

	get pluralTitle(): string {
		return "Statuses";
	}

	get wizardText() {
		return `Now that you have your tasks and shifts configured, you may configure which statuses you will be giving a task when an employee
		has completed their duties. Such statuses might include complete, incomplete, unsatisfactory. Make sure to select a color and enter
		an abbreviation to make daily duties easier to glance at.`;
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("statusName").setSortDirection(SortDirection.Asc).setRequired());
		this.gridMain.columns.push(new DataColumn("abbreviation").setRequired());
		this.gridMain.columns.push(new DataColumn("notifyManagerAfter"));

		const backgroundCol = new DataColumn("backgroundColor");
		backgroundCol.editTemplate = ColorPickerEditComponent;
		backgroundCol.getRowCellStyle = (row: Status) => {
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
		textCol.getRowCellStyle = (row: Status) => {
			if (!row.textColor) return null;
			const style: any = {};
			if (row.textColor) {
				style.backgroundColor = row.textColor;
				style.color = row.textColor;
			}
			return style;
		}
		this.gridMain.columns.push(textCol)

		if (!this.configService.isMobile) {
			const templateCol = new ButtonColumn();
			templateCol.text = "Template";
			templateCol.width = "80px";
			templateCol.click.subscribe((row: Status) => {
				this.status = row;
				this.emailTemplateModal.show().subscribe(() => this.status = null);
			});
			templateCol.getRowCellClass = (row: Status) => {
				if (!row.statusId) return 'hide-me';
				return '';
			}
			this.gridMain.columns.push(templateCol);
		}
	}

	protected initGrid() {
		this.gridMain.keyFieldName = "statusId";
		this.gridMain.name = "statuses"
	}
}