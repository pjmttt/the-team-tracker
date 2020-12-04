import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthService } from '../shared/services/auth.service';
import { ROLE } from '../shared/constants';
import { EntriesComponent } from './entries.component';
import { UserProgressChecklistComponent } from './user-progress-checklist.component';
import { AvailableExtrasComponent } from './available-extras.component';


const routes: Routes = [
	{
		path: '',
		redirectTo: '/entry/userentries', pathMatch: 'full'
	},
	{ path: 'entries', component: EntriesComponent, canActivate: [AuthService], data: [{ role: ROLE.MANAGER.value, entryType: 0 }] },
	{ path: 'userentries', component: EntriesComponent, canActivate: [AuthService], data: [{ forUser: true, entryType: 0 }] },
	{ path: 'generalentries', component: EntriesComponent, canActivate: [AuthService], data: [{ role: ROLE.MANAGER.value, entryType: 1 }] },
	{ path: 'availableentries', component: AvailableExtrasComponent, canActivate: [AuthService], data: [{ entryType: 1 }] },
	{ path: 'usergeneralentries', component: EntriesComponent, canActivate: [AuthService], data: [{ forUser: true, entryType: 1 }] },
	{ path: 'progresschecklists', component: UserProgressChecklistComponent, canActivate: [AuthService], data: [{ role: ROLE.MANAGER.value }] },
	{ path: 'userprogresschecklists', component: UserProgressChecklistComponent, canActivate: [AuthService], data: [{ forUser: true }] },

];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class EntryRoutingModule { }