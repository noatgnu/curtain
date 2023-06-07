import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";

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

  constructor(private modal: NgbActiveModal, private settings: SettingsService) {

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
}
