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

import { EntriesComponent } from './entries.component';
import { EntryStatusComponent } from './entry-status.component';
import { NotifyStatusChangedComponent } from './notify-status-changed.component';

import { MatTabsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule } from '@angular/material';
import { CKEditorModule } from 'ng2-ckeditor';
import { CommonModule } from '@angular/common';
import { EntryRoutingModule } from './entry.routing';
import { SharedModule } from '../shared/shared.module';
import { UserProgressChecklistComponent } from './user-progress-checklist.component';
import { AvailableExtrasComponent } from './available-extras.component';

@NgModule({
	declarations: [
		EntriesComponent,
		EntryStatusComponent,
		NotifyStatusChangedComponent,
		UserProgressChecklistComponent,
		AvailableExtrasComponent,
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
		FlexLayoutModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatButtonModule,
		EntryRoutingModule,
		SharedModule,
	],
	providers: [
		ParserService,
	],
	entryComponents: [
		EntryStatusComponent,
	]
})
export class EntryModule { }
