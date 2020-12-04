import { NgModule } from "@angular/core";
import { GridViewContainerComponent } from "./gridview-container.component";
import { MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule } from "@angular/material";
import { GridViewModule, OverlayModule } from "pajama-angular";
import { CommonModule } from "@angular/common";

@NgModule({
	declarations: [
		GridViewContainerComponent,
	],
	imports: [
		MatIconModule,
		MatButtonModule,
		MatMenuModule,
		GridViewModule,
		CommonModule,
		OverlayModule,
		MatTooltipModule,
	],
	exports: [
		GridViewContainerComponent,
	]
})
export class SharedModule { }