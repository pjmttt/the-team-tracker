import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User, Company } from './shared/models';
import { validateFormFields } from './shared/utils';
import { AuthService } from './shared/services/auth.service';
import { Router } from '@angular/router';
import { showToastSuccess, showToastError } from './shared/toast-helper';
import { ToastrService } from 'ngx-toastr';
import { ConfigService } from './shared/services/config.service';
import { AuthDataService } from './shared/services/data.service';
import * as moment from 'moment-timezone';
import { NOTIFICATION } from './shared/constants';

@Component({
	selector: 'signup',
	templateUrl: './signup.component.html',
	styleUrls: ['./login.component.css'],
})
export class SignupComponent {
	companyName: string;
	user: User;
	company: Company;
	loading = false;
	password: string;
	passwordConfirm: string;
	timezones: Array<string> = [];

	@ViewChild("form")
	form: NgForm

	constructor(private authService: AuthService, private router: Router, private dataService: AuthDataService,
		private toastr: ToastrService, private configService: ConfigService) {

		this.user = new User();
		this.user.emailNotifications = [NOTIFICATION.TRADE_REQUESTS.value, NOTIFICATION.DAILY_REPORT.value];
		this.user.textNotifications = [NOTIFICATION.TRADE_REQUESTS.value, NOTIFICATION.DAILY_REPORT.value];
		this.user.showOnSchedule = true;
		this.company = new Company();
		this.company.weekStart = 1;
		this.company.minClockDistance = 150;
		this.company.minutesBeforeLate = 7;
		this.company.modules = [0, 1, 2, 3];
		this.timezones = moment.tz.names();
		this.company.timezone = moment.tz.guess();
	}

	async signup() {
		const error = validateFormFields(this.form);
		if (error) {
			showToastError(this.toastr, error);
			return;
		}
		if (this.password != this.passwordConfirm) {
			showToastError(this.toastr, 'Passwords do not match!', true);
			return;
		}
		this.loading = true;
		try {
			const userToken = await this.authService.signup(this.user, this.company, this.password);
			// this.router.navigateByUrl('/setup/users?w=true');
			this.router.navigateByUrl('/subscribe');
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}
}