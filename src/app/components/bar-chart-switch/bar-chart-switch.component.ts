import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {StringdbInteractComponent} from "../stringdb-interact/stringdb-interact.component";

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
        // @ts-ignore
        this.selectionArray = this.dataService.selectionMap.get(this.dataService.allSelected[ind])
        if (this.dataService.allSelectedGenes.length >0) {
          if (this.uniprot.results.has(this.dataService.allSelected[ind])) {
            this.proteinFunction = this.uniprot.results.get(this.dataService.allSelected[ind])["Function [CC]"].replace("FUNCTION: ", "")
            this.title = this.dataService.allSelectedGenes[ind]
            this.hasUniprot = true
          }

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
  selectionArray: string[] = []
  constructor(public uniprot: UniprotService, private dataService: DataService, private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  viewing() {
    this.dataService.currentBrowsePosition = this.proteinID
  }

  openSTRING() {

    const modalRef = this.modalService.open(StringdbInteractComponent, {size: 'xl', scrollable: false});
    const geneNames: string[] = []
    for (const g of this.dataService.allSelectedGenes) {
      for (const g1 of g.split(";")) {
        geneNames.push(g1.toUpperCase())
      }
    }
    modalRef.componentInstance.data = {organism: this.uniprot.organism, identifiers: this.uniprot.results.get(this.proteinID)["Cross-reference (STRING)"].split(";"), selectedGenes: geneNames}
  }
}
