import { IUserToken } from "../shared/interfaces";
import { AuthService } from "../shared/services/auth.service";
import { MODULE } from "../shared/constants";

export function getWizardNextUrl(authService: AuthService, route: string): string {
	switch (route) {
		case 'attendancereasons':
			if (authService.hasModule(MODULE.INVENTORY.value)) {
				return '/setup/vendors';
			}
			return null;
		case 'employees':
			if (authService.hasModule(MODULE.DUTIES.value) || authService.hasModule(MODULE.SCHEDULING.value)) {
				return '/setup/shifts';
			}
			if (authService.hasModule(MODULE.INVENTORY.value)) {
				return '/setup/vendors';
			}
			return null;
		case 'inventorycategories':
		case 'tasks':
		case 'generaltasks':
			return;
		case 'positions':
			return '/setup/employees';
		case 'shifts':
			return '/setup/tasks';
		case 'statuses':
			return '/setup/attendancereasons';
		case 'users':
			return '/setup/positions';
		case 'vendors':
			return '/setup/inventorycategories';

	}
	throw new Error(route);
}

export function getWizardBackUrl(authService: AuthService, route: string): string {
	switch (route) {
		case 'inventorycategories':
			return '/setup/vendors';
		case 'vendors':
			if (authService.hasModule(MODULE.DUTIES.value) || authService.hasModule(MODULE.SCHEDULING.value)) {
				return '/setup/attendancereasons';
			}
			return '/setup/employees';
		case 'shifts':
			return '/setup/employees';
		case 'statuses':
			if (authService.hasModule(MODULE.DUTIES.value)) {
				return '/setup/generaltasks';
			}
			return '/setup/tasks';
		case 'tasks':
			return '/setup/shifts';
		case 'attendancereasons':
			if (authService.hasModule(MODULE.DUTIES.value)) {
				return '/setup/statuses';
			}
			if (authService.hasModule(MODULE.SCHEDULING.value)) {
				return '/setup/tasks';
			}
		case 'employees':
			return '/setup/positions';
		case 'positions':
			return '/setup/users';
		case 'users':
		case 'generaltasks':
			return null;
	}
	throw new Error(route);
}