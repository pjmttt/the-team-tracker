import { Component, Inject, Input } from "@angular/core";
import { AuthDataService } from "../shared/services/data.service";
import { Status, EmailTemplate } from "../shared/models";
import { EMAIL_TEMPLATE_TYPE } from "../shared/constants";
import { ModalDialogComponent } from "pajama-angular";
import { ConfigService } from "../shared/services/config.service";
import { ToastrService } from "ngx-toastr";
import { showToastError } from "../shared/toast-helper";

@Component({
	selector: 'status-email-template',
	template: `
<div class="modal-dialog-content" *ngIf="managerEmailTemplate">
	<mat-form-field class="full-width">
	<input type="text" name="subject" placeholder="Subject" matInput [(ngModel)]="managerEmailTemplate.subject"
	/>
	</mat-form-field>
	<ckeditor [(ngModel)]="managerEmailTemplate.body"></ckeditor>
	<div fxLayoutAlign="end" fxLayoutGap="15px">
		<img *ngIf="loading" style='width:35px;height:35px' src="data:image/gif;base64,R0lGODlhNgA3APMAAP///wAAAHh4eBwcHA4ODtjY2FRUVNzc3MTExEhISIqKigAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAANgA3AAAEzBDISau9OOvNu/9gKI5kaZ4lkhBEgqCnws6EApMITb93uOqsRC8EpA1Bxdnx8wMKl51ckXcsGFiGAkamsy0LA9pAe1EFqRbBYCAYXXUGk4DWJhZN4dlAlMSLRW80cSVzM3UgB3ksAwcnamwkB28GjVCWl5iZmpucnZ4cj4eWoRqFLKJHpgSoFIoEe5ausBeyl7UYqqw9uaVrukOkn8LDxMXGx8ibwY6+JLxydCO3JdMg1dJ/Is+E0SPLcs3Jnt/F28XXw+jC5uXh4u89EQAh+QQJCgAAACwAAAAANgA3AAAEzhDISau9OOvNu/9gKI5kaZ5oqhYGQRiFWhaD6w6xLLa2a+iiXg8YEtqIIF7vh/QcarbB4YJIuBKIpuTAM0wtCqNiJBgMBCaE0ZUFCXpoknWdCEFvpfURdCcM8noEIW82cSNzRnWDZoYjamttWhphQmOSHFVXkZecnZ6foKFujJdlZxqELo1AqQSrFH1/TbEZtLM9shetrzK7qKSSpryixMXGx8jJyifCKc1kcMzRIrYl1Xy4J9cfvibdIs/MwMue4cffxtvE6qLoxubk8ScRACH5BAkKAAAALAAAAAA2ADcAAATOEMhJq7046827/2AojmRpnmiqrqwwDAJbCkRNxLI42MSQ6zzfD0Sz4YYfFwyZKxhqhgJJeSQVdraBNFSsVUVPHsEAzJrEtnJNSELXRN2bKcwjw19f0QG7PjA7B2EGfn+FhoeIiYoSCAk1CQiLFQpoChlUQwhuBJEWcXkpjm4JF3w9P5tvFqZsLKkEF58/omiksXiZm52SlGKWkhONj7vAxcbHyMkTmCjMcDygRNAjrCfVaqcm11zTJrIjzt64yojhxd/G28XqwOjG5uTxJhEAIfkECQoAAAAsAAAAADYANwAABM0QyEmrvTjrzbv/YCiOZGmeaKqurDAMAlsKRE3EsjjYxJDrPN8PRLPhhh8XDMk0KY/OF5TIm4qKNWtnZxOWuDUvCNw7kcXJ6gl7Iz1T76Z8Tq/b7/i8qmCoGQoacT8FZ4AXbFopfTwEBhhnQ4w2j0GRkgQYiEOLPI6ZUkgHZwd6EweLBqSlq6ytricICTUJCKwKkgojgiMIlwS1VEYlspcJIZAkvjXHlcnKIZokxJLG0KAlvZfAebeMuUi7FbGz2z/Rq8jozavn7Nev8CsRACH5BAkKAAAALAAAAAA2ADcAAATLEMhJq7046827/2AojmRpnmiqrqwwDAJbCkRNxLI42MSQ6zzfD0Sz4YYfFwzJNCmPzheUyJuKijVrZ2cTlrg1LwjcO5HFyeoJeyM9U++mfE6v2+/4PD6O5F/YWiqAGWdIhRiHP4kWg0ONGH4/kXqUlZaXmJlMBQY1BgVuUicFZ6AhjyOdPAQGQF0mqzauYbCxBFdqJao8rVeiGQgJNQkIFwdnB0MKsQrGqgbJPwi2BMV5wrYJetQ129x62LHaedO21nnLq82VwcPnIhEAIfkECQoAAAAsAAAAADYANwAABMwQyEmrvTjrzbv/YCiOZGmeaKqurDAMAlsKRE3EsjjYxJDrPN8PRLPhhh8XDMk0KY/OF5TIm4qKNWtnZxOWuDUvCNw7kcXJ6gl7Iz1T76Z8Tq/b7/g8Po7kX9haKoAZZ0iFGIc/iRaDQ40Yfj+RepSVlpeYAAgJNQkIlgo8NQqUCKI2nzNSIpynBAkzaiCuNl9BIbQ1tl0hraewbrIfpq6pbqsioaKkFwUGNQYFSJudxhUFZ9KUz6IGlbTfrpXcPN6UB2cHlgfcBuqZKBEAIfkECQoAAAAsAAAAADYANwAABMwQyEmrvTjrzbv/YCiOZGmeaKqurDAMAlsKRE3EsjjYxJDrPN8PRLPhhh8XDMk0KY/OF5TIm4qKNWtnZxOWuDUvCNw7kcXJ6gl7Iz1T76Z8Tq/b7yJEopZA4CsKPDUKfxIIgjZ+P3EWe4gECYtqFo82P2cXlTWXQReOiJE5bFqHj4qiUhmBgoSFho59rrKztLVMBQY1BgWzBWe8UUsiuYIGTpMglSaYIcpfnSHEPMYzyB8HZwdrqSMHxAbath2MsqO0zLLorua05OLvJxEAIfkECQoAAAAsAAAAADYANwAABMwQyEmrvTjrzbv/YCiOZGmeaKqurDAMAlsKRE3EsjjYxJDrPN8PRLPhfohELYHQuGBDgIJXU0Q5CKqtOXsdP0otITHjfTtiW2lnE37StXUwFNaSScXaGZvm4r0jU1RWV1hhTIWJiouMjVcFBjUGBY4WBWw1A5RDT3sTkVQGnGYYaUOYPaVip3MXoDyiP3k3GAeoAwdRnRoHoAa5lcHCw8TFxscduyjKIrOeRKRAbSe3I9Um1yHOJ9sjzCbfyInhwt3E2cPo5dHF5OLvJREAOwAAAAAAAAAAAA=="
		/>
		<button mat-raised-button color="primary" (click)="save()" *ngIf="!loading">Save</button>
		<button mat-raised-button color="warn" (click)="hide()" *ngIf="!loading">Cancel</button>
	</div>
</div>
`,
})
export class StatusEmailTemplateComponent {
	comments: string;
	loading = false;
	managerEmailTemplate: EmailTemplate;

