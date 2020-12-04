import { Component, ViewChild, ViewContainerRef, Inject, Input } from "@angular/core";
import { DAYS } from "../shared/constants";
import { NgForm } from "@angular/forms";
import { AuthDataService } from "../shared/services/data.service";
import { ConfigService } from "../shared/services/config.service";
import { validateFormFields } from "../shared/utils";
import { showToastError, showToastSuccess } from "../shared/toast-helper";
import { AuthService } from "../shared/services/auth.service";
import { ModalDialogComponent, DialogResult } from "pajama-angular";
import { ILookups } from "../shared/interfaces";
import { ToastrService } from "ngx-toastr";
import * as moment from 'moment-timezone';
import { User, UserAvailability } from "../shared/models";

@Component({
	selector: 'user-availability-bulk',
	templateUrl: 'user-availability-bulk.component.html'
})
export class UserAvailabilityBulkComponent {
	days = DAYS;
	loading = false;
	selectedUsers: Array<User> = [];
	selectedDays: Array<any> = [];
	allDay = false;
	startTime: Date;
	endTime: Date;

	@ViewChild("form")
	form: NgForm;

	@Input()
	bulkModal: ModalDialogComponent;

	@Input()
	lookups: ILookups;

	constructor(private dataService: AuthDataService, private toastr: ToastrService,
		private configService: ConfigService, private authService: AuthService) {

	}

	async save() {
		const err = validateFormFields(this.form);
		if (err) {
			showToastError(this.toastr, err, true);
			return;
		}

		try {
			this.loading = true;
			const apiUrl = this.configService.apiUrl;
			const availabilities = [];
			for (let d of this.selectedDays) {
				for (let u of this.selectedUsers) {
					const availability = new UserAvailability();
					if (this.allDay) {
						availability.allDay = true;
					}
					else {
						availability.startTime = this.startTime;
						availability.endTime = this.endTime;
					}
					availability.dayOfWeek = d.value;
					availability.userId = u.userId;
					availability.status = 1;
					availability.approvedDeniedDate = new Date();
					availability.approvedDeniedById = this.authService.loggedInUser.user.userId;
					availability.approvedDeniedBy = this.authService.loggedInUser.user;
					availabilities.push(availability);
				}
			}
			const createds = await this.dataService.post<UserAvailability[], UserAvailability[]>(`${apiUrl}/userAvailability`, availabilities).toPromise();
			showToastSuccess(this.toastr, "Availability created");
			this.bulkModal.hide(DialogResult.OK);
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	cancel() {
		this.bulkModal.hide();
	}
}