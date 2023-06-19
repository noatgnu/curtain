import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-protein-information',
  templateUrl: './protein-information.component.html',
  styleUrls: ['./protein-information.component.scss']
})
export class ProteinInformationComponent implements OnInit {
  _data: any = {}
  diseases: string[] = []
  @Input() set data(value: any) {
    this._data = value
    if (this._data["Involvement in disease"] && this._data["Involvement in disease"].length > 0) {
      this.diseases = this._data["Involvement in disease"].split(';').map((x: string) => x.replace(/DISEASE:/g, "").trim())
    }
  }
  constructor() { }

  ngOnInit(): void {
  }

}
