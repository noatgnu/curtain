import { Component } from '@angular/core';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal, NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {AccountsService} from "../../accounts/accounts.service";

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgbAlert
  ],
  templateUrl: './api-key-modal.component.html',
  styleUrl: './api-key-modal.component.scss'
})
export class ApiKeyModalComponent {
  form = this.fb.group({
    name: new FormControl(null, Validators.required)
  })

  apiKeys: {name: string}[] = []
  apiKey: string = ""
  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal, private account: AccountsService) {
    this.account.curtainAPI.getCurtainAPIKeys().then((data: any) => {
      console.log(data)
      this.apiKeys = data.data
    })
  }

  submit() {
    this.activeModal.close(this.form.value)
  }

  close() {
    this.activeModal.dismiss()
  }

  create() {
    if (this.form.valid && this.form.value.name) {
      this.account.curtainAPI.createCurtainAPIKey(this.form.value.name).then((data: any) => {
        console.log(data)
        this.apiKeys = data.data.key
      })
    }

  }
}
