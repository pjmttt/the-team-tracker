import { Component, ViewChild, ViewContainerRef, Inject, Input } from "@angular/core";
import { LeaveRequest } from "../shared/models";
import { AuthDataService } from "../shared/services/data.service";
import { validateFormFields } from "../shared/utils";
import { NgForm } from "@angular/forms";
import { ConfigService } from "../shared/services/config.service";
import { AuthService } from "../shared/services/auth.service";
import { showToastSuccess, showToastError } from "../shared/toast-helper";
import { ModalDialogComponent } from "pajama-angular";
import { ILookups } from "../shared/interfaces";
import { ToastrService } from "ngx-toastr";
import * as moment from 'moment';
import { ROLE } from "../shared/constants";

@Component({
	selector: 'leave-request',
	templateUrl: 'leave-request.component.html'
})
export class LeaveRequestComponent {
	scheduleType = 0;
	startDate: Date;
	startTime: Date;
	endDate: Date;
	endTime: Date;
	reason: string;
	userId: string;

	@ViewChild("form")
	form: NgForm;

	loading = false;

	@Input()
	forUser: boolean;

	@Input()
	lookups: ILookups;

	@Input()
	leaveRequestModal: ModalDialogComponent;

	constructor(private dataService: AuthDataService, private toastr: ToastrService,
		private configService: ConfigService, private authService: AuthService) {
		
	}

	async save() {
		const err = validateFormFields(this.form);
		if (err) {
			showToastError(this.toastr, err, true);
			return;
		}

		const leaveRequest = new LeaveRequest();
		leaveRequest.userId = this.forUser ? this.authService.loggedInUser.user.userId : this.userId;
		if (!this.forUser || this.authService.hasRole(ROLE.SCHEDULING.value)) {
			leaveRequest.status = 1;
			leaveRequest.approvedDeniedById = this.authService.loggedInUser.user.userId;
			leaveRequest.approvedDeniedDate = moment().toDate();
		}
		leaveRequest.reason = this.reason;
		leaveRequest.startDate = new Date(this.startDate);
		if (this.scheduleType == 1) {
			leaveRequest.endDate = new Date(this.endDate);
		}
		else if (this.scheduleType == 2) {
			leaveRequest.endDate = new Date(this.startDate);
			leaveRequest.startDate.setHours(this.startTime.getHours());
			leaveRequest.startDate.setMinutes(this.startTime.getMinutes());
			leaveRequest.endDate.setHours(this.endTime.getHours());
			leaveRequest.endDate.setMinutes(this.endTime.getMinutes());
		}


		try {
			this.loading = true;
			const apiUrl = this.configService.apiUrl;
			const created = await this.dataService.post<LeaveRequest, LeaveRequest>(`${apiUrl}/leaveRequests`, leaveRequest).toPromise();
			showToastSuccess(this.toastr, "Time Off created");
			this.startDate = null;
			this.endDate = null;
			this.startTime = null;
			this.endTime = null;
			this.reason = null;
			this.userId = null;
			this.scheduleType = 0;
			this.leaveRequestModal.tag = created;
			this.leaveRequestModal.hide();
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}