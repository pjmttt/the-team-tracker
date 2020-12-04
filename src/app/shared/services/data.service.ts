import { Injectable, EventEmitter } from '@angular/core';
import { AuthService } from './auth.service';
import { DataService } from 'pajama-angular';
import { RequestOptions, Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { getErrorMessage } from '../utils';

@Injectable()
export class AuthDataService extends DataService {
	constructor(protected http: Http, private authService: AuthService, private configService: ConfigService) {
		super(http);
	}

	getOptions(): RequestOptions {
		const options = new RequestOptions();
		const userToken = this.authService.loggedInUser;
		options.headers = new Headers();
		options.headers.append("access-token", userToken.accessToken);
		return options;
	}

	getRaw(url, options?: RequestOptions): Observable<Response> {
		return this.http.get(url, options || this.getOptions());
	}

	handleError(error): Observable<never> {
		if (error.status && error.status == 401) {
			this.authService.logout(true);
		}
		return super.handleError(error);
	}

	resetActivity() {
		this.post(`${this.configService.apiUrl}/ping?reset=true`).subscribe(d => {
			// do anything here?
		});
	}

	async clockInOutById(userId: string) {
		const apiUrl = this.configService.apiUrl;
		try {
			const res = await this.post<any, any>(`${apiUrl}/clockInOutById`, { userId }).toPromise();
			return Promise.resolve(res);
		}
		catch (e) {
			return Promise.reject(getErrorMessage(e));
		}
	}
}