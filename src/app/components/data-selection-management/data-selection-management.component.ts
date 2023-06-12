import { Component, OnInit } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-data-selection-management',
  templateUrl: './data-selection-management.component.html',
  styleUrls: ['./data-selection-management.component.scss']
})
export class DataSelectionManagementComponent implements OnInit {
  selectionForms: {[key: string]: FormGroup} = {}
  selectionMap: {[key: string]: string[]} = {}

  constructor(private modal: NgbActiveModal, private settings: SettingsService, public data: DataService, private fb: FormBuilder) {
    this.settings.settings
    for (const s of this.data.selectOperationNames) {
      this.selectionForms[s] = this.fb.group({
        enabled: [true],
        title: [s],
        markForDeletion: [false],
      })
      this.selectionMap[s] = []
    }
    for (const s in this.data.selectedMap) {
      for (const selection of this.data.selectedMap[s]) {
        this.selectionMap[selection].push(s)
      }
    }
  }

  ngOnInit(): void {
  }

  save() {
    const newList = this.data.selectOperationNames.filter(s => !this.selectionForms[s].value["markForDeletion"])
    const listRemoved = this.data.selectOperationNames.filter(s => this.selectionForms[s].value["markForDeletion"])
    for (const s of listRemoved) {
      if (this.settings.settings.colorMap[s]) {
        delete this.settings.settings.colorMap[s]
      }
    }
    for (const sel in this.data.selectedMap) {
      this.data.selectedMap[sel] = this.data.selectedMap[sel].filter((s:string) => newList.includes(s))
      if (this.data.selectedMap[sel].length === 0) {
        delete this.data.selectedMap[sel]
      }
    }

    if (newList.length !== this.data.selectOperationNames.length) {
      this.data.selectOperationNames = newList
    }

    this.modal.close()
  }

  close() {
    this.modal.dismiss()
  }


}
