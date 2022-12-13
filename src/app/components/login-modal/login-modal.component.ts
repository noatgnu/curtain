import { Component, OnInit } from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {AccountsService} from "../../accounts.service";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent implements OnInit {
  form = this.fb.group({
    username: [null, Validators.required],
    password: [null, Validators.required]
  })
  constructor(private modal: NgbActiveModal, private fb: FormBuilder, private accounts: AccountsService, private web: WebService) { }

  ngOnInit(): void {
  }

  login() {
    if (this.form.valid) {
      this.accounts.login(this.form.value["username"], this.form.value["password"]).subscribe((data: any) => {
        this.accounts.accessToken = data.access
        this.accounts.refreshToken = data.refresh
        this.accounts.loggedIn = true
        this.accounts.lastTokenUpdateTime = new Date()
        this.accounts.lastRefreshTokenUpdateTime = new Date()
        this.web.getUserData().subscribe((data: any) => {
          this.accounts.user_id = data.id
          this.accounts.user_name = data.username
          this.accounts.user_staff = data.is_staff
          this.form.reset()
          this.modal.dismiss()
        })
      })
    }

  }
}
