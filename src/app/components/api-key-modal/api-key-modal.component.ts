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

  apiKeys: {name: string, id: string}[] = []
  apiKey: string = ""
  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal, private account: AccountsService) {
    this.refreshList()
  }


  close() {
    this.activeModal.dismiss()
  }

  create() {
    if (this.form.valid && this.form.value.name) {
      this.account.curtainAPI.createCurtainAPIKey(this.form.value.name).then((data: any) => {
        this.apiKey = data.data.key
        console.log(data)
        this.refreshList()
      })
    }
  }

  refreshList() {
    this.account.curtainAPI.getCurtainAPIKeys().then((data: any) => {
      this.apiKeys = data.data.results
    })
  }

  delete(id: any) {
    this.account.curtainAPI.deleteCurtainAPIKey(id).then(() => {
      this.refreshList()
    })
  }
}
