import { Component, Input } from '@angular/core';
import { AuthService } from './services/auth.service';
import { getErrorMessage } from './utils';

@Component({
	selector: 'error-message',
	template: `
<div *ngIf="error" class="error-message">{{errorMessage}}</div>
<br />
<br />
	`
})
export class ErrorMessageComponent {

	constructor(private authService: AuthService) {}
	private _error: any;
	@Input()
	get error(): any {
		return this._error;
	}
	set error(e) {
		this._error = e;
		if (e && e.status && e.status == 401) {
			this.authService.logout(true);
		}
	}

	get errorMessage() {
		return getErrorMessage(this.error);
	}
}