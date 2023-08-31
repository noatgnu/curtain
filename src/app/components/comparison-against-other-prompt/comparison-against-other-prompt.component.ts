import { Component } from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {AccountsService} from "../../accounts/accounts.service";
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-comparison-against-other-prompt',
  templateUrl: './comparison-against-other-prompt.component.html',
  styleUrls: ['./comparison-against-other-prompt.component.scss']
})
export class ComparisonAgainstOtherPromptComponent {

  form = this.fb.group({
    urls: [[""], Validators.required],
    matchType: ["primaryID", Validators.required],
    selection: ["", Validators.required],
  })

  urls: any[] = [{url: ""}]

  constructor(private modal: NgbActiveModal, private fb: FormBuilder, private accounts: AccountsService, public settings: SettingsService, public data: DataService) {
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
        this.accounts.curtainAPI.postCompareSession(idList, this.form.value["matchType"], selections).then(response => {
          this.modal.close({data: response.data, queryList: selections})
        })
      }
    }
  }

  cancel() {
    this.modal.dismiss()
  }
}
