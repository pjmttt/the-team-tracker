import { ToCamelCasePipe, GridView, SortDirection, SelectColumn, PagingType } from 'pajama-angular';
import { NgForm } from '@angular/forms';
import * as moment from 'moment';

export function newGuid(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

export function validateFormFields(form: NgForm) {
	const invalids = [];
	for (let c in form.controls) {
		const control = form.controls[c];
		if (!control.valid) {
			const camCase = new ToCamelCasePipe().transform(c);
			invalids.push(`${camCase.substring(0, 1).toUpperCase()}${camCase.substring(1)}`);
		}
	}
	if (invalids.length > 0) {
		return `The following fields are invalid: ${invalids.join(', ')}`;
	}
	return null;
}

export function updateArrayFromSelection(toUpdate: Array<any>, selected: Array<any>, matchOnField: Array<string>, idField: string) {
	const found = [];
	for (let s of selected) {
		const curr = toUpdate.find(u => u[matchOnField[0]] == s[matchOnField[matchOnField.length - 1]]);
		if (curr) {
			found.push(curr[idField]);
			continue;
		}
		let newItem = {};
		newItem[matchOnField[0]] = s[matchOnField[matchOnField.length - 1]]
		toUpdate.push(newItem);
	}
	for (let i = toUpdate.length - 1; i >= 0; i--) {
		if (toUpdate[i][idField] && found.indexOf(toUpdate[i][idField]) < 0) {
			toUpdate.splice(i, 1);
		}
	}
}

export function getErrorMessage(error): string {
	console.log("=== ERROR:", error);
	if (error._body) {
		try {
			const bod = JSON.parse(error._body);
			if (bod.message) {
				return bod.message;
			}
		}
		catch { }
		return error._body;
	}
	else if (error.message) {
		return error.message;
	}
	return error;
}

export function toLocalTime(val) {
	if (!val) return val;
	const dt = new Date(val);
	if (dt && dt.setHours) {
		dt.setHours(dt.getHours() - (dt.getTimezoneOffset() / 60));
	}
	return dt;
}

export function getGridQueryString(grid: GridView) {
	let qry = grid.pagingType != PagingType.Manual ? '' : `limit=${grid.pageSize}&offset=${(grid.currentPage - 1) * grid.pageSize}`;
	const sortedCols = grid.getDataColumns().filter(c => c.sortDirection != SortDirection.None);
	if (sortedCols.length) {
		sortedCols.sort((a, b) => a.sortIndex - b.sortIndex);
		let firstIn = true;
		for (let sc of sortedCols) {
			qry += firstIn ? '&orderBy=' : ',';
			firstIn = false;
			if (sc['parentField']) {
				const col = <SelectColumn>sc;
				if (col.displayMember == 'displayName') {
					qry += `${col.parentField}.firstName`;
					if (sc.sortDirection == SortDirection.Desc) {
						qry += ' desc';
					}
					qry += `,${col.parentField}.lastName`;
				}
				else {
					qry += `${col.parentField}.${col.displayMember}`;
				}
			}
			else {
				if (sc.fieldName == 'displayName') {
					qry += `firstName${(sc.sortDirection == SortDirection.Desc ? ' desc' : '')},lastName`;
				}
				else {
					qry += sc.fieldName;
				}
			}
			if (sc.sortDirection == SortDirection.Desc) {
				qry += ' desc';
			}
		}

	}
	return qry;
}

export function getDateRangeWhere(fld: string, start: Date, end: Date) {
	if (!start && !end) return '';
	let where = '';
	if (start) {
		where += `${fld}%20gte%20${moment(start).format('MM-DD-YYYY')}`;
	}
	if (end) {
		if (start) where += ',';
		let mend = moment(end);
		mend.date(mend.date() + 1);
		where += `${fld}%20lt%20${mend.format('MM-DD-YYYY')}`;
	}
	return where;
}