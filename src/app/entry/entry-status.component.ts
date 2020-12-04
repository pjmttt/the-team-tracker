import { Component, OnInit, EventEmitter } from "@angular/core";
import { GridViewCellTemplateComponent, IDetailGridViewComponent } from "pajama-angular";
import { Entry, Status } from "../shared/models";


@Component({
	selector: 'entry-status',
	templateUrl: 'entry-status.component.html',
	styleUrls: ['entry-status.component.css']
})
export class EntryStatusComponent extends GridViewCellTemplateComponent {
	distinctStatuses: Array<Status> = [];

	get entry(): Entry {
		return <Entry>this.row;
	}

	private get detailGrid(): IDetailGridViewComponent {
		if (this.parentGridViewComponent) {
			return this.parentGridViewComponent.detailGridViewComponents[this.row["_tmp_key_field"]];
		}
		return null;
	}
	get expanded(): boolean {
		if (!this.detailGrid) return false;
		return (this.detailGrid.isExpanded && this.detailGrid.detailGridViewInstance.visible) || false;
	}

	private setDistinctStatus() {
		this.distinctStatuses = [];
		if (!this.entry.entrySubtasks || !this.entry.entrySubtasks.some(es => es.status != null || es.statusId != null)) return;
		for (let est of this.entry.entrySubtasks) {
			if (!est.status && !this.distinctStatuses.find((s) => s.statusId == null)) {
				this.distinctStatuses.push(new Status());
			}
			else if (est.status && !this.distinctStatuses.find((s) => s.statusId == est.status.statusId)) {
				this.distinctStatuses.push(est.status);
			}
		}
		this.distinctStatuses.sort((a, b) => {
			if (!a.abbreviation || a.abbreviation > b.abbreviation) return 1;
			if (!b.abbreviation || a.abbreviation < b.abbreviation) return -1;
			return 0;
		})
	}

	ngOnInit() {
		(<EventEmitter<any>>this.parentGridView.customEvents["statusChanged"]).subscribe((s) => {
			this.setDistinctStatus();
		});
		this.setDistinctStatus();
	}

	expandCollapseEntry() {
		if (!this.detailGrid) return;
		if (!this.detailGrid.detailGridViewInstance.visible) {
			this.detailGrid.detailGridViewInstance.visible = true;
			if (!this.detailGrid.isExpanded)
				this.detailGrid.expandCollapse();
		}
		else
			this.detailGrid.expandCollapse();
	}
}