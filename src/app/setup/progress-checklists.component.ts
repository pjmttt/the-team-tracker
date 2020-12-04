import { Component, Type, ViewContainerRef } from "@angular/core";
import { SetupComponent } from "./setup.component";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { DataColumn, SortDirection, FieldType, DetailGridView, PagingType, RowArguments, SelectColumn } from "pajama-angular";
import { ToastrService } from 'ngx-toastr';
import { ProgressChecklist, ProgressItem } from "../shared/models";
import { Observable } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	selector: 'progress-checklists',
	templateUrl: 'setup.component.html',
})
export class ProgressChecklistsComponent extends SetupComponent {
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		super(dataService, configService, authService, toastr, route, router);
	}

	get pluralTitle(): string {
		return "Progress Checklists";
	}

	// TODO: do we want a wizard here?
	get wizardText() {
		return null;
	}

	protected initColumns() {
		this.gridMain.columns.push(new DataColumn("checklistName").setSortDirection(SortDirection.Asc).setRequired());
	}

	protected initGrid() {
		this.hidePrintButton = true;
		this.gridMain.keyFieldName = "progressChecklistId";
		this.gridMain.name = "progressChecklists";

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
		detailGridView.columns.push(new DataColumn("itemDescription").setRequired());
		detailGridView.getChildData = (parent: ProgressChecklist) => new Observable(o => {
			if (!parent.progressItems) parent.progressItems = [];
			return o.next(parent.progressItems);
		});
		detailGridView.rowCreate.subscribe((r: RowArguments) => {
			const dgv = <DetailGridView>r.grid;
			const parentRow = <ProgressChecklist>dgv.parentRow;
			r.row.sequence = (parentRow.progressItems || []).length + 1;
		})
		this.gridMain.detailGridView = detailGridView;
	}
}
