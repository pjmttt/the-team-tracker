import { Component, Type, ViewContainerRef } from "@angular/core";
import { Router } from "@angular/router";
import { SetupComponent } from "./setup.component";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { DataColumn, SortDirection, FieldType, DetailGridView, PagingType, RowArguments, SelectColumn } from "pajama-angular";
import { ActivatedRoute } from "@angular/router";
import { ToastrService } from 'ngx-toastr';
import { Task } from "../shared/models";
import { Observable } from "rxjs";
import { ColorPickerEditComponent } from "../shared/color-picker-edit-template.component";
import { DIFFICULTY_LEVEL, MODULE } from "../shared/constants";

@Component({
	selector: 'tasks',
	templateUrl: 'setup.component.html',
})
export class TasksComponent extends SetupComponent {
	taskType = 0;
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
		this.taskType = this.route.snapshot.data[0].taskType;
	}

	get pluralTitle(): string {
		return this.taskType == 0 ? "Tasks" : "Extra Tasks";
	}

	get wizardText() {
		return this.taskType == 0 ? `Within each shift you completed in the previous step, employees may be assigned daily tasks such as cleaning. Each task
		assigned to a user might consist of several subtasks, for example under cleaning you might have floors, windows, etc... Specify them here.` :
			`Some employees might want to go above and beyond and complete one off tasks such as cleaning restrooms. The Team Tracker offers a scoring system to
		award these employees for their effort. Enter some of those extra possible tasks here.`;
	}

	get wizardNextUrl() {
		return this.taskType == 0 && this.authService.hasModule(MODULE.DUTIES.value) ? '/setup/generaltasks' : '/setup/statuses';
	}
	set wizardNextUrl(u: string) { }

	get wizardBackUrl() {
		return this.taskType == 0 ? '/setup/shifts' : '/setup/tasks';
	}
	set wizardBackUrl(u: string) { }

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("taskName").setSortDirection(SortDirection.Asc).setRequired());

		const colorCol = new DataColumn("textColor");
		colorCol.editTemplate = ColorPickerEditComponent;
		colorCol.getRowCellStyle = (row: Task) => {
			const style: any = {};
			if (row.textColor) {
				style.backgroundColor = row.textColor;
				style.color = row.textColor;
			}
			return style;
		}
		this.gridMain.columns.push(colorCol);
	}

	protected initGrid() {
		this.hidePrintButton = true;
		this.gridMain.keyFieldName = "taskId";
		this.gridMain.name = this.taskType == 0 ? "tasks" : "generalTasks";

		if (this.taskType == 0) {
			const detailGridView = new DetailGridView();
			detailGridView.pagingType = PagingType.Disabled;
			detailGridView.setTempKeyField();
			detailGridView.allowAdd = true;
			detailGridView.allowEdit = true;
			detailGridView.allowDelete = true;
			detailGridView.columns.push(new DataColumn("sequence", "Seq")
				.setSortDirection(SortDirection.Asc)
				.setSortable()
				.setRequired()
				.setWidth("80px")
			);
			detailGridView.columns.push(new DataColumn("subtaskName").setSortable().setRequired());
			detailGridView.getChildData = (parent: Task) => new Observable(o => {
				if (!parent.subtasks) parent.subtasks = [];
				return o.next(parent.subtasks);
			});
			detailGridView.rowCreate.subscribe((r: RowArguments) => {
				const dgv = <DetailGridView>r.grid;
				const parentRow = <Task>dgv.parentRow;
				r.row.sequence = (parentRow.subtasks || []).length + 1;
			})
			this.gridMain.detailGridView = detailGridView;
		}
		else {
			const col = new SelectColumn("difficulty");
			col.displayMember = "name";
			col.valueMember = "value";
			col.selectOptions = DIFFICULTY_LEVEL;
			col.required = true;
			this.gridMain.columns.push(col);
			this.gridMain.rowCreate.subscribe((args: RowArguments) => {
				const task = <Task>args.row;
				task.taskType = 1;
			});
		}
	}
}
