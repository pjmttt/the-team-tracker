import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { GridView, DataColumn, FieldType, GridViewComponent, RowArguments, PagingType, NumericColumn, SelectColumn, ButtonColumn, ModalDialogComponent, DetailGridView } from 'pajama-angular';
import { SortDirection } from 'pajama-angular';
import { AuthDataService } from '../shared/services/data.service';
import { InventoryItem, User, InventoryCategory, Vendor, InventoryTransaction } from '../shared/models';
import { ConfigService } from '../shared/services/config.service';
import { Router, ActivatedRoute } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../shared/services/auth.service';
import { InventoryTransactionEditComponent } from './inventory-transaction-edit.component';
import { showToastSuccess, showToastError } from '../shared/toast-helper';
import { getGridQueryString } from '../shared/utils';
import * as moment from 'moment';
import { FILTER_DELAY } from '../shared/constants';
import { OBSERVABLE_MEDIA_PROVIDER } from '@angular/flex-layout';
import { GridViewContainerComponent } from '../shared/gridview-container.component';

declare var jsPDF: any;

@Component({
	selector: 'inventory',
	templateUrl: 'inventory.component.html'
})
export class InventoryComponent implements OnInit {
	loading = false;
	neededOnly = false;
	gridInventory: GridView;

	apiUrl: string;
	incoming: boolean;
	inventoryItem: InventoryItem;
	inventoryTransaction: InventoryTransaction;


	private _categoryCol: SelectColumn;
	private _vendorCol: SelectColumn;

	categories: Array<InventoryCategory> = [];
	vendors: Array<Vendor>;
	selectedCategories: Array<InventoryCategory> = [];
	selectedVendors: Array<Vendor> = [];

	@ViewChild(ModalDialogComponent)
	inventoryTransactionModal: ModalDialogComponent;

	@ViewChild("gridViewContainer")
	gridViewContainer: GridViewContainerComponent;

	constructor(private dataService: AuthDataService, private configService: ConfigService, private router: Router,
		private toastr: ToastrService, private route: ActivatedRoute, private authService: AuthService) {
		this.initGrid();

	}

