import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ModalDialogComponent, DialogResult } from 'pajama-angular';
import { AuthDataService } from '../shared/services/data.service';
import { Document, Position } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../shared/services/auth.service';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { ROLE } from '../shared/constants';
import { DialogService } from '../shared/services/dialog.service';
import { Http, ResponseContentType } from '@angular/http';
import { FileSaverService } from 'ngx-filesaver';

@Component({
	selector: 'documents',
	templateUrl: 'documents.component.html'
})
export class DocumentsComponent implements OnInit {
	uploadLoading = false;
	loading = false;
	documents: Array<Document>;
	currentDocument: Document;

	private _apiUrl: string;

	@ViewChild("file") file;
	@ViewChild("downloadLink") downloadLink;

	@ViewChild("uploadModal")
	uploadModal: ModalDialogComponent;

	positions: Array<Position>;
	selectedPositions: Array<Position> = [];

	constructor(private dataService: AuthDataService, public configService: ConfigService, private router: Router, private http: Http,
		private toastr: ToastrService, private route: ActivatedRoute, private authService: AuthService, private dialogService: DialogService,
		private fileSaver: FileSaverService) {
	}

	arrayBufferToBase64(buffer) {
		let binary = '';
		const len = buffer.length;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(buffer[i]);
		}
		return btoa(binary);
	}

	async uploadDocument() {
		this.file.nativeElement.click();
	}

	async deleteDocument(id, documentName) {
		const r = await this.dialogService.showYesNoDialog('Delete document',
			`Are you sure you want to delete ${documentName}?`
		).toPromise();
		if (r != DialogResult.Yes) return;

		try {
			const ind = this.documents.findIndex(i => i.documentId == id);
			(await this.dataService.delete(`${this._apiUrl}/documents/${id}`)
				.toPromise());
			if (ind >= 0) {
				this.documents.splice(ind, 1);
			}
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
	}

	async loadDocuments() {
		this.loading = true
		this.documents = [];
		try {
			this.documents = (await this.dataService.getItems<Document>(`${this._apiUrl}/documents`).toPromise()).data;
			this.documents.sort((a, b) => {
				if (a.documentName.toLowerCase() > b.documentName.toLowerCase()) return 1;
				if (a.documentName.toLowerCase() < b.documentName.toLowerCase()) return -1;
				return 0;
			});
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	async upload() {
		if (!this.file || !this.file.nativeElement.files.length) {
			showToastError(this.toastr, "At least one file must be selected");
			return;
		}
		this.uploadLoading = true;
		try {
			const files = this.file.nativeElement.files;
			const formData: FormData = new FormData();
			for (let k of Object.keys(files)) {
				const file = files[k];
				formData.append('file', file, file.name);
			}
			let results = await this.dataService.post<FormData, Array<Document>>(`${this._apiUrl}/uploadDocuments`, formData).toPromise();
			if (this.selectedPositions.length > 0 && this.selectedPositions.length < this.positions.length) {
				for (let r of results) {
					r.positions = this.selectedPositions.map(s => s.positionId);
				}
				results = await this.dataService.post<Document[], Document[]>(`${this._apiUrl}/documents`, results).toPromise();
			}
			this.file.nativeElement.value = '';
			await this.loadDocuments();
			this.uploadModal.hide();
			this.selectedPositions = [];
			showToastSuccess(this.toastr, "File(s) uploaded.");
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.uploadLoading = false;
	}

	async save() {
		if (!this.currentDocument) return;
		this.uploadLoading = true;
		try {
			if (this.selectedPositions.length > 0 && this.selectedPositions.length < this.positions.length) {
				this.currentDocument.positions = this.selectedPositions.map(s => s.positionId);
			}
			else {
				this.currentDocument.positions = null;
			}
			await this.dataService.put<Document, Document>(`${this._apiUrl}/documents/${this.currentDocument.documentId}`, this.currentDocument).toPromise();
			//			await this.loadDocuments();
			this.uploadLoading = false;
			this.uploadModal.hide();
			showToastSuccess(this.toastr, "Document saved.");
			this.currentDocument = null;
		}
		catch (e) {
			this.uploadLoading = false;
			showToastError(this.toastr, e);
		}
	}

	cancel() {
		this.uploadModal.hide();
		this.currentDocument = null;
		this.selectedPositions = [];
	}

	async editDocument(document: Document) {
		this.currentDocument = document;
		this.selectedPositions = [];
		if (this.currentDocument.positions && this.currentDocument.positions.length) {
			this.selectedPositions = this.positions.filter(p => this.currentDocument.positions.indexOf(p.positionId) >= 0);
		}
		await this.uploadModal.show();
	}

	async downloadFile(documentId, documentName, mimeType) {
		this.loading = true;
		try {
			try {
				const options = this.dataService.getOptions();
				options.headers.append('Content-Type', mimeType);
				options.responseType = ResponseContentType.ArrayBuffer;

				const response = await this.http.get(`${this._apiUrl}/downloadDocument/${documentId}`, options).toPromise();
				this.fileSaver.save(response.blob(), documentName);
			}
			catch {
				// YUCK!!! .dbc files don't work
				const options = this.dataService.getOptions();
				const response = await this.http.get(`${this._apiUrl}/downloadDocument/${documentId}`, options).toPromise();
				this.fileSaver.save(new Blob([(<any>response)._body]), documentName);
			}
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	async ngOnInit() {
		this.loading = true;
		this._apiUrl = this.configService.apiUrl;
		if (this.authService.hasRole(ROLE.ADMIN.value)) {
			try {
				this.positions = (await this.dataService.getItems<Position>(`${this._apiUrl}/positions`).toPromise()).data;
			}
			catch (e) {
				this.loading = false;
				showToastError(this.toastr, e);
				return;
			}
		}
		await this.loadDocuments();
	}
}
