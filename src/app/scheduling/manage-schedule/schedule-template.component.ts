import { Component, Input, ViewChild } from '@angular/core';
import { ScheduleTemplate, Schedule } from '../../shared/models';
import { NgForm } from '@angular/forms';
import { AuthDataService } from '../../shared/services/data.service';
import { ConfigService } from '../../shared/services/config.service';
import { validateFormFields } from '../../shared/utils';
import { ModalDialogComponent } from 'pajama-angular';
import { ToastrService } from 'ngx-toastr';
import { showToastError } from '../../shared/toast-helper';
import * as moment from 'moment-timezone';

@Component({
	selector: 'schedule-template',
	templateUrl: './schedule-template.component.html',
})
export class ScheduleTemplateComponent {
	@ViewChild("form")
	form: NgForm

	templateName: string;
	loading = false;

	@Input()
	schedules: Array<Schedule>;

	@Input()
	scheduleTemplateModal: ModalDialogComponent;

	@Input()
	apiUrl: string;

	constructor(private dataService: AuthDataService, private toastr: ToastrService) {

	}

	async save() {
		let invalids = validateFormFields(this.form);
		if (invalids) {
			showToastError(this.toastr, invalids);
			return;
		}
		if (this.templateName) {
			this.loading = true;
			const scheduleTemplate = new ScheduleTemplate();
			scheduleTemplate.templateName = this.templateName;
			scheduleTemplate.schedules = this.schedules.map(s => Object.assign({}, s));
			for (let s of scheduleTemplate.schedules) {
				delete s.shift;
				delete s.task;
			}
			try {
				await this.dataService.post<ScheduleTemplate, ScheduleTemplate>(`${this.apiUrl}/scheduleTemplates`, scheduleTemplate).toPromise();
				this.loading = false;
				this.scheduleTemplateModal.hide();
			}
			catch (e) {
				this.loading = false;
				showToastError(this.toastr, e);
			}
		}
		
	}
}
