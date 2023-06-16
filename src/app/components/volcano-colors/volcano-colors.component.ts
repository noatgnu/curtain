import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {FormBuilder} from "@angular/forms";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-volcano-colors',
  templateUrl: './volcano-colors.component.html',
  styleUrls: ['./volcano-colors.component.scss']
})
export class VolcanoColorsComponent implements OnInit {
  colorGroups: any[] = []
  private _data: string[] = []

  @Input() set data(value: string[]) {
    this._data = value
    this.colorGroups = []
    for (const g in this.settings.settings.colorMap) {
      if (this._data.includes(g)) {
        this.colorGroups.push({color: this.settings.settings.colorMap[g], group: g, remove: false})
      }
    }
  }

  get data(): string[] {
    return this._data
  }

  form = this.fb.group({
    colors: [""],
  })

  constructor(private modal: NgbActiveModal, private settings: SettingsService, private fb: FormBuilder, private toast: ToastService) {

  }

  ngOnInit(): void {
  }

  updateColorGroup() {
    for (const g of this.colorGroups) {
      if (this.settings.settings.colorMap[g.group] !== g.color) {
        this.settings.settings.colorMap[g.group] = g.color
      }
      if (g.remove) {
        delete this.settings.settings.colorMap[g.group]
      }
    }
    this.modal.dismiss()
  }

  closeModal() {
    this.modal.dismiss()
  }

  copyColorArray() {
    const colorArray: any[] = this.colorGroups.map(x => {
      return {group: x.group, color: x.color}
    })
    navigator.clipboard.writeText(JSON.stringify(colorArray)).then(
      () => {
        this.toast.show("Clipboard", "Color array copied to clipboard").then()
      }
    )
  }

  pasteColorArray() {
    if (this.form.value["colors"] !== "" && this.form.value["colors"] !== null && this.form.value["colors"] !== undefined) {
      const colorArray = JSON.parse(this.form.value["colors"])
      for (const c of colorArray) {
        for (const g of this.colorGroups) {
          if (g.group === c.group) {
            g.color = c.color
          }
        }
      }
    }

  }
}
