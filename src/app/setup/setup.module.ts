import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ToastrModule } from 'ngx-toastr';

import {
	TypeaheadModule,
	ParserService,
	GridViewModule,
	OverlayModule,
	DateTimePickerModule,
	CheckListModule,
	PipesModule,
	ModalDialogModule,
} from 'pajama-angular';

import { SetupComponent } from './setup.component';
import {
	AttendanceReasonsComponent,
	PositionsComponent,
	InventoryCategoriesComponent,
	ShiftsComponent,
	VendorsComponent,
	PayRatesComponent,
	CellPhoneCarriersComponent
} from './setup-grids.component';
import { CompanySettingsComponent } from './company-settings.component';
import { EmployeesComponent } from './employees.component';
import { UsersComponent } from './users.component';
import { TasksComponent } from './tasks.component';
import { StatusEmailTemplateComponent } from "./status-email-template.component";
import { MdePopoverModule } from '@material-extended/mde';
// import { ShiftTaskTemplatesComponent } from './shift-task-templates.component';
// import { ShiftTaskTemplateBulkComponent } from './shift-task-template-bulk.component';
import { StatusesComponent } from './statuses.component';
import { UserNotificationsComponent } from './user-notifications.component';
import { MatTabsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule } from '@angular/material';
import { CKEditorModule } from 'ng2-ckeditor';
import { CommonModule } from '@angular/common';
import { SetupRoutingModule } from './setup.routing';
import { GridViewContainerComponent } from '../shared/gridview-container.component';
import { SharedModule } from '../shared/shared.module';
import { ColorPickerEditComponent } from '../shared/color-picker-edit-template.component';
import { ProgressChecklistsComponent } from './progress-checklists.component';
import { MySettingsComponent } from './my-settings.component';

@NgModule({
	declarations: [
		ShiftsComponent,
		StatusesComponent,
		CompanySettingsComponent,
		AttendanceReasonsComponent,
		PositionsComponent,
		InventoryCategoriesComponent,
		VendorsComponent,
		EmployeesComponent,
		PayRatesComponent,
		UsersComponent,
		TasksComponent,
		StatusEmailTemplateComponent,
		UserNotificationsComponent,
		CellPhoneCarriersComponent,
		ColorPickerEditComponent,
		ProgressChecklistsComponent,
		MySettingsComponent,
	],
	imports: [
		CommonModule,
		FormsModule,
		TypeaheadModule,
		OverlayModule,
		DateTimePickerModule,
		GridViewModule,
		ModalDialogModule,
		CKEditorModule,
		CheckListModule,
		PipesModule,
		MdePopoverModule,
		FlexLayoutModule,
		MatTabsModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatButtonModule,
		SetupRoutingModule,
		SharedModule,
	],
	providers: [
		ParserService,
	],
	entryComponents: [
		ColorPickerEditComponent,
	]
})
export class SetupModule { }
