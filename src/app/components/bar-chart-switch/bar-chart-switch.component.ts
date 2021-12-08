import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";

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
      const ind = this.dataService.allSelected.indexOf(value)
      if (ind !== -1) {
        if (this.dataService.allSelectedGenes.length >0) {
          this.proteinFunction = this.uniprot.results.get(this.dataService.allSelected[ind])["Function [CC]"].replace("FUNCTION: ", "")
          this.title = this.dataService.allSelectedGenes[ind]
          this.hasUniprot = true
        } else {
          this.title = this.dataService.allSelected[ind]
          this.hasUniprot = false
        }
      }
    }
  }
  title: string = ""
  proteinFunction: string = ""
  average: boolean = false;
  hasUniprot: boolean = false;

  constructor(private uniprot: UniprotService, private dataService: DataService) { }

  ngOnInit(): void {
  }

  viewing() {
    this.dataService.currentBrowsePosition = this.proteinID
  }
}
