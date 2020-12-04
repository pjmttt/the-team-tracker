import { Component, Inject, Input, Output, EventEmitter } from "@angular/core";
import { GridView, ModalDialogComponent } from "pajama-angular";
import { ScheduleTemplate } from "../../shared/models";

@Component({
	selector: 'schedule-templates',
	template: `
<div class="modal-dialog-content">
	<div fxLayout="row" *ngFor="let t of scheduleTemplates" style="width:75%">
		<div fxFlex="grow">
			<button class="btn btn-link" (click)="selectTemplate(t.scheduleTemplateId)">{{t.templateName}}</button>
		</div>
		<div fxFlex="200px" fxLayout="row" fxLayoutAlign="end" *ngIf="canDelete">
			<button class="icon-button" *ngIf="!confirmDelete[t.scheduleTemplateId]" (click)="confirmDelete[t.scheduleTemplateId]=true"><span class="icon-remove-black icon-x-small"></span> Delete</button>&nbsp;&nbsp;
			<div *ngIf="confirmDelete[t.scheduleTemplateId]">
				Are you sure?&nbsp;&nbsp;
				<button class="icon-button" (click)="delete(t.scheduleTemplateId)"><span class="icon-check-black icon-x-small"></span> Yes</button>&nbsp;&nbsp;
				<button class="icon-button" (click)="confirmDelete[t.scheduleTemplateId]=false"><span class="icon-cancel-black icon-x-small"></span> No</button>&nbsp;&nbsp;		</div>
			</div>
		</div>
	</div>
<div>
	`
})
export class ScheduleTemplatesComponent {
	@Input()
	scheduleTemplates: Array<ScheduleTemplate>;

	@Input()
	scheduleTemplatesModal: ModalDialogComponent;

	@Output()
	scheduleTemplateSelected = new EventEmitter<string>();

	@Output()
	scheduleTemplateDelete = new EventEmitter<string>();

	@Input()
	canDelete: boolean;

	confirmDelete: { [id: string]: boolean } = {};

	constructor() {
	}

	delete(scheduleTemplateId) {
		this.scheduleTemplateDelete.emit(scheduleTemplateId);
		this.confirmDelete[scheduleTemplateId] = false;
	}

	selectTemplate(scheduleTemplateId) {
		this.scheduleTemplateSelected.emit(scheduleTemplateId);
		this.scheduleTemplatesModal.hide();
	}
}