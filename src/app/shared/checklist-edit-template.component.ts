import { Component } from '@angular/core';
import { GridViewCellTemplateComponent, DataColumn } from 'pajama-angular';

@Component({
	selector: 'checklist-edit-component',
	template: `
<checklist [dataSource]="dataSource" [disableAll]="true" [displayMember]="displayMember" [selectedItems]="selectedItems"></checklist>
	`
})
export class CheckListEditComponent extends GridViewCellTemplateComponent {
	dataSource: Array<any> = [];
	displayMember: string;
	selectedItems: Array<any> = [];
}