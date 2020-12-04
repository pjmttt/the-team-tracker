import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompanySettingsComponent } from './company-settings.component';
import { AttendanceReasonsComponent, CellPhoneCarriersComponent, PositionsComponent, ShiftsComponent, InventoryCategoriesComponent, VendorsComponent, PayRatesComponent } from './setup-grids.component';
import { AuthService } from '../shared/services/auth.service';
import { ROLE } from '../shared/constants';
import { UsersComponent } from './users.component';
import { UserNotificationsComponent } from './user-notifications.component';
import { EmployeesComponent } from './employees.component';
import { StatusesComponent } from './statuses.component';
import { TasksComponent } from './tasks.component';
import { ProgressChecklistsComponent } from './progress-checklists.component';
import { MySettingsComponent } from './my-settings.component';
// import { ShiftTaskTemplatesComponent } from './shift-task-templates.component';


const routes: Routes = [
	{
		path: '',
		redirectTo: '/setup/companysettings', pathMatch: 'full'
	},
	{
		path: 'attendancereasons',
		component: AttendanceReasonsComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'users',
		component: UsersComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'usernotifications',
		component: UserNotificationsComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }]
	},
	{
		path: 'cellphonecarriers',
		component: CellPhoneCarriersComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'employees',
		component: EmployeesComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }]
	},
	{
		path: 'positions',
		component: PositionsComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'shifts',
		component: ShiftsComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'statuses',
		component: StatusesComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'tasks',
		component: TasksComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value], taskType: 0 }],
	},
	{
		path: 'generaltasks',
		component: TasksComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value], taskType: 1 }],
	},
	{
		path: 'inventorycategories',
		component: InventoryCategoriesComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value, ROLE.INVENTORY.value] }],
	},
	{
		path: 'vendors',
		component: VendorsComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value, ROLE.INVENTORY.value] }],
	},
	{
		path: 'payrates',
		component: PayRatesComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'progresschecklists',
		component: ProgressChecklistsComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'companysettings',
		component: CompanySettingsComponent,
		canActivate: [AuthService],
		data: [{ role: [ROLE.ADMIN.value] }],
	},
	{
		path: 'mysettings',
		component: MySettingsComponent,
		canActivate: [AuthService],
	},

];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class SetupRoutingModule { }