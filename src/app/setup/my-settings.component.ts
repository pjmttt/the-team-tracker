import { Component, ViewChild, OnInit, ViewContainerRef } from '@angular/core';
import { NgForm, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthDataService } from '../shared/services/data.service';
import { ConfigService } from '../shared/services/config.service';
import { IUserToken } from '../shared/interfaces';
import { AuthService } from '../shared/services/auth.service';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { NOTIFICATION, ROLE } from '../shared/constants';
import { ToastrService } from 'ngx-toastr';
import { User, CellPhoneCarrier } from '../shared/models';
import { validateFormFields } from '../shared/utils';

@Component({
	selector: 'my-settings',
	templateUrl: './my-settings.component.html',
})
export class MySettingsComponent implements OnInit {
	apiUrl: string;
	user: User;
	loading = false;
	emailChanged = false;
	password: string;
	passwordConfirm: string;
	cellPhoneCarriers: Array<CellPhoneCarrier> = [];

	notifications: Array<any> = [];
	selectedEmailNotifications: Array<any> = [];
	selectedTextNotifications: Array<any> = [];

	@ViewChild("form")
	form: NgForm;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private vcr: ViewContainerRef, private toastr: ToastrService) {

	}

	async ngOnInit() {
		this.loading = true;
		try {
			this.apiUrl = this.configService.apiUrl;
			this.cellPhoneCarriers = (await this.dataService.getItems<CellPhoneCarrier>(`${this.apiUrl}/cellPhoneCarriers`).toPromise()).data;
			await this.loadUser();
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	async loadUser() {
		this.user = await this.dataService.get<User>(`${this.apiUrl}/mySettings`).toPromise();

		this.notifications = [];

		for (let k of Object.keys(NOTIFICATION)) {
			this.notifications.push(NOTIFICATION[k]);
		}
		
		if (this.user.emailNotifications) {
			this.selectedEmailNotifications = this.user.emailNotifications.map(un => this.notifications.find(n => n.value == un)).filter(n => n != null);
		}
		if (this.user.textNotifications) {
			this.selectedTextNotifications = this.user.textNotifications.map(un => this.notifications.find(n => n.value == un)).filter(n => n != null);
		}
		
	}

	async save() {
		const err = validateFormFields(this.form);
		if (err) {
			showToastError(this.toastr, err, true);
			return;
		}
		if (this.password) {
			if (this.password != this.passwordConfirm) {
				showToastError(this.toastr, 'Passwords do not match!', true);
				return;
			}
			this.user.password = this.password;
		}

		this.user.emailNotifications = [];
		this.user.textNotifications = [];
		
		for (let si of this.selectedEmailNotifications)
		{
			this.user.emailNotifications.push(si.value);
		}

		for (let si of this.selectedTextNotifications)
		{
			this.user.textNotifications.push(si.value);
		}

		this.loading = true;
		try {
			await this.dataService.put<User, User>(`${this.apiUrl}/mysettings/${this.user.userId}`, this.user).toPromise();
			this.password = "";
			this.passwordConfirm = "";
			this.loading = false;
			showToastSuccess(this.toastr, 'Settings have been saved!');
			if (this.emailChanged) {
				this.authService.logout(false);
				return;
			}
			await this.loadUser();
			// this.authService.updateLoggedInUser(this.loggedInUser);
			
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}
}
