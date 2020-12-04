import { Injectable, APP_INITIALIZER } from '@angular/core';
import { Http } from '@angular/http';
import { Location } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable()
export class ConfigService {

	private config: any;

	constructor(private location: Location, private http: Http) {
	}

	load() {
		if (this.config) return;
		return new Promise<void>((resolve, reject) => {
			this.http.get(this.location.prepareExternalUrl(`/assets/config.${environment.production ? 'prod.' : ''}json`))
				.subscribe((res) => {
					this.config = res.json();
					resolve();
				});
		});
	}

	get apiUrl(): string {
		return this.config.apiUrl;
	}

	get paypalUrl(): string {
		return this.config.paypalUrl;
	}

	get chargeOptions(): any[] {
		return this.config.chargeOptions;
	}

	get development(): boolean {
		return this.config.development === null || this.config.development === undefined ? true : this.config.development;
	}

	get pingFrequency(): number {
		return this.config.pingFrequency;
	}

	get isAndroid(): boolean {
		return navigator.userAgent.match(/Android/i) != null;
	}
	get isBlackBerry(): boolean {
		return navigator.userAgent.match(/BlackBerry/i) != null;
	}
	get isiOS(): boolean {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i) != null;
	}
	get isOpera(): boolean {
		return navigator.userAgent.match(/Opera Mini/i) != null;
	}
	get isWindows(): boolean {
		return navigator.userAgent.match(/IEMobile/i) != null || navigator.userAgent.match(/WPDesktop/i) != null;
	}
	get isMobile(): boolean {
		return this.isAndroid || this.isBlackBerry || this.isiOS || this.isOpera || this.isWindows;
	}
}


export function ConfigFactory(config: ConfigService) {
	return () => config.load();
}

export function init() {
	return {
		provide: APP_INITIALIZER,
		useFactory: ConfigFactory,
		deps: [ConfigService],
		multi: true
	}
}

const ConfigModule = {
	init: init
}

export { ConfigModule };