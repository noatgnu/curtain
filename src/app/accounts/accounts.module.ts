import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AccountsComponent} from "./accounts/accounts.component";
import {LoginModalComponent} from "./login-modal/login-modal.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {environment} from "../../environments/environment";
import {NgbDropdownModule, NgbNavModule, NgbPaginationModule} from "@ng-bootstrap/ng-bootstrap";


@NgModule({
    declarations: [
        AccountsComponent,
        LoginModalComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NgbPaginationModule,
        NgbNavModule,
        FormsModule,
        NgbDropdownModule,
    ],
    exports: [
        LoginModalComponent
    ],
    providers: []
})
export class AccountsModule { }
