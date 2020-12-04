import { Component } from '@angular/core';
import { GridViewCellTemplateComponent, DataColumn } from 'pajama-angular';
import { COLORS } from './constants';

@Component({
	selector: 'checklist-edit-component',
	template: `
<select [(ngModel)]="row[column.fieldName]" style="width:100%">
	<option *ngFor="let c of colors" [style.backgroundColor]="c.color" [ngValue]="c.color">{{c.name}}</option>
</select>
	`
})
export class ColorPickerEditComponent extends GridViewCellTemplateComponent {

	colors: Array<any> = [];

	constructor() {
		super();

		this.colors = Object.keys(COLORS).map(k => { return { name: k, color: COLORS[k] } });
		this.colors.sort((a, b) => {
			if (a.name > b.name) return 1;
			if (a.name < b.name) return -1;
			return 0;
		})
	}
}