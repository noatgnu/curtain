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

  @Input() set data(value: any) {
    this._data = value.groups
    this.colorGroups = value.colorGroups
  }

  get data(): string[] {
    return this._data
  }

  form = this.fb.group({
    colors: [""],
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder, private toast: ToastService) {

  }

  ngOnInit(): void {
  }

  updateColorGroup() {
    this.modal.close(this.colorGroups)
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
