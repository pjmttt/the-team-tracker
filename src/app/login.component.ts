import { Router, ActivatedRoute } from '@angular/router';
import { Component, ViewChild, OnInit, ViewContainerRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from './shared/services/auth.service';
import { ToCamelCasePipe } from 'pajama-angular';
import { ROLE } from './shared/constants';
import { showToastSuccess, showToastError } from './shared/toast-helper';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
	@ViewChild("form")
	form: NgForm;
	error: any;
	email: string;
	password: string;
	passwordConfirm: string;
	forgotPassword: number = -1;
	loading: boolean;
	key: string;
	timedOut: boolean;
	rememberMe: boolean;

	constructor(private authService: AuthService, public router: Router, private route: ActivatedRoute,
		private toastr: ToastrService) {

	}

	enter(event) {
		if (event.keyCode == 13) {
			event.stopPropagation();
			event.preventDefault();
			this.login();
			return false;
		} else {
		}
	}

	ngOnInit() {
		this.route
			.queryParams
			.subscribe(params => {
				if (params.key) {
					this.key = params.key;
					this.forgotPassword = 3;
				}
				else {
					this.forgotPassword = 0;
				}

				if (params.timedOut) {
					this.error = "Your session has timed out!";
				}
			});
	}

	validateForm(): boolean {
		if (!this.form.valid) {
			const errs = [];
			for (let c in this.form.controls) {
				if (!this.form.controls[c].valid) {
					errs.push(new ToCamelCasePipe().transform(c));
				}
			}
			showToastError(this.toastr, `The following fields are invalid: ${errs.join(', ')}`, true);
			return false;
		}
		return true;
	}

	async login() {
		this.error = null;
		if (!this.validateForm()) return;
		this.loading = true;
		try {
			if (this.email && this.password) {
				await this.authService.login(this.email, this.password, this.rememberMe);
				this.router.navigateByUrl('/welcome');
			}
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	async next() {
		this.error = null;
		if (!this.email) {
			showToastError(this.toastr, "Please enter an email address.", true);
			return;
		}
		this.loading = true;
		try {
			await this.authService.forgotPassword(this.email);
			this.forgotPassword = 2;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	back(reroute) {
		this.error = null;
		if (reroute) {
			this.router.navigate(['login']);
		}
		else {
			this.forgotPassword = 0;
		}
	}

	async resetPassword() {
		this.error = null;
		if (!this.password) {
			showToastError(this.toastr, 'Password required!', true);
			return;
		}
		if (this.password != this.passwordConfirm) {
			showToastError(this.toastr, 'Passwords do not match!', true);
			return;
		}
		this.loading = true;
		try {
			const userToken = await this.authService.resetPassword(this.key, this.password);
			this.router.navigateByUrl('/');
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	async clockIn() {
		this.error = null;
		if (!this.validateForm()) return;
		this.loading = true;
		try {
			if (this.email && this.password) {
				const result = await this.authService.clockIn(this.email, this.password);
				this.loading = false;
				showToastSuccess(this.toastr, `${result.message}`);
			}
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	async clockOut() {
		this.error = null;
		if (!this.validateForm()) return;
		this.loading = true;
		try {
			if (this.email && this.password) {
				const result = await this.authService.clockOut(this.email, this.password);
				this.loading = false;
				showToastSuccess(this.toastr, `${result.message}`);
			}
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}
}
