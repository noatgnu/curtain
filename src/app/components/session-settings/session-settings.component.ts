import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormBuilder} from "@angular/forms";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {ToastService} from "../../toast.service";
import {AccountsService} from "../../accounts/accounts.service";

@Component({
  selector: 'app-session-settings',
  templateUrl: './session-settings.component.html',
  styleUrls: ['./session-settings.component.scss']
})
export class SessionSettingsComponent implements OnInit {
  private _currretID: string = ""
  owners: any[] = []
  @Input() set currentID(value: string) {
    if (!value || value === "") {
      this._currretID = this.settings.settings.currentID
    } else {
      this._currretID = value
    }

    this.accounts.curtainAPI.getSessionSettings(this.currentID).then((data: any) => {
      this.data.session = data.data
      this.accounts.curtainAPI.getOwners(this.currentID).then((data:any) => {
        this.owners = data.data["owners"]
      })
      for (const i in data.data) {
        if (i in this.form.controls) {
          this.form.controls[i].setValue(data.data[i])
        }
      }
    })
  }
  get currentID(): string {
    return this._currretID
  }
  form = this.fb.group({
    enable: [this.data.session.enable,],
    update_content: [false,],
    temporary_link_lifetime: [1,],
    additionalOwner: ["",]
  })
  temporaryLink: string = ""
  constructor(private fb: UntypedFormBuilder, private web:WebService, private modal: NgbActiveModal, private data: DataService, private settings: SettingsService, private toast: ToastService, private accounts: AccountsService) {

  }

  ngOnInit(): void {
  }

  generateTemporarySession() {
    if (this.form.value["temporary_link_lifetime"] > 0) {
      this.accounts.curtainAPI.generateTemporarySession(this.currentID, this.form.value["temporary_link_lifetime"]).then((data:any) => {
        this.temporaryLink = location.origin + `/#/${data.data["link_id"]}&${data.data["token"]}`
      })
    }
  }

  submit() {
    const payload: any = {enable: this.form.value["enable"]}
    if (this.form.value["update_content"]) {
      payload["file"] = {
        raw: this.data.raw.originalFile,
        rawForm: this.data.rawForm,
        differentialForm: this.data.differentialForm,
        processed: this.data.differential.originalFile,
        password: "",
        selections: this.data.selected,
        selectionsMap: this.data.selectedMap,
        selectionsName: this.data.selectOperationNames,
        settings: this.settings.settings,
        fetchUniprot: this.data.fetchUniprot,
        annotatedData: this.data.annotatedData
      }
    }

    this.accounts.curtainAPI.updateSession(payload, this.currentID).then(data => {
      this.data.session = data.data
      this.modal.dismiss()
    })
  }

  addOwner() {
    if (this.form.value["additionalOwer"] !== "") {
      this.accounts.curtainAPI.addOwner(this.currentID, this.form.value["additionalOwner"]).then((resp)=> {
        if (resp.status === 204) {
          this.accounts.curtainAPI.getOwners(this.currentID).then((data:any) => {
            this.owners = data.data["owners"]
          })
        } else {
          this.toast.show("Adding owner error", "This owner cannot be found.").then()
        }
      }, (error) => {
        this.toast.show("Adding owner error", "This owner cannot be found.").then()
      })
    }
  }
}
