import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
	MatInputModule,
	MatButtonModule,
	MatIconModule,
	MatCheckboxModule,
	MatMenuModule,
	MatToolbarModule,
	MatSidenavModule,
	MatRadioModule,
	MatTooltipModule

} from '@angular/material';

import { ToastrModule } from 'ngx-toastr';
import { CKEditorModule } from 'ng2-ckeditor';
import { FileSaverModule } from 'ngx-filesaver';

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

import { AppComponent } from './app.component';
import { LoginComponent } from './login.component';
import { AuthService } from './shared/services/auth.service';
import { ConfigService, ConfigModule } from './shared/services/config.service';
import { AuthDataService } from './shared/services/data.service';
import { ErrorMessageComponent } from './shared/error-message.component';
import { UnauthorizedComponent } from './unauthorized.component';
import { appRoutes } from './app.routes';
import { AttendanceComponent } from './attendance/attendance.component';
import { MessageListComponent } from './user-actions/message-list.component';
import { InventoryComponent } from './inventory/inventory.component';
import { InventoryTransactionEditComponent } from './inventory/inventory-transaction-edit.component';
import { MaintenanceRequestsComponent } from './maintenance/maintenance-requests.component';
import { SignupComponent } from './signup.component';
import { WelcomeComponent } from './welcome.component';
import { CheckListEditComponent } from './shared/checklist-edit-template.component';
import { ContactUsComponent } from './contact-us.component';
import { DialogService } from './shared/services/dialog.service';
import { SendMessageComponent } from './user-actions/send-message.component';
import { AppRoutesModule } from './app.routes';
import { SharedModule } from './shared/shared.module';
import { UserNotesComponent } from './user-actions/user-notes.component';
import { HomeComponent } from './home.component';
import { SubscribeComponent } from './subscribe.component';
import { DocumentsComponent } from './documents/documents.component';
import { DemoComponent } from './demo.component';
import { PrivacyComponent } from './privacy.component';

@NgModule({
	declarations: [
		AttendanceComponent,
		AppComponent,
		ErrorMessageComponent,
		LoginComponent,
		UnauthorizedComponent,
		MessageListComponent,
		InventoryComponent,
		InventoryTransactionEditComponent,
		MaintenanceRequestsComponent,
		SignupComponent,
		WelcomeComponent,
		CheckListEditComponent,
		ContactUsComponent,
		SendMessageComponent,
		UserNotesComponent,
		HomeComponent,
		SubscribeComponent,
		DocumentsComponent,
		DemoComponent,
		PrivacyComponent,
	],
	imports: [
		BrowserModule,
		RouterModule.forRoot(appRoutes),
		TypeaheadModule,
		OverlayModule,
		DateTimePickerModule,
		GridViewModule,
		ModalDialogModule,
		FormsModule,
		HttpModule,
		BrowserAnimationsModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		MatCheckboxModule,
		MatMenuModule,
		CKEditorModule,
		CheckListModule,
		PipesModule,
		ToastrModule.forRoot(),
		FlexLayoutModule,
		MatToolbarModule,
		AppRoutesModule,
		SharedModule,
		MatSidenavModule,
		MatRadioModule,
		MatTooltipModule,
		FileSaverModule,
	],
	providers: [
		AuthService,
		ConfigService,
		ConfigModule.init(),
		ParserService,
		AuthDataService,
		DialogService,
	],
	bootstrap: [AppComponent],
	exports: [
		RouterModule
	],
	entryComponents: [
		CheckListEditComponent,
	]
})
export class AppModule { }