	@Input()
	emailTemplateModal: ModalDialogComponent;

	private _status: Status;
	@Input()
	get status(): Status {
		return this._status;
	}
	set status(s: Status) {
		this._status = s;
		this.init().then();
	}

	private apiUrl;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private toastr: ToastrService) {
	}

	async init() {
		this.apiUrl = this.configService.apiUrl;
		if (this.status.managerEmailTemplateId) {
			this.managerEmailTemplate = await this.dataService.get<EmailTemplate>(`${this.apiUrl}/emailTemplates/${this.status.managerEmailTemplateId}`).toPromise();
		}
		else {
			this.managerEmailTemplate = new EmailTemplate();
			this.managerEmailTemplate.templateType = EMAIL_TEMPLATE_TYPE.MANAGER.value;
		}
	}

	async save() {
		if (!this.managerEmailTemplate.subject) {
			showToastError(this.toastr, "Please complete email template");
			return;
		}
		this.loading = true;
		try {
			let savedTemplate: EmailTemplate;
			if (this.managerEmailTemplate.emailTemplateId) {
				savedTemplate = await this.dataService.put<EmailTemplate, EmailTemplate>(`${this.apiUrl}/emailTemplates/${this.managerEmailTemplate.emailTemplateId}`, this.managerEmailTemplate).toPromise();
			}
			else {
				savedTemplate = await this.dataService.post<EmailTemplate, EmailTemplate>(`${this.apiUrl}/emailTemplates`, this.managerEmailTemplate).toPromise();
			}
			if (this.status.managerEmailTemplateId != savedTemplate.emailTemplateId) {
				this.status.managerEmailTemplateId = savedTemplate.emailTemplateId;
				await this.dataService.put<Status, Status>(`${this.apiUrl}/statuses/${this.status.statusId}`, this.status).toPromise();
			}
			this.hide();
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}

	hide() {
		this.managerEmailTemplate = null;
		this._status = null;
		this.emailTemplateModal.hide();
	}
}
