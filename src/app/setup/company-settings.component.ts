import { Component, ViewChild, OnInit, ViewContainerRef } from '@angular/core';
import { NgForm, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthDataService } from '../shared/services/data.service';
import { EmailTemplate, Company } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { IUserToken } from '../shared/interfaces';
import { AuthService } from '../shared/services/auth.service';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { DAYS, EMAIL_TEMPLATE_TYPE } from '../shared/constants';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment-timezone';

@Component({
	selector: 'company-settings',
	templateUrl: './company-settings.component.html',
})
export class CompanySettingsComponent implements OnInit {
	emailTemplates: Array<EmailTemplate>;
	apiUrl: string;
	loggedInUser: IUserToken;
	loading = false;
	selectedTabIndex = 0;
	timezones: Array<string> = [];
	expirationDateFormatted: string;

	days = DAYS;

	emailTemplateType = EMAIL_TEMPLATE_TYPE;
	templateKeys = Object.keys(EMAIL_TEMPLATE_TYPE).filter(k => !EMAIL_TEMPLATE_TYPE[k].hideFromSettings);

	private _emailTemplates: { [templateType: number]: EmailTemplate; } = {};
	get selectedEmailTemplate(): EmailTemplate {
		if (this.selectedTabIndex == 0) return null;
		return this.getEmailTemplate(EMAIL_TEMPLATE_TYPE[this.templateKeys[this.selectedTabIndex - 1]].value)
	}

	constructor(private dataService: AuthDataService, private configService: ConfigService, private authService: AuthService,
		private vcr: ViewContainerRef, private toastr: ToastrService) { 
		this.timezones = moment.tz.names();
	}

	async ngOnInit() {
		this.loggedInUser = this.authService.loggedInUser;
		this.expirationDateFormatted = moment(this.loggedInUser.user.company.expirationDate).format("L");
		if (!this.loggedInUser) return;
		this.loading = true;
		this.apiUrl = this.configService.apiUrl;
		this.emailTemplates = (await this.dataService.getItems<EmailTemplate>(`${this.apiUrl}/emailTemplates`).toPromise()).data;
		this.loading = false;
	}

	async save() {
		let updatePassword = false;
		if (!this.loggedInUser.user.company.companyName) {
			showToastError(this.toastr, 'Company name required', true);
			return;
		}

		this.loading = true;
		try {
			const apiUrl = this.configService.apiUrl;
			await this.dataService.put<Company, Company>(`${this.apiUrl}/companies/${this.loggedInUser.user.company.companyId}`, this.loggedInUser.user.company).toPromise();
			this.authService.updateLoggedInUser(this.loggedInUser);
			await this.dataService.post(`${apiUrl}/emailtemplates`, this.emailTemplates.filter(et => et.subject)).toPromise();
			this.loading = false;
			moment.tz.setDefault(this.loggedInUser.user.company.timezone);
			showToastSuccess(this.toastr, 'Settings have been saved!');
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	async getIP() {
		// ipaddress
		this.loading = true;
		try {
			const apiUrl = this.configService.apiUrl;
			const res = await this.dataService.get<any>(`${this.apiUrl}/ipaddress`).toPromise();
			this.loggedInUser.user.company.ipAddress = res;
			this.loading = false;
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	private getEmailTemplate(templateType: number): EmailTemplate {
		if (!this.emailTemplates) return null;
		if (this._emailTemplates[templateType]) return this._emailTemplates[templateType];
		let emailTemplate = this.emailTemplates.find(t => t.templateType == templateType);
		if (!emailTemplate) {
			emailTemplate = new EmailTemplate();
			emailTemplate.templateType = templateType;
			this._emailTemplates[templateType] = emailTemplate;
			this.emailTemplates.push(emailTemplate);
		}
		return emailTemplate;

	}
}
