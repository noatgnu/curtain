import {Component, OnDestroy} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {AccountsService} from "../../accounts/accounts.service";
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebsocketService} from "../../websocket.service";
import {Subscription} from "rxjs";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-comparison-against-other-prompt',
  templateUrl: './comparison-against-other-prompt.component.html',
  styleUrls: ['./comparison-against-other-prompt.component.scss']
})
export class ComparisonAgainstOtherPromptComponent implements OnDestroy{

  form = this.fb.group({
    urls: [[""], Validators.required],
    matchType: ["primaryID", Validators.required],
    selection: ["", Validators.required],
  })

  matchTypes: string[] = ["primaryID","primaryID-uniprot", "geneNames"]

  urls: any[] = [{url: ""}]
  sub: Subscription|undefined
  constructor(private modal: NgbActiveModal, private ws: WebsocketService, private fb: FormBuilder, private accounts: AccountsService, public settings: SettingsService, public data: DataService, private toast: ToastService) {
  }

  onSubmit() {
    const idList: string[] = [this.settings.settings.currentID]
    const selections: string[] = []
    if (this.form.valid) {
      this.form.controls["urls"].setValue(this.urls.map(a => a.url))
      if (this.form.value["urls"]) {
        if (this.form.value["urls"].length > 0) {
          for (const u of this.form.value["urls"]) {
            if (u.startsWith(location.origin)) {
              const params = u.replace(location.origin + "/#/", "").split("&")
              if (params[0] !== "") {
                idList.push(params[0])
              }
            }

          }
        }
      }
    }
    for (const s in this.data.selectedMap) {
      for (const selection in this.data.selectedMap[s]) {
        if (selection === this.form.value["selection"]) {
          selections.push(s)
        }
      }
    }
    if (idList.length > 0) {
      if (this.form.value["matchType"]) {
        this.accounts.curtainAPI.postCompareSession(idList, this.form.value["matchType"], selections, this.ws.sessionID).then(response => {
          if (response) {
            if (!this.ws.jobConnection) {
              this.ws.connectJob()
            }
            this.sub?.unsubscribe()
            this.sub = this.ws.getJobMessages()?.subscribe((message: any) => {
              console.log(message)
              this.toast.show(message.requestType, message.message).then()
              if (message.message === "Operation Completed" && message.requestType === "Compare Session") {
                this.modal.close({data: message.data, queryList: selections})
              }
            })
          }

        })
      }
    }
  }

  cancel() {
    this.modal.dismiss()
  }

  ngOnDestroy() {
    this.sub?.unsubscribe()
  }
}
