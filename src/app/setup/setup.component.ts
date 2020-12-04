import { Component, OnInit, Type, ViewContainerRef, ViewChild, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GridView, DataColumn, ButtonColumn, FieldType, ColumnBase, PagingType, Items, SortDirection, ToCamelCasePipe, FilterMode, GridViewComponent, RowArguments, ModalDialogComponent } from 'pajama-angular';
import { User, EmailTemplate, Company, Position, Task } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { ILookups, IUserToken } from '../shared/interfaces';
import { AuthDataService } from '../shared/services/data.service';
import { AuthService } from '../shared/services/auth.service';
import { EMAIL_TEMPLATE_TYPE } from '../shared/constants';
import { getErrorMessage, getGridQueryString } from '../shared/utils';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { Observable } from 'rxjs';
import { DialogService } from '../shared/services/dialog.service';
import { ToastrService } from 'ngx-toastr';
import { GridViewContainerComponent } from '../shared/gridview-container.component';
import { getWizardNextUrl, getWizardBackUrl } from './workflow';

export abstract class SetupComponent implements OnInit {
	gridMain: GridView;
	lookups: ILookups;
	loggedInUser: IUserToken;
	loading = false;
	hidePrintButton: boolean;
	hideButtons: boolean;
	wizard = false;
	wizardNextUrl: string;
	wizardBackUrl: string;

	minWidth: string;

	@ViewChild(GridViewContainerComponent)
	gridContainerComponent: GridViewContainerComponent;

	apiUrl: string;
	constructor(protected dataService: AuthDataService, protected configService: ConfigService,
		protected authService: AuthService, protected toastr: ToastrService, protected route: ActivatedRoute, protected router: Router) {
		this.wizard = route.snapshot.queryParams["w"];
		if (this.wizard) {
			this.route.url.subscribe(u => {
				this.wizardNextUrl = getWizardNextUrl(this.authService, u[0].path);
				this.wizardBackUrl = getWizardBackUrl(this.authService, u[0].path);
			});
		}
	}

	protected getWhereClause(): string { return ""; }
	protected abstract initColumns();
	protected abstract initGrid();
	abstract get pluralTitle(): string;
	abstract get wizardText(): string;
	

	protected rowSaving: (row: any) => Promise<any>;
	protected rowSaved: (row: any) => Promise<any>;

	async ngOnInit() {
		this.loggedInUser = this.authService.loggedInUser;
		if (!this.loggedInUser) return;

		this.gridMain = new GridView();
		this.gridMain.pagingType = PagingType.Manual;
		this.gridMain.pageSize = 25;
		this.gridMain.saveGridStateToStorage = true;
		this.gridMain.disableAutoSort = true;
		this.gridMain.allowEdit = true;
		this.gridMain.allowDelete = true;
		this.gridMain.rowSave.subscribe((args: RowArguments) => {
			args.observable = Observable.create(async o => {
				this.loading = true;
				if (this.rowSaving) await this.rowSaving(args.row);
				let keyFld = this.gridMain.keyFieldName;
				if (this.gridMain.customProps["idField"])
					keyFld = this.gridMain.customProps["idField"];
				const id = args.row[keyFld];
				let promise: Promise<any>;
				if (id) {
					promise = this.dataService.put(`${this.apiUrl}/${this.gridMain.name}/${id}`, args.row).toPromise();
				}
				else {
					promise = this.dataService.post(`${this.apiUrl}/${this.gridMain.name}`, args.row).toPromise();
				}

				try {
					const row = await promise;
					if (this.rowSaved) await this.rowSaved(row);
					this.gridContainerComponent.gridViewComponent.collapseAll();
					// if (!args.rows[0][keyFld])
					// 	args.rows[0][keyFld] = row[keyFld];
					this.refreshGrid(false);
					showToastSuccess(this.toastr, "Item has been saved.");
					return o.next();
				}
				catch (err) {
					// this.gridMainComponent.editRow(args.row);
					showToastError(this.toastr, err);
					this.loading = false;
					return o.error(err);
				}
			});
		});

		this.gridMain.rowDelete.subscribe(async (args: RowArguments) => {
			args.observable = Observable.create(async (o) => {
				this.loading = true;
				let keyFld = this.gridMain.keyFieldName;
				if (this.gridMain.customProps["idField"])
					keyFld = this.gridMain.customProps["idField"];
				const id = args.row[keyFld];
				try {
					await this.dataService.delete(`${this.apiUrl}/${this.gridMain.name}/${id}`).toPromise();
					this.refreshGrid(false);
					showToastSuccess(this.toastr, "Item has been deleted.");
					this.loading = false;
					o.next();
				}
				catch (err) {
					showToastError(this.toastr, err);
					this.loading = false;
					o.error(err);
				}
			});

		})

		this.apiUrl = this.configService.apiUrl;

		this.loading = true;
		this.lookups = await this.dataService.get<ILookups>(`${this.apiUrl}/lookups`).toPromise();
		this.initColumns();
		this.initGrid();
		this.gridMain.loadGridState();

		await this.refreshGrid(true);
	}

	async refreshGrid(resetPage: boolean) {
		if (resetPage) {
			this.gridMain.currentPage = 1;
		}
		this.loading = true;
		try {
			const data = await this.dataService.getItems<any>(`${this.apiUrl}/${this.gridMain.name}?${getGridQueryString(this.gridMain)}${this.getWhereClause()}`).toPromise();
			this.gridMain.data = data.data;
			this.gridMain.totalRecords = data.count;
			this.loading = false;
		}
		catch (err) {
			showToastError(this.toastr, err);
			this.loading = false;
		}
	}

	next() {
		if (Object.keys(this.gridContainerComponent.gridViewComponent.editingRows).length > 0) {
			showToastError(this.toastr, "You have unsaved changes!", true);
			return;
		}
		this.router.navigateByUrl(`${this.wizardNextUrl}?w=true`);
	}

	back() {
		if (Object.keys(this.gridContainerComponent.gridViewComponent.editingRows).length > 0) {
			showToastError(this.toastr, "You have unsaved changes!", true);
			return;
		}
		this.router.navigateByUrl(`${this.wizardBackUrl}?w=true`);
	}
}
