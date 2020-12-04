import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { GridView, DataColumn, FieldType, GridViewComponent, RowArguments, PagingType, NumericColumn, SelectColumn, ButtonColumn, TextAreaColumn, DetailGridView, ModalDialogComponent, Button, DialogResult } from 'pajama-angular';
import { SortDirection } from 'pajama-angular';
import { AuthDataService } from '../shared/services/data.service';
import { MaintenanceRequest, User, MaintenanceRequestReply, MaintenanceRequestImage } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../shared/services/auth.service';
import { ILookups } from '../shared/interfaces';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { ROLE } from '../shared/constants';
import { MatInput } from '@angular/material';
import { ResponseContentType, RequestOptions } from '@angular/http';
import { getGridQueryString } from '../shared/utils';
import { Observable } from 'rxjs';

@Component({
	selector: 'maintenance-requests',
	templateUrl: 'maintenance-requests.component.html'
})
export class MaintenanceRequestsComponent implements OnInit {
	loading = false;
	gridRequests: GridView;
	confirming: any = {};
	viewType = 0;

	private _apiUrl: string;
	private _assignedTo: SelectColumn;
	private _requestedBy: SelectColumn;

	replyToRequest: MaintenanceRequestReply;
	uploadToRequest: MaintenanceRequest;
	requestImages: Array<any> = [];
	fullSizeImage: any;

	@ViewChild("replyModal")
	replyModal: ModalDialogComponent;

	@ViewChild("imagesModal")
	imagesModal: ModalDialogComponent;

	@ViewChild("file") file;

	files: { [key: string]: File } = {};

	lookups: ILookups;

	constructor(private dataService: AuthDataService, public configService: ConfigService, private router: Router,
		private toastr: ToastrService, private route: ActivatedRoute, private authService: AuthService) {
		this.initGrid();

	}

	private initGrid() {
		this.gridRequests = new GridView();
		this.gridRequests.pagingType = PagingType.Manual;
		this.gridRequests.pageSize = 25;
		this.gridRequests.saveGridStateToStorage = true;
		this.gridRequests.name = "gridRequests";
		this.gridRequests.disableAutoSort = true;
		this.gridRequests.allowEdit = true;
		this.gridRequests.allowDelete = true;

		this.gridRequests.rowSave.subscribe((r: RowArguments) => {
			this.saveRow(r);
		});
		this.gridRequests.rowInvalidated.subscribe((columns: DataColumn[]) => {
			showToastError(this.toastr, `The following fields are required: ${columns.map(c => c.caption, true).join(', ')}`);
		});

		this.gridRequests.rowDelete.subscribe((r: RowArguments) => {
			this.deleteRow(r);
		});
		this.gridRequests.rowCreate.subscribe((r: RowArguments) => {
			const mr = <MaintenanceRequest>r.row;
			mr.requestedById = this.authService.loggedInUser.user.userId;
			mr.requestDate = new Date();
			mr.maintenanceRequestReplys = [];
		})

		const requestDescription = new TextAreaColumn("requestDescription", "Description");
		requestDescription.required = true;
		this.gridRequests.columns.push(requestDescription);

		this._assignedTo = new SelectColumn("assignedToId", "Assigned To");
		this._assignedTo.displayMember = "displayName";
		this._assignedTo.valueMember = "userId";
		this._assignedTo.required = true;
		this._assignedTo.parentField = "assignedTo";
		this._assignedTo.width = "140px";
		this.gridRequests.columns.push(this._assignedTo);

		this._requestedBy = new SelectColumn("requestedById", "Requested By");
		this._requestedBy.displayMember = "displayName";
		this._requestedBy.valueMember = "userId";
		this._requestedBy.parentField = "requestedBy";
		this._requestedBy.required = true;
		this._requestedBy.width = "140px";
		this.gridRequests.columns.push(this._requestedBy);

		this.gridRequests.columns.push(new DataColumn("requestDate").setFieldType(FieldType.Date).setWidth("120px").setSortable().setSortDirection(SortDirection.Desc));


		const isAddressedCol = new DataColumn("isAddressed", "Addressed");
		isAddressedCol.width = "100px";
		isAddressedCol.fieldType = FieldType.Boolean;
		this.gridRequests.columns.push(isAddressedCol);

		// this.gridRequests.columns.push(new TextAreaColumn("comments"));
		const col = new ButtonColumn();
		col.text = "Reply";
		col.width = "60px";
		col.click.subscribe(async (row: MaintenanceRequest) => {
			// this.replyModal.headerText = row.requestDescription;
			await this.addReply(row);
		})
		col.getRowCellClass = (row: MaintenanceRequest) => {
			if (!row.maintenanceRequestId) return 'hide-me';
			return '';
		}
		this.gridRequests.columns.push(col);
		const viewImages = new ButtonColumn();
		viewImages.text = "Images";
		viewImages.width = "70px";
		viewImages.click.subscribe(async (row: MaintenanceRequest) => {
			this.imagesModal.show();
			await this.loadImages(row);
		})
		viewImages.getRowCellClass = (row: MaintenanceRequest) => {
			if (!row.maintenanceRequestId) return 'hide-me';
			return '';
		}
		this.gridRequests.columns.push(viewImages);

		const gridDetail = new DetailGridView();
		gridDetail.pagingType = PagingType.Disabled;
		gridDetail.allowAdd = false;
		gridDetail.allowDelete = false;
		gridDetail.columns.push(new TextAreaColumn("replyText").setRequired().setWidth("100%").setReadOnly());
		gridDetail.columns.push(new DataColumn("replyDate").setFieldType(FieldType.Date).setWidth("120px").setSortable().setSortDirection(SortDirection.Desc));
		// gridDetail.rowSave.subscribe((args: RowArguments) => {
		// 	args.observable = Observable.create(async o => {
		// 		this.loading = true;
		// 		try {
		// 			const row = await this.dataService.post(`${this._apiUrl}/maintenanceRequestReplys`, args.row).toPromise();;
		// 			showToastSuccess(this.toastr, "Item has been saved.");
		// 			this.loading = false;
		// 			return o.next();
		// 		}
		// 		catch (err) {
		// 			showToastError(this.toastr, err);
		// 			this.loading = false;
		// 			return o.error(err);
		// 		}
		// 	});
		// });
		gridDetail.rowCreate.subscribe(async (r: RowArguments) => {
			r.cancel = true;
			await this.addReply((<DetailGridView>r.grid).parentRow);
			this.gridRequests.refreshData();
		});
		gridDetail.getChildData = (parent: any) => {
			return new Observable(o => o.next(parent.maintenanceRequestReplys));
		}
		this.gridRequests.detailGridView = gridDetail;
		this.gridRequests.loadGridState();
	}

