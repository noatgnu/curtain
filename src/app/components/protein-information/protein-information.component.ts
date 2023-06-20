import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-protein-information',
  templateUrl: './protein-information.component.html',
  styleUrls: ['./protein-information.component.scss']
})
export class ProteinInformationComponent implements OnInit {
  _data: any = {}
  diseases: string[] = []
  pharmaUse: string[] = []
  @Input() set data(value: any) {
    this._data = value
    if (this._data["Involvement in disease"] && this._data["Involvement in disease"].length > 0) {
      this.diseases = this._data["Involvement in disease"].split(';').map((x: string) => x.replace(/DISEASE:/g, "").trim())
    }
    if (this._data["Pharmaceutical use"] && this._data["Pharmaceutical use"].length > 0) {
      this.pharmaUse = this._data["Pharmaceutical use"].split(';').map((x: string) => x.replace(/PHARMACEUTICAL:/g, "").trim())
    }
  }
  constructor() { }

  ngOnInit(): void {
  }

}
