import { Component, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { GridView, GridViewComponent, PrintOrientation, ModalDialogComponent } from "pajama-angular";

@Component({
	selector: 'gridview-container',
	template: `
<div *ngIf="grid">
	<div class="button-container">
		<button mat-icon-button (click)="helpModal.show()" *ngIf="helpModal">
			<mat-icon color="primary" aria-label="Help">help_outline</mat-icon>
		</button>
		<button mat-icon-button [matMenuTriggerFor]="mnuPrint" matTooltip="Print" *ngIf="!hidePrintButton && !isEditing">
			<mat-icon color="primary" aria-label="Print">local_printshop</mat-icon>
		</button>
		<mat-menu #mnuPrint="matMenu">
			<button mat-menu-item (click)="printGrid(false)">Portrait</button>
			<button mat-menu-item (click)="printGrid(true)">Landscape</button>
		</mat-menu>
		<button mat-icon-button (click)='refreshGrid.emit(true)' matTooltip="Refresh" *ngIf="!isEditing">
			<mat-icon color="primary" aria-label="Refresh">cached</mat-icon>
		</button>
		<!--<button mat-icon-button *ngIf="!hideButtons && isEditing" (click)="saveAll()">
			<mat-icon color="primary" aria-label="Save">done</mat-icon>
		</button>
		<button mat-icon-button *ngIf="!hideButtons && isEditing" (click)="cancelAll()">
			<mat-icon color="primary" aria-label="Cancel">block</mat-icon>
		</button>-->
		<button mat-icon-button (click)='addRow ? addRow() : gridViewComponent.addRow()' matTooltip="Add" *ngIf="!hideButtons" [disabled]="isEditing && !multiAdd">
			<mat-icon color="primary" aria-label="Add">add_circle</mat-icon>
		</button>
	</div>
	<div class="printarea">
		<div *ngIf="grid.printing && printHeader">
			<h4>{{printHeader}}</h4>
		</div>
		<gridview (sortChanged)="refreshGrid.emit(null)" (pageChanged)="refreshGrid.emit(null)" [ngClass]="grid.data?.length > 0 ? 'layout-fixed' : ''" #gridViewComponent [grid]="grid"></gridview>
	</div>
	<overlay [loading]="loading"></overlay>
</div>
`
})
export class GridViewContainerComponent {
	@Input()
	grid: GridView;

	@Input()
	loading: boolean;

	@Input()
	hideButtons: boolean;

	@Input()
	hidePrintButton: boolean;

	@Input()
	printHeader: string;

	@Output()
	refreshGrid = new EventEmitter<any>();

	@Output()
	printing = new EventEmitter<any>();

	@Output()
	printed = new EventEmitter<any>();

	@Input()
	addRow: () => void;

	@Input()
	saveAll: () => void;

	@Input()
	cancelAll: () => void;

	@Input()
	helpModal: ModalDialogComponent;

	@Input()
	multiAdd: boolean;

	@ViewChild(GridViewComponent)
	gridViewComponent: GridViewComponent;

	get isEditing(): boolean {
		return this.gridViewComponent != null && Object.keys(this.gridViewComponent.editingRows).length > 0;
	}

	printGrid(landscape: boolean) {
		this.printing.emit(null);
		// TODO: print detail
		const detail = this.grid.detailGridView;
		this.grid.detailGridView = null;
		this.grid.printSettings.orientation = landscape ? PrintOrientation.Landscape : PrintOrientation.Portrait;
		this.grid.printGrid();
		window.setTimeout(() => {
			this.grid.detailGridView = detail;
			this.printed.emit(null);
		}, 500);
	}
}