	private initGrid() {
		this.gridInventory = new GridView();
		this.gridInventory.pagingType = PagingType.Manual;
		this.gridInventory.pageSize = 25;
		this.gridInventory.saveGridStateToStorage = true;
		this.gridInventory.name = "gridInventory";
		this.gridInventory.disableAutoSort = true;
		this.gridInventory.allowEdit = true;
		this.gridInventory.allowDelete = true;
		this.gridInventory.allowMultiEdit = true;
		this.gridInventory.printSettings.fontSize = "11px";
		this.gridInventory.printSettings.cellPadding = "4px";
		this.gridInventory.rowSave.subscribe((r: RowArguments) => {
			this.saveRow(r);
		});
		this.gridInventory.rowSaveAll.subscribe((r: RowArguments) => {
			r.observable = this.saveRows(r);

		})
		this.gridInventory.rowInvalidated.subscribe((columns: DataColumn[]) => {
			showToastError(this.toastr, `The following fields are required: ${columns.map(c => c.caption, true).join(', ')}`);
		});

		this.gridInventory.rowDelete.subscribe((r: RowArguments) => {
			this.deleteRow(r);
		});
		this.gridInventory.rowCreate.subscribe((r: RowArguments) => {
			r.row.enteredById = this.authService.loggedInUser.user.userId;
		})

		const inventoryItemNameCol = new DataColumn("inventoryItemName", "Item");
		inventoryItemNameCol.sortable = true;
		inventoryItemNameCol.required = true;
		inventoryItemNameCol.printWidth = "200px";
		this.gridInventory.columns.push(inventoryItemNameCol);

		this._categoryCol = new SelectColumn("inventoryCategoryId", "Category");
		this._categoryCol.displayMember = "categoryName";
		this._categoryCol.valueMember = "inventoryCategoryId";
		this._categoryCol.width = "150px";
		this._categoryCol.required = true;
		this._categoryCol.sortable = true;
		this.gridInventory.columns.push(this._categoryCol);

		this._vendorCol = new SelectColumn("vendorId", "Vendor");
		this._vendorCol.displayMember = "vendorName";
		this._vendorCol.valueMember = "vendorId";
		this._vendorCol.width = "150px";
		this._vendorCol.sortable = true;
		this.gridInventory.columns.push(this._vendorCol);

		const quantityOnHandCol = new NumericColumn("quantityOnHand", "In Stock");
		quantityOnHandCol.fieldType = FieldType.Numeric;
		quantityOnHandCol.width = "70px";
		quantityOnHandCol.printWidth = "40px";
		this.gridInventory.columns.push(quantityOnHandCol);

		const minQuantity = new NumericColumn("minimumQuantity", "Min Qty");
		minQuantity.fieldType = FieldType.Numeric;
		minQuantity.width = "70px";
		minQuantity.printWidth = "40px";
		this.gridInventory.columns.push(minQuantity);

		const neededCol = new SelectColumn(null, "Needed");
		neededCol.width = "70px";
		neededCol.printWidth = "40px";
		neededCol.render = (row: InventoryItem) => `${(row.quantityOnHand < row.minimumQuantity ? (row.minimumQuantity - row.quantityOnHand) : 0)}`;
		neededCol.getRowCellClass = (row: InventoryItem) => row.quantityOnHand < row.minimumQuantity ? 'error-message' : '';
		this.gridInventory.columns.push(neededCol);

		const currentCostCol = new NumericColumn("unitCost", "Unit Cost");
		currentCostCol.fieldType = FieldType.Numeric;
		currentCostCol.width = "80px";
		currentCostCol.printVisible = false;
		this.gridInventory.columns.push(currentCostCol);

		const expCol = new DataColumn("expirationDate", "Exp Date").setFieldType(FieldType.Date).setSortable();
		expCol.printWidth = "70px";
		expCol.width = "90px";
		this.gridInventory.columns.push(expCol);

		// const costOnHandCol = new NumericColumn("costOnHand", "In Stock Cost");
		// costOnHandCol.fieldType = FieldType.Numeric;
		// costOnHandCol.width = "100px";
		// costOnHandCol.readonly = true;
		// this.gridInventory.columns.push(costOnHandCol);

		const lastUpdatedCol = new DataColumn("lastUpdated", "Updated").setFieldType(FieldType.Date).setReadOnly().setSortable();
		lastUpdatedCol.printWidth = "70px";
		lastUpdatedCol.width = "90px";
		this.gridInventory.columns.push(lastUpdatedCol);

		const newCol = new DataColumn(null, "New Qty");
		newCol.width = "68px";
		newCol.printWidth = "40px";
		newCol.visible = false;
		this.gridInventory.columns.push(newCol);

		// const addCol = new ButtonColumn();
		// addCol.text = "Add To";
		// addCol.class = "btn-link"
		// addCol.width = "60px";
		// addCol.printVisible = false;
		// addCol.click.subscribe((row: InventoryItem) => {
		// 	this.addRemoveInventoryTransaction(row, true);
		// })
		// addCol.getRowCellClass = ((row: InventoryItem) => {
		// 	if (!row.inventoryItemId) {
		// 		return 'hide-me';
		// 	}
		// 	return '';
		// });
		// this.gridInventory.columns.push(addCol);

		// const removeCol = new ButtonColumn();
		// removeCol.text = "Remove From";
		// removeCol.class = "btn-link"
		// removeCol.width = "100px";
		// removeCol.printVisible = false;
		// removeCol.click.subscribe((row: InventoryItem) => {
		// 	this.addRemoveInventoryTransaction(row, false);
		// })
		// removeCol.getRowCellClass = ((row: InventoryItem) => {
		// 	if (!row.inventoryItemId) {
		// 		return 'hide-me';
		// 	}
		// 	return '';
		// });
		// this.gridInventory.columns.push(removeCol);

		let i = 0;
		for (let c of this.gridInventory.columns) {
			c.columnIndex = i++;
		}

		const dgv = new DetailGridView();
		dgv.allowAdd = false;
		dgv.allowDelete = false;
		dgv.allowEdit = true;
		dgv.columns.push(new DataColumn("notes"));
		dgv.getChildData = (parent: InventoryItem) => {
			return new Observable(o => o.next([parent]));
		}

		this.gridInventory.detailGridView = dgv;
		this.gridInventory.loadGridState();
	}

	private _lastChange: Date;
	async filterChanged() {
		this._lastChange = new Date();
		setTimeout(async () => {
			if (moment().diff(moment(this._lastChange)) > FILTER_DELAY - 50) {
				await this.refreshGrid(true);
			}
		}, FILTER_DELAY);
	}

	private saveRows(rowArguments: RowArguments): Observable<any> {
		this.loading = true;

		// TODO: needs to be in library
		const dgvs = this.gridViewContainer.gridViewComponent.detailGridViewComponents;
		for (let dgvk of Object.keys(dgvs)) {
			const chrows = dgvs[dgvk].gridViewComponent.changedRows;
			for (let crk of Object.keys(chrows)) {
				const changedRow = <InventoryItem>chrows[crk];
				if (changedRow.inventoryItemId && !rowArguments.rows.some(r => r.inventoryItemId == changedRow.inventoryItemId)) {
					rowArguments.rows.push(changedRow);
				}
			}
		}

		return this.dataService.post(`${this.apiUrl}/inventoryItems`, rowArguments.rows)
			.pipe(map(() => {
				this.refreshGrid(true);
				this.loading = false;
				showToastSuccess(this.toastr, 'Item has been saved');
				return Observable.create(o => o.next());
			}), catchError(e => {
				this.loading = false;
				showToastError(this.toastr, e);
				return Observable.create(o => o.error(e));
			}));
	}

