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

import { MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatMenuModule, MatCardModule, MatTooltipModule } from '@angular/material';
import { CKEditorModule } from 'ng2-ckeditor';
import { CommonModule } from '@angular/common';
import { SchedulingRoutingModule } from './scheduling.routing';
import { ScheduleTemplateComponent } from './manage-schedule/schedule-template.component';
import { ScheduleComponent } from './manage-schedule/schedule.component';
import { LeaveRequestComponent } from './leave-request.component';
import { LeaveRequestsComponent } from './leave-requests.component';
import { UserAvailabilityComponent } from './user-availability.component';
import { ScheduleDateItemComponent } from './manage-schedule/schedule-date-item.component';
import { DailyScheduleComponent } from './daily-schedule.component';
import { HoursComponent } from './hours.component';
import { MyScheduleComponent } from './my-schedule.component';
import { MdePopoverModule } from '@material-extended/mde';
import { DndModule } from 'ng2-dnd';
import { SharedModule } from '../shared/shared.module';
import { AngularSplitModule } from 'angular-split-ng6';
import { ScheduleBulkComponent } from './manage-schedule/schedule-bulk.component';
import { ScheduleTradeComponent } from './schedule-trade.component';
import { TradeBoardComponent } from './trade-board.component';
import { ScheduleSummaryComponent } from './schedule-summary.component';
import { ScheduleTemplatesComponent } from './manage-schedule/schedule-templates.component';
import { UserAvailabilityBulkComponent } from './user-availability-bulk.component';

@NgModule({
	declarations: [
		ScheduleTemplateComponent,
		ScheduleTemplatesComponent,
		ScheduleComponent,
		LeaveRequestComponent,
		LeaveRequestsComponent,
		UserAvailabilityComponent,
		UserAvailabilityBulkComponent,
		ScheduleDateItemComponent,
		MyScheduleComponent,
		HoursComponent,
		DailyScheduleComponent,
		ScheduleBulkComponent,
		ScheduleTradeComponent,
		TradeBoardComponent,
		ScheduleSummaryComponent,
	],
	imports: [
		CommonModule,
		FormsModule,
		TypeaheadModule,
		OverlayModule,
		DateTimePickerModule,
		GridViewModule,
		ModalDialogModule,
		CheckListModule,
		PipesModule,
		FlexLayoutModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatButtonModule,
		MatMenuModule,
		MatCardModule,
		MdePopoverModule,
		DndModule.forRoot(),
		SchedulingRoutingModule,
		SharedModule,
		AngularSplitModule,
		CKEditorModule,
		MatTooltipModule,
	],
	providers: [
		ParserService,
	],
	entryComponents: [
		ScheduleSummaryComponent,
	]
})
export class SchedulingModule { }
