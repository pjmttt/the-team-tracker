import { Injectable, Inject, EventEmitter } from '@angular/core';
import { ModalDialogComponent, Button, DialogResult } from 'pajama-angular';
import { Observable } from 'rxjs';

@Injectable()
export class DialogService {
	yesNoDialog: ModalDialogComponent;

	showYesNoDialog(title, message): Observable<DialogResult> {
		this.yesNoDialog.headerText = title;
		this.yesNoDialog.bodyContent = message;
		return this.yesNoDialog.show(Button.YesNo);
	}
}
