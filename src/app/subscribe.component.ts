import { Component, OnInit, ViewChild, QueryList } from '@angular/core';
import { User } from './shared/models';
import { AuthService } from './shared/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from './shared/services/config.service';
import { AuthDataService } from './shared/services/data.service';
import { showToastError } from './shared/toast-helper';
import { ToastrService } from 'ngx-toastr';
import { newGuid } from './shared/utils';

@Component({
	selector: 'subscribe',
	templateUrl: 'subscribe.component.html',
	styleUrls: ['subscribe.component.css']
})
export class SubscribeComponent implements OnInit {
	user: User;
	nightPhoneA: string;
	nightPhoneB: string;
	nightPhoneC: string;
	transactionNumber: string;
	loading: boolean;
	requestNumber: string;
	location: string;
	paypalUrl: string;
	apiUrl: string;
	paypalKey: string;
	modules = { all: true, duties: false, scheduling: false, inventory: false, maintenance: false };

	@ViewChild("frmPaypal")
	frmPaypal: any;

	constructor(private authService: AuthService, private activatedRoute: ActivatedRoute, private configService: ConfigService,
		private dataService: AuthDataService, private toastr: ToastrService, private router: Router) {
		this.user = this.authService.loggedInUser.user;
		this.location = window.location.href;
		if (this.user.phoneNumber) {
			const phoneNum = this.user.phoneNumber.replace(/\D/g, '');
			if (phoneNum.length == 10) {
				this.nightPhoneA = phoneNum.substring(0, 3);
				this.nightPhoneB = phoneNum.substring(3, 6);
				this.nightPhoneC = phoneNum.substring(6);
			}
		}
	}

	async requestSubscription() {
		this.loading = true;
		try {
			let tot = 25;
			if (!this.modules.all) {
				tot = 0;
				if (this.modules.duties) tot += 9;
				if (this.modules.scheduling) tot += 9;
				if (this.modules.inventory) tot += 4.5;
				if (this.modules.maintenance) tot += 4.5;
				if (tot > 25) tot = 25;
			}
			if (tot <= 0) {
				this.loading = false;
				return;
			}
			const opts = this.configService.chargeOptions;
			this.paypalKey = opts.find(o => o.quantity == tot).key;
			const result = await this.dataService.post<any, any>(`${this.apiUrl}/requestSubscription`,
				this.modules).toPromise();
			this.requestNumber = result.subscriptionRequestNumber;
			window.setTimeout(() => {
				const f = this.frmPaypal.nativeElement;
				f.submit();
			}, 150);
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}

	async ngOnInit() {
		this.apiUrl = this.configService.apiUrl;
		this.paypalUrl = this.configService.paypalUrl;
		const users = await this.dataService.getItems<User>(`${this.apiUrl}/users`).toPromise();
		this.activatedRoute.queryParams.subscribe(async p => {
			if (p['tx']) {
				this.transactionNumber = p['tx'];
				await this.processPayment(p['cm']);
			}
		});
	}

	async processPayment(requestNumber) {
		this.loading = true;
		try {
			const apiUrl = this.configService.apiUrl;
			const result = await this.dataService.post<any, any>(`${apiUrl}/processPayment`, { requestNumber, transactionNumber: this.transactionNumber }).toPromise();
			this.user.company.subscriptionTransactionNumber = this.transactionNumber;
			this.user.company.expirationDate = result.expirationDate;
			this.user.company.modules = result.modules;
			this.authService.loggedInUserChanged.emit(this.authService.loggedInUser);
			this.loading = false;
			// this.authService.logout(false);
			this.router.navigateByUrl('/setup/users?w=true');
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
		}
	}
}