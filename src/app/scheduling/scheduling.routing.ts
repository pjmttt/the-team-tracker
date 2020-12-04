import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { ROLE } from '../shared/constants';
import { ScheduleComponent } from './manage-schedule/schedule.component';
import { DailyScheduleComponent } from './daily-schedule.component';
import { MyScheduleComponent } from './my-schedule.component';
import { LeaveRequestsComponent } from './leave-requests.component';
import { UserAvailabilityComponent } from './user-availability.component';
import { HoursComponent } from './hours.component';
import { ScheduleTradeComponent } from './schedule-trade.component';
import { TradeBoardComponent } from './trade-board.component';


const routes: Routes = [
	{
		path: '',
		redirectTo: '/scheduling/schedule', pathMatch: 'full'
	},
	{ path: 'schedule', component: ScheduleComponent, canActivate: [AuthService], data: [{ role: ROLE.SCHEDULING.value }] },
	{ path: 'dailyschedule', component: DailyScheduleComponent, canActivate: [AuthService] },
	{ path: 'scheduletrade', component: ScheduleTradeComponent, canActivate: [AuthService], data: [{ role: ROLE.SCHEDULING.value }] },
	{ path: 'mytrades', component: ScheduleTradeComponent, canActivate: [AuthService], data: [{ forUser: true }] },
	{ path: 'tradeboard', component: TradeBoardComponent, canActivate: [AuthService] },
	{ path: 'myschedule', component: MyScheduleComponent, canActivate: [AuthService] },
	{ path: 'leaverequests', component: LeaveRequestsComponent, canActivate: [AuthService], data: [{ role: ROLE.SCHEDULING.value }] },
	{ path: 'myleaverequests', component: LeaveRequestsComponent, canActivate: [AuthService], data: [{ forUser: true }] },
	{ path: 'useravailability', component: UserAvailabilityComponent, canActivate: [AuthService], data: [{ role: ROLE.SCHEDULING.value }] },
	{ path: 'myavailability', component: UserAvailabilityComponent, canActivate: [AuthService], data: [{ forUser: true }] },
	{ path: 'hours', component: HoursComponent, canActivate: [AuthService], data: [{ role: ROLE.SCHEDULING.value }] },
	{ path: 'myhours', component: HoursComponent, canActivate: [AuthService], data: [{ forUser: true }] },

];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class SchedulingRoutingModule { }