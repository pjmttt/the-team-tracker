import { Component, Input, Inject, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthDataService } from '../shared/services/data.service';
import { Entry } from '../shared/models';
import { ModalDialogComponent } from 'pajama-angular';
import { ToastrService } from 'ngx-toastr';
import { showToastError } from '../shared/toast-helper';

@Component({
	selector: 'notify-status-changed',
	templateUrl: './notify-status-changed.component.html',
})
export class NotifyStatusChangedComponent {
	comments: string;
	loading = false;

	@Input()
	entry: Entry;

	@Input()
	apiUrl: string;

	@Input()
	parentDialog: ModalDialogComponent;

	constructor(private dataService: AuthDataService, private toastr: ToastrService) {
	}

	async send() {
		if (!this.comments) {
			showToastError(this.toastr, "Please enter a message");
			return;
		}
		this.loading = true;
		try {

			await this.dataService.post(`${this.apiUrl}/statusChangedComments`, { comments: this.comments, user: this.entry.enteredBy }).toPromise();
			this.parentDialog.hide();
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
	}
}