	arrayBufferToBase64(buffer) {
		let binary = '';
		const len = buffer.length;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(buffer[i]);
		}
		return btoa(binary);
	}

	// createImageFromBlob(image: Blob) {
	// 	let reader = new FileReader();
	// 	reader.addEventListener("load", () => {
	// 		this.imageToShow = reader.result;
	// 	}, false);

	// 	if (image) {
	// 		reader.readAsDataURL(image);
	// 	}
	// }

	async uploadImage() {
		this.file.nativeElement.click();
	}

	async deleteImage(id) {
		try {
			const ind = this.requestImages.findIndex(i => i.maintenanceRequestImageId == id);
			const reqInd = this.uploadToRequest.maintenanceRequestImages.findIndex(ui => ui.maintenanceRequestImageId == id);
			if (ind >= 0) {
				this.requestImages[ind].image = null;
			}
			(await this.dataService.delete(`${this._apiUrl}/maintenanceRequestImages/${id}`)
				.toPromise());
			if (ind >= 0) {
				this.requestImages.splice(ind, 1);
			}
			if (reqInd >= 0) {
				this.uploadToRequest.maintenanceRequestImages.splice(reqInd, 1);
			}
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
	}

	imagesClosing() {
		this.requestImages = [];
		this.uploadToRequest = null;
		this.fullSizeImage = null;
	}

	openImage(img: any) {
		var image = new Image();
		image.src = img.image;
		var w = window.open("");
		w.document.write(image.outerHTML);
	}

	createImageFromBlob(mri: MaintenanceRequestImage, blob: Blob) {
		let reader = new FileReader();
		reader.addEventListener("load", () => {
			const img = this.requestImages.find(i => i.maintenanceRequestImageId == mri.maintenanceRequestImageId);
			img.image = reader.result;
		}, false);

		reader.readAsDataURL(blob);
	}

	async loadImages(request: MaintenanceRequest) {
		try {
			this.requestImages = (request.maintenanceRequestImages || []).slice();
			for (let img of request.maintenanceRequestImages || []) {
				if (img['image']) continue;
				const opts = this.dataService.getOptions();
				opts.headers.set('Content-Type', img.imageType);
				opts.responseType = ResponseContentType.Blob;
				try {
					const imgData = await this.dataService.getRaw(`${this._apiUrl}/maintenanceRequestImages/${img.maintenanceRequestImageId}`, opts).toPromise();
					this.createImageFromBlob(img, imgData.blob());
				}
				catch (e) {
					// TODO:
					img['image'] = '0x';
				}
			}
			this.uploadToRequest = request;
		}
		catch (e) {
			this.imagesModal.hide();
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	async upload() {
		try {

			for (let k of Object.keys(this.files)) {
				const file = this.files[k];
				const formData: FormData = new FormData();
				formData.append('file', file, file.name);
				const dummy = { dummy: true };
				this.requestImages.push(dummy);
				const results: any = await this.dataService.put(`${this._apiUrl}/maintenanceRequestImage/${this.uploadToRequest.maintenanceRequestId}`, formData).toPromise();
				const ind = this.requestImages.findIndex(i => i.dummy);
				this.requestImages.splice(ind, 1);
				for (let r of results) {
					this.uploadToRequest.maintenanceRequestImages.push(r);
				}
				await this.loadImages(this.uploadToRequest);
			}
			showToastSuccess(this.toastr, "File(s) uploaded.");
		}
		catch (e) {
			showToastError(this.toastr, e);
			return;
		}
	}

	async onFilesAdded() {
		const files: { [key: string]: File } = this.file.nativeElement.files;
		for (let key in files) {
			if (!isNaN(parseInt(key))) {
				this.files[key] = files[key];
			}
		}
		await this.upload();
		this.file.nativeElement.value = '';
		this.files = {};
		await this.loadImages(this.uploadToRequest);
	}

	private async addReply(request: MaintenanceRequest) {
		this.replyToRequest = new MaintenanceRequestReply();
		this.replyToRequest.replyDate = new Date();
		this.replyToRequest.maintenanceRequestId = request.maintenanceRequestId;
		this.replyModal.show(Button.OKCancel).subscribe(async (r: DialogResult) => {
			if (r == DialogResult.OK) {
				this.loading = true;
				try {
					const created = await this.dataService.post<MaintenanceRequestReply, MaintenanceRequestReply>(`${this._apiUrl}/maintenanceRequestReplys`, this.replyToRequest).toPromise();
					request.maintenanceRequestReplys.push(created);
					const dind = this.gridRequests.data.findIndex(d => d.maintenanceRequestId == created.maintenanceRequestId);
					const dgv = this.gridRequests.gridViewComponent.detailGridViewComponents[this.gridRequests.data[dind]._tmp_key_field].detailGridViewInstance;
					dgv.refreshData();
					showToastSuccess(this.toastr, "Reply has been sent.");
					this.loading = false;
				}
				catch (err) {
					showToastError(this.toastr, err);
				}
				this.loading = false;
			}
			this.replyToRequest = null;
		});
	}

	private saveRow(rowArguments: RowArguments) {
		rowArguments.observable = Observable.create(o => {
			const row = <MaintenanceRequest>rowArguments.row;
			let observable: Observable<MaintenanceRequest>;
			if (row.maintenanceRequestId) {
				observable = this.dataService.put(`${this._apiUrl}/maintenanceRequests/${row.maintenanceRequestId}`, row);
			}
			else {
				observable = this.dataService.post(`${this._apiUrl}/maintenanceRequests`, row);
			}
			this.loading = true;
			observable.subscribe(e => {
				Object.assign(row, e);
				this.loading = false;
				showToastSuccess(this.toastr, 'Request has been saved');
				o.next();
			}, (e) => {
				this.loading = false;
				showToastError(this.toastr, e);
				o.error();
			});
		});
	}

	deleteRow(args: RowArguments) {
		this.loading = true;
		this.dataService.delete(`${this._apiUrl}/maintenanceRequests/${args.row.maintenanceRequestId}`).subscribe(() => {
			this.loading = false;
			showToastSuccess(this.toastr, `Request has been deleted`);
			const ind = this.gridRequests.data.findIndex(e => e.maintenanceRequestId == args.row.maintenanceRequestId);
			this.gridRequests.data.splice(ind, 1);
		}, (e) => {
			this.loading = false;
			showToastError(this.toastr, `Request could not be deleted: ${e.message || e}`, true);
		});
	}

	async ngOnInit() {
		this.loading = true;
		this._apiUrl = this.configService.apiUrl;
		try {
			this.lookups = await this.dataService.get<ILookups>(`${this._apiUrl}/lookups?lookupType=2`).toPromise();
			this._assignedTo.selectOptions = this.lookups.users.filter(u => u.roles && u.roles.indexOf(ROLE.MAINTENANCE_REQUESTS.value) >= 0);
			this._requestedBy.selectOptions = this.lookups.users;
		}
		catch (e) {
			this.loading = false;
			showToastError(this.toastr, e);
			return;
		}
		await this.refreshGrid(true);
	}

	async refreshGrid(resetPage: boolean) {
		if (resetPage) {
			this.gridRequests.currentPage = 1;
		}
		this.loading = true
		this.gridRequests.showNoResults = false;
		this.gridRequests.data = [];
		try {
			let url = `${this._apiUrl}/maintenanceRequests?1=1${this.viewType == 0 ? '&unaddressed=true' : ''}&${getGridQueryString(this.gridRequests)}`;
			const requests = await this.dataService.getItems<MaintenanceRequest>(url).toPromise();
			this.gridRequests.data = requests.data;
			this.gridRequests.totalRecords = requests.count;
			this.gridRequests.showNoResults = true;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}
}
