import { Component, ViewChild } from '@angular/core';
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
	selector: 'demo',
	templateUrl: './demo.component.html',
	styleUrls: ['./login.component.css'],
})
export class DemoComponent {
	firstName: string;
	lastName: string;
	companyName: string;
	phoneNumber: string;
	email: string;
	loading = false;
	requested = false;

	@ViewChild("form")
	form: NgForm

	constructor(private authService: AuthService, private router: Router, private dataService: AuthDataService,
		private toastr: ToastrService, private configService: ConfigService) {
	}

	async request() {
		const error = validateFormFields(this.form);
		if (error) {
			showToastError(this.toastr, error);
			return;
		}
		this.loading = true;
		try {
			await this.authService.requestDemo(this.firstName, this.lastName, this.companyName, this.phoneNumber, this.email);
			this.requested = true;
			this.loading = false;
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}
}