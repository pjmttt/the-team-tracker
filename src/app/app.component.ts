import { Component, HostListener, ViewChild, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from './shared/services/auth.service';
import { IUserToken } from './shared/interfaces';
import { ROLE, MODULE } from './shared/constants';
import { ConfigService } from './shared/services/config.service';
import { AuthDataService } from './shared/services/data.service';
import { ModalDialogComponent, Button, DialogResult } from 'pajama-angular';
import { DialogService } from './shared/services/dialog.service';
import { showToastSuccess, showToastError } from './shared/toast-helper';
import { ToastrService, DefaultGlobalConfig } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment-timezone';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
	loggedInUser: IUserToken;
	loading = false;
	role = ROLE;
	module = MODULE;
	development = false;
	expirationDateFormatted: string;
	hasExpired: boolean;
	showSubscriptionErrors: boolean;

	@ViewChild("timeoutDialog")
	timeoutDialog: ModalDialogComponent;

	@ViewChild("outlet")
	outlet: any;

	@ViewChild("confirmDialog")
	get confirmDialog(): ModalDialogComponent {
		return this.dialogService.yesNoDialog;
	}
	set confirmDialog(dlg: ModalDialogComponent) {
		this.dialogService.yesNoDialog = dlg;
	}

	get isAdmin(): boolean {
		return this.loggedInUser && this.loggedInUser.user.roles.indexOf(ROLE.ADMIN.value) >= 0;
	}

	constructor(private authService: AuthService, public configService: ConfigService,
		private dataService: AuthDataService, public dialogService: DialogService,
		private toastr: ToastrService, private router: Router, private route: ActivatedRoute) {
		authService.loggedInUserChanged.subscribe((u) => {
			this.loggedInUser = u;
			this.checkSubscription();
		});
		this.loggedInUser = authService.loggedInUser;
		this.development = configService.development;
		this.checkSubscription();

		this.router.events.subscribe(() => {
			this.checkSubscription();
		});

		if (!this.configService.pingFrequency) return;
		setInterval(() => {
			if (this.ignoreTimer) return;
			this.ping(this.configService.pingFrequency);
		}, this.configService.pingFrequency * 1000);
	}

	ngOnInit() {
		this.ping(-1);
	}

	private ping(frequency) {
		if (this.ignoreTimer) return;
		this.dataService.post<any, any>(`${this.configService.apiUrl}/ping`).subscribe(d => {
			if (d)
				this.loggedInUser.user.runningScore = d.runningScore || 0;
			if (!d || !d.expires)
				return;
			const now = new Date();
			const expiration = new Date(d.expires);
			const diff = expiration.getTime() - now.getTime();
			if (diff < 0) {
				this.timeoutDialog.hide();
				this.authService.logout(true);
			}
			else if (diff < frequency * 1000) {
				this.warnTimer();
			}
		})
	}

	private checkSubscription() {
		this.expirationDateFormatted = "";
		this.hasExpired = false;
		this.showSubscriptionErrors = this.router.url.indexOf('subscribe') < 0;
		if (this.loggedInUser) {
			let expirationDate = moment(this.loggedInUser.user.company.expirationDate);
			if (expirationDate.isBefore(moment())) {
				this.expirationDateFormatted = "";
				this.hasExpired = true;
			}
			else if (expirationDate.isBefore(moment().add(14, 'days'))) {
				this.expirationDateFormatted = expirationDate.format("L");
				this.hasExpired = false;
			}
		}
	}

	private get ignoreTimer(): boolean {
		return this.router.url.indexOf('login') >= 0 ||
			this.router.url.indexOf('signup') >= 0 ||
			// this.router.url.indexOf('home') >= 0 ||
			!this.loggedInUser;
	}

	hasRole(roleId): boolean {
		return this.authService.hasRole(roleId);
	}

	hasModule(moduleId): boolean {
		return this.authService.hasModule(moduleId);
	}

	canSubSetup(roleId): boolean {
		if (this.hasRole(ROLE.ADMIN.value)) return true;
		return this.hasRole(roleId);
	}

	private warnTimer() {
		this.timeoutDialog.show(Button.YesNo).subscribe((r: DialogResult) => {
			if (r == DialogResult.Yes) {
				this.dataService.resetActivity();
			}
			else {
				this.authService.logout(true);
			}
		});
	}

	async clockInOut() {
		this.loading = true;
		try {
			const result = await this.dataService.clockInOutById(this.loggedInUser.user.userId);
			this.loading = false;
			this.loggedInUser.user.clockedIn = !this.loggedInUser.user.clockedIn;
			const opts = new DefaultGlobalConfig();
			opts.positionClass = 'toast-bottom-right';
			this.toastr.success(result.message, null, opts);
			// showToastSuccess(this.toastr, `${result.message}`);
		}
		catch (e) {
			this.loading = false;
			const opts = new DefaultGlobalConfig();
			opts.positionClass = "toast-bottom-right";
			opts.closeButton = true;
			opts.autoDismiss = false;
			opts.timeOut = 0;
			this.toastr.error(e, null, opts);
			// showToastError(this.toastr, e);
		}
	}

	logout() {
		this.authService.logout(false);
	}
}
