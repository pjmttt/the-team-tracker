import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from './shared/services/auth.service';
import { UnauthorizedComponent } from './unauthorized.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { InventoryComponent } from './inventory/inventory.component';
import { ROLE } from './shared/constants';
import { MaintenanceRequestsComponent } from './maintenance/maintenance-requests.component';
import { SignupComponent } from './signup.component';
import { WelcomeComponent } from './welcome.component';
import { ContactUsComponent } from './contact-us.component';
import { UserAvailability } from './shared/models';
import { MessageListComponent } from './user-actions/message-list.component';
import { SendMessageComponent } from './user-actions/send-message.component';
import { NgModule } from '@angular/core';
import { UserNotesComponent } from './user-actions/user-notes.component';
import { HomeComponent } from './home.component';
import { SubscribeComponent } from './subscribe.component';
import { DocumentsComponent } from './documents/documents.component';
import { DemoComponent } from './demo.component';
import { PrivacyComponent } from './privacy.component';

export const appRoutes: Routes = [
	{ path: 'home', component: HomeComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'setup', loadChildren: 'app/setup/setup.module#SetupModule' },
	{ path: 'scheduling', loadChildren: 'app/scheduling/scheduling.module#SchedulingModule' },
	{ path: 'entry', loadChildren: 'app/entry/entry.module#EntryModule' },
	{ path: 'attendance', component: AttendanceComponent, canActivate: [AuthService], data: [{ role: [ROLE.MANAGER.value, ROLE.SCHEDULING.value] }] },
	{ path: 'userattendance', component: AttendanceComponent, canActivate: [AuthService], data: [{ forUser: true }] },
	{ path: 'sendmessage', component: SendMessageComponent, canActivate: [AuthService] },
	{ path: 'messagelist', component: MessageListComponent, canActivate: [AuthService], data: [{ role: ROLE.ADMIN.value }] },
	{ path: 'inventoryitems', component: InventoryComponent, canActivate: [AuthService], data: [{ role: ROLE.INVENTORY.value }] },
	{ path: 'maintenancerequests', component: MaintenanceRequestsComponent, canActivate: [AuthService] },
	{ path: 'documents', component: DocumentsComponent, canActivate: [AuthService] },
	{ path: 'usernotes', component: UserNotesComponent, canActivate: [AuthService], data: [{ role: ROLE.ADMIN.value }] },
	{ path: 'unauthorized', component: UnauthorizedComponent, canActivate: [AuthService] },
	{ path: 'welcome', component: WelcomeComponent, canActivate: [AuthService] },
	{ path: 'signup', component: SignupComponent },
	{ path: 'demo', component: DemoComponent },
	{ path: 'subscribe', component: SubscribeComponent, canActivate: [AuthService], data: [{ role: ROLE.ADMIN.value }] },
	{ path: 'contactus', component: ContactUsComponent },
	{ path: 'privacy', component: PrivacyComponent },
	{ path: '', redirectTo: '/home', pathMatch: 'full' }
];

@NgModule({
	imports: [
		RouterModule.forRoot(appRoutes)
	],
	exports: [RouterModule],
	providers: []
})
export class AppRoutesModule {}