	private saveRow(rowArguments: RowArguments) {
		rowArguments.observable = Observable.create(o => {
			const row = <InventoryItem>rowArguments.row;

			let observable: Observable<InventoryItem>;
			if (row.inventoryItemId) {
				observable = this.dataService.put(`${this.apiUrl}/inventoryItems/${row.inventoryItemId}`, row);
			}
			else {
				observable = this.dataService.post(`${this.apiUrl}/inventoryItems`, row);
			}
			this.loading = true;
			observable.subscribe(e => {
				Object.assign(row, e);
				this.loading = false;
				showToastSuccess(this.toastr, 'Item has been saved');
				return o.next();
			}, (e) => {
				this.loading = false;
				showToastError(this.toastr, e);
				return o.error(e);
			});
		});
	}

	deleteRow(args: RowArguments) {
		this.loading = true;
		this.dataService.delete(`${this.apiUrl}/inventoryItems/${args.row.inventoryItemId}`).subscribe(() => {
			this.loading = false;
			showToastSuccess(this.toastr, `Item has been deleted`);
			const ind = this.gridInventory.data.findIndex(e => e.inventoryItemId == args.row.inventoryItemId);
			this.gridInventory.data.splice(ind, 1);
		}, (e) => {
			this.loading = false;
			showToastError(this.toastr, `Item could not be deleted: ${e.message || e}`, true);
		});
	}

	async addRemoveInventoryTransaction(inventoryItem: InventoryItem, incoming: boolean) {
		this.inventoryItem = inventoryItem;
		this.incoming = incoming;
		this.inventoryTransaction = new InventoryTransaction();
		if (incoming) this.inventoryTransaction.vendorId = inventoryItem.vendorId;

		await this.inventoryTransactionModal.show().toPromise();

		if (this.inventoryTransactionModal.tag != null)
			this.refreshGrid(false);

		this.inventoryTransactionModal.tag = null;
	}

	async ngOnInit() {
		this.loading = true;
		this.apiUrl = this.configService.apiUrl;
		try {
			this.categories = (await this.dataService.getItems<InventoryCategory>(`${this.apiUrl}/inventoryCategories`).toPromise()).data;
			this.categories.sort((a: InventoryCategory, b: InventoryCategory) => {
				if (a.categoryName > b.categoryName) return 1;
				if (a.categoryName < b.categoryName) return -1;
				return 0;
			});
			this._categoryCol.selectOptions = this.categories;

			this.vendors = (await this.dataService.getItems<Vendor>(`${this.apiUrl}/vendors`).toPromise()).data;
			this.vendors.sort((a: Vendor, b: Vendor) => {
				if (a.vendorName > b.vendorName) return 1;
				if (a.vendorName < b.vendorName) return -1;
				return 0;
			});
			this._vendorCol.selectOptions = this.vendors;
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
			this.gridInventory.currentPage = 1;
		}
		this.loading = true
		try {
			let url = `${this.apiUrl}/inventoryItems?neededOnly=${this.neededOnly ? 'true' : ''}&${getGridQueryString(this.gridInventory)}`;
			if ((this.selectedVendors.length > 0 && this.selectedVendors.length != this.vendors.length)
				|| (this.selectedCategories.length > 0 && this.selectedCategories.length != this.categories.length)) {
				url += "&where=";
				if (this.selectedVendors.length > 0 && this.selectedVendors.length != this.vendors.length) {
					url += `vendorId%20in%20${this.selectedVendors.map(v => v.vendorId).join(';')},`;
				}
				if (this.selectedCategories.length > 0 && this.selectedCategories.length != this.categories.length) {
					url += `inventoryCategoryId%20in%20${this.selectedCategories.map(c => c.inventoryCategoryId).join(';')}`;
				}
			}
			const inventory = await this.dataService.getItems<InventoryItem>(url).toPromise();
			this.gridInventory.data = inventory.data;
			this.gridInventory.totalRecords = inventory.count;
			this.gridInventory.showNoResults = true;
		}
		catch (e) {
			showToastError(this.toastr, e);
		}
		this.loading = false;
	}

	getCategory(id) {
		return this.categories.find(c => c.inventoryCategoryId == id).categoryName;
	}
}
