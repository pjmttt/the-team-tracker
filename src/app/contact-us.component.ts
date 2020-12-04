import { Component, ViewChild, ViewContainerRef } from "@angular/core";
import { showToastSuccess, showToastError } from './shared/toast-helper';
import { AuthDataService } from "./shared/services/data.service";
import { ConfigService } from "./shared/services/config.service";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";


@Component({
	selector: 'contact-us',
	templateUrl: 'contact-us.component.html'
})
export class ContactUsComponent {
	loading = false;
	message: string;

	constructor(private toastr: ToastrService, private dataService: AuthDataService,
			public configService: ConfigService, private router: Router) {
		
	}

	async send() {
		if (!this.message) {
			showToastError(this.toastr, "Please enter a message.", true);
			return;
		}

		this.loading = true;
		try {
			const apiUrl = this.configService.apiUrl;
			await this.dataService.post(`${apiUrl}/contactus`, { message: this.message }).toPromise();
			showToastSuccess(this.toastr, "Your message has been sent.");
			this.router.navigate(['welcome']);
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}
}