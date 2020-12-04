import { Router, ActivatedRoute } from '@angular/router';
import { Component, ViewChild, OnInit, ViewContainerRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from './shared/services/auth.service';
import { ToCamelCasePipe } from 'pajama-angular';
import { ROLE } from './shared/constants';
import { showToastSuccess, showToastError } from './shared/toast-helper';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.css'],
})
export class HomeComponent {
	
}
