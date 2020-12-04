import { Injectable, EventEmitter } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { IUserToken } from '../interfaces';
import { ConfigService } from './config.service';
import { User, Company } from '../models';
import * as moment from 'moment-timezone';
import { getErrorMessage } from '../utils';

@Injectable()
export class AuthService implements CanActivate {
	loggedInUserChanged = new EventEmitter<IUserToken>();

	constructor(private http: Http, private configService: ConfigService, private router: Router,
		private activatedRoute: ActivatedRoute) {
	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		const loggedInUser = this.loggedInUser;
		const canActivate = loggedInUser != null;
		let isAuthorized = true;
		if (canActivate) {
			if (route.data[0]) {
				if (route.data[0].module) {
					if (!loggedInUser.user.company.modules.includes(route.data[0].module)) {
						isAuthorized = false;
					}
				}
				if (isAuthorized && route.data[0].role) {
					isAuthorized = false;
					if (Array.isArray(route.data[0].role)) {
						for (let r of route.data[0].role) {
							if (this.hasRole(r)) {
								isAuthorized = true;
								break;
							}
						}
					}
					else {
						isAuthorized = this.hasRole(route.data[0].role);
					}
				}
			}
		}
		if (!isAuthorized) {
			this.router.navigate(['/unauthorized']);
		}
		else if (!canActivate) {
			this.router.navigate(['/login']);
		}
		return canActivate && isAuthorized;
	}

	private _userToken: IUserToken;
	get loggedInUser(): IUserToken {
		if (!this._userToken) {
			const userToken = localStorage.getItem('user-token');
			if (!userToken) return null;
			this._userToken = JSON.parse(userToken);
			moment.tz.setDefault(this._userToken.user.company.timezone);
		}
		return this._userToken;
	}

	hasRole(roleId: number): boolean {
		const loggedInUser = this.loggedInUser;
		if (loggedInUser == null) return false;
		return loggedInUser.user.roles && loggedInUser.user.roles.includes(roleId);
	}

	hasModule(moduleId: number): boolean {
		const loggedInUser = this.loggedInUser;
		if (loggedInUser == null) return false;
		return loggedInUser.user.company.modules.includes(moduleId);
	}

	async login(email: string, password: string, rememberMe: boolean) {
		const apiUrl = this.configService.apiUrl;
		try {
			const res = await this.http.post(`${apiUrl}/login`, { email, password, rememberMe }).toPromise();
			const userToken = res.json();
			localStorage.setItem('user-token', JSON.stringify(userToken));
			this._userToken = null;
			this.loggedInUserChanged.emit(userToken);
			return Promise.resolve(userToken);
		}
		catch (e) {
			return Promise.reject(e.json ? e.json() : e);
		}
	}

	async clockIn(email: string, password: string) {
		const apiUrl = this.configService.apiUrl;
		try {
			const res = await this.http.post(`${apiUrl}/clockIn`, { email, password }).toPromise();
			return Promise.resolve(res.json());
		}
		catch (e) {
			return Promise.reject(getErrorMessage(e));
		}
	}

	async clockOut(email: string, password: string) {
		const apiUrl = this.configService.apiUrl;
		try {
			const res = await this.http.post(`${apiUrl}/clockOut`, { email, password }).toPromise();
			return Promise.resolve(res.json());
		}
		catch (e) {
			return Promise.reject(getErrorMessage(e));
		}
	}

	updateLoggedInUser(userToken: IUserToken) {
		localStorage.setItem('user-token', JSON.stringify(userToken));
		this.loggedInUserChanged.emit(userToken);
	}

	logout(timedOut: boolean) {
		localStorage.removeItem('user-token');
		this._userToken = null;
		this.loggedInUserChanged.emit(null);
		if (timedOut) {
			let extras = timedOut ? { queryParams: { timedOut: true } } : {};
			this.router.navigate(['/login'], extras);
		}
		else {
			this.router.navigate(['/']);
		}
	}

	async forgotPassword(email: string) {
		const apiUrl = this.configService.apiUrl;
		try {
			const res = await this.http.post(`${apiUrl}/forgotPassword`, { email }).toPromise();
			return Promise.resolve();
		}
		catch (e) {
			return Promise.reject(e.json ? e.json() : e);
		}
	}

	async resetPassword(key, password: string): Promise<IUserToken> {
		const apiUrl = this.configService.apiUrl;
		try {
			const res = await this.http.post(`${apiUrl}/resetPassword`, { key, password }).toPromise();
			const userToken = res.json();
			localStorage.setItem('user-token', JSON.stringify(userToken))
			this.loggedInUserChanged.emit(userToken);
			return Promise.resolve(userToken);
		}
		catch (e) {
			return Promise.reject(e.json ? e.json() : e);
		}
	}

	async signup(user: User, company: Company, password: string) {
		const apiUrl = this.configService.apiUrl;
		try {
			const res = await this.http.post(`${apiUrl}/signup`, { user, company, password }).toPromise();
			const userToken = res.json();
			localStorage.setItem('user-token', JSON.stringify(userToken))
			this.loggedInUserChanged.emit(userToken);
			return Promise.resolve(userToken);
		}
		catch (e) {
			return Promise.reject(e.json ? e.json() : e);
		}
	}

	async requestDemo(firstName: string, lastName: string, companyName: string, phoneNumber: string, email: string) {
		const apiUrl = this.configService.apiUrl;
		try {
			await this.http.post(`${apiUrl}/requestDemo`, { firstName, lastName, companyName, phoneNumber, email }).toPromise();
			return Promise.resolve(true);
		}
		catch (e) {
			return Promise.reject(e.json ? e.json() : e);
		}
	}
}
