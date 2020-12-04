import { GridViewCellTemplateComponent } from "pajama-angular";
import { Component } from "@angular/core";
import { Schedule } from "../shared/models";
import * as moment from 'moment';

@Component({
	template: `
<div *ngIf="schedule">
	{{schedule.user?.displayName}}<br />
	{{dateString}}<br />
	{{startEndTimeString}}<br />
	{{schedule.shift.shiftName}} - {{schedule.task.taskName}}
</div>
	`
})
export class ScheduleSummaryComponent extends GridViewCellTemplateComponent {
	private _schedule: Schedule;

	private dateString: string;
	private startEndTimeString: string;

	get schedule(): Schedule {
		if (!this._schedule) {
			this._schedule = this.row[this.column.fieldName];
			if (this._schedule) {
				this.dateString = moment(this._schedule.scheduleDate).format("L");
				this.startEndTimeString = `${moment(this._schedule.startTime).format("LT")} - ${moment(this._schedule.endTime).format("LT")}`
			}
		}
		return this._schedule;
	}
}