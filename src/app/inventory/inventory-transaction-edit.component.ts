import { Component, Input, ViewChild } from '@angular/core';
import { AttendanceReason, InventoryTransaction, Vendor, InventoryItem } from '../shared/models';
import { NgForm } from '@angular/forms';
import { AuthDataService } from '../shared/services/data.service';
import { EMAIL_TEMPLATE_TYPE, TRANSACTION_TYPE } from '../shared/constants';
import { validateFormFields } from '../shared/utils';
import { ModalDialogComponent } from 'pajama-angular';
import { ToastrService } from 'ngx-toastr';
import { showToastError } from '../shared/toast-helper';

@Component({
	selector: 'inventory-transaction-edit',
	templateUrl: './inventory-transaction-edit.component.html',
})
export class InventoryTransactionEditComponent {

	@ViewChild("form")
	form: NgForm;

	loading = false;

	@Input()
	inventoryTransaction: InventoryTransaction;

	@Input()
	inventoryItem: InventoryItem;

	@Input()
	incoming: boolean;

	@Input()
	apiUrl: string;

	@Input()
	vendors: Array<Vendor>;

	@Input()
	inventoryTransactionModal: ModalDialogComponent;

	costPer: number;

	get totalCost(): number {
		return this.costPer * this.inventoryTransaction.quantity;
	}
	set totalCost(c: number) {
		if (this.inventoryTransaction.quantity == 0) return;
		this.costPer = c / this.inventoryTransaction.quantity;
	}

	constructor(private dataService: AuthDataService, private toastr: ToastrService) {
	}

	async save() {
		let invalids = validateFormFields(this.form);
		if (invalids) {
			showToastError(this.toastr, invalids);
			return;
		}
		this.loading = true;
		this.inventoryTransaction.inventoryItem = this.inventoryItem;
		this.inventoryTransaction.inventoryItemId = this.inventoryItem.inventoryItemId;
		this.inventoryTransaction.transactionType = this.incoming ? TRANSACTION_TYPE.RESTOCK : TRANSACTION_TYPE.USAGE;
		this.costPer = this.inventoryTransaction.inventoryItem.unitCost;
		this.inventoryTransaction.transactionDate = new Date();
		this.inventoryTransaction.quantity = (this.incoming ? 1 : -1) * this.inventoryTransaction.quantity;
		try {
			const res = await this.dataService.post(`${this.apiUrl}/inventoryTransactions`, this.inventoryTransaction).toPromise();
			this.inventoryTransactionModal.tag = res;
			this.inventoryTransactionModal.hide();
		}
		catch (err) {
			showToastError(this.toastr, err);
		}
		this.loading = false;
	}
}
