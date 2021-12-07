import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";

@Component({
  selector: 'app-bar-chart-switch',
  templateUrl: './bar-chart-switch.component.html',
  styleUrls: ['./bar-chart-switch.component.css']
})
export class BarChartSwitchComponent implements OnInit {
  get proteinID(): string {
    return this._proteinID;
  }


  private _proteinID: string = ""
  @Input() data: IDataFrame = new DataFrame();
  @Input() set proteinID(value: string) {
    this._proteinID = value;
    if (value) {
      if (value !== "") {
        if (this.uniprot.results.has(value)) {
          this.proteinFunction = this.uniprot.results.get(value)["Function [CC]"].replace("FUNCTION: ", "")
          this.title = this.uniprot.results.get(value)["Gene names"]
          this.hasUniprot = true
        } else {
          this.title = value
          this.hasUniprot = false
        }
      }
    }
  }
  title: string = ""
  proteinFunction: string = ""
  average: boolean = false;
  hasUniprot: boolean = false;
  constructor(private uniprot: UniprotService) { }

  ngOnInit(): void {
  }

}
