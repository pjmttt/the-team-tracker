import { getErrorMessage } from "./utils";
import { ToastrService, DefaultGlobalConfig } from "ngx-toastr";

export function showToastError(toastr: ToastrService, error, dissapear: boolean = false) {

	const opts = new DefaultGlobalConfig();
	opts.positionClass = "toast-bottom-right";
	if (!dissapear) {
		opts.closeButton = true;
		opts.autoDismiss = false;
		opts.timeOut = 0;
	}

	return toastr.error(getErrorMessage(error), null, opts);
}

export function showToastSuccess(toastr: ToastrService, message) {
	// toastr.clearAllToasts();
	const opts = new DefaultGlobalConfig();
	opts.positionClass = "toast-bottom-right";
	return toastr.success(message, null, opts);
}