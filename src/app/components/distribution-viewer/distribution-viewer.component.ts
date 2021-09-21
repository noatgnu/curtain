import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../service/data.service";
import {UniprotService} from "../../service/uniprot.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DbStringService} from "../../service/db-string.service";

@Component({
  selector: 'app-distribution-viewer',
  templateUrl: './distribution-viewer.component.html',
  styleUrls: ['./distribution-viewer.component.css']
})
export class DistributionViewerComponent implements OnInit {
  _data: IDataFrame = new DataFrame()
  @Input() set data(value: IDataFrame) {
    this._data = value
  }
  get data(): IDataFrame {
    return this._data
  }

  selectedRawData: any = {}

  allSelected: string[] = []
  rows: any[] = []
  @Input() dataComp: IDataFrame = new DataFrame()
  uniData: Map<string, any> = new Map<string, any>()

  labelKeys: string[] = []
  labelSamples: any = {}
  disableInteractionFilter: boolean = true
  interactionType: string = "physical"

  constructor(private dataService: DataService, private uniprot: UniprotService, private modalService: NgbModal, private dbstring:DbStringService) {
    this.dbstring.interactionAnalysis.asObservable().subscribe(data => {
      if (data) {
        this.disableInteractionFilter = false
        this.interactionFilterStatus = false
        this.changeInteraction()
        //this.selectedInteractionFilter = this.filteredAllSelected[0]
      } else {
        this.disableInteractionFilter = true
        this.interactionFilterStatus = false
      }
    })

    this.dataService.annotationSelect.subscribe(data => {
      this.uniData = this.uniprot.results
      this.selectedRawData = []
      let count = 0
      this.allSelected = this.dataService.allSelected
      this.filteredAllSelected = this.allSelected
      this.rows = this.dataComp.where(row => this.allSelected.includes(row.Proteins)).bake().toArray()

      for (const i of this.dataService.allSelected) {
        count ++
        if (count > 20) {
          this.selectedRawData[i] = {df: this._data.where(row => row.Proteins === i).bake(), visible: false}
        } else {
          this.selectedRawData[i] = {df: this._data.where(row => row.Proteins === i).bake(), visible: true}
        }
      }
    })
    this.dataService.clearService.asObservable().subscribe(data => {
      this.allSelected = []
      this.selectedRawData = {}
    })
    this.dataService.barChartSampleLabels.asObservable().subscribe(data => {
      this.labelKeys = this.dataService.barChartKeys
      this.labelSamples = this.dataService.relabelSamples
    })
  }
  modalViewer(content: any, type: string) {
    this.modalService.open(content, {ariaLabelledBy: type, size: 'xl'}).result.then((result) => {

    })
  }

  changeLabel(content: any) {
    for (const i in this.labelSamples) {
      if (this.labelSamples[i]) {
        if (this.labelSamples[i] !== "") {
          this.dataService.relabelSamples[i] = this.labelSamples[i]
        }
      }
    }
    this.dataService.barChartSampleLabels.next(true)
    content.dismiss("close")
  }

  updateView(content: any) {
    content.dismiss()
  }

  ngOnInit(): void {
  }

  interactionFilterStatus: boolean = false
  filteredAllSelected: string[] = []
  selectedInteractionFilter: string = ""
  enableInteractionFilter() {
    this.interactionFilterStatus = !this.interactionFilterStatus
  }

  getTitle(acc: string|undefined) {
    if (acc) {
      if (this.uniprot.results.has(acc)) {
        const r = this.uniprot.results.get(acc)
        return acc + "(" + r["Gene names"] + ")"
      }
    }
    return acc
  }

  changeDisplaying() {
    const filterList: string[] = [this.selectedInteractionFilter]
    for (const a of this.uniprot.results.get(this.selectedInteractionFilter)[this.interactionType]) {
      const b = this.dbstring.reverseStringMap.get(a.stringId_B)
      if (b) {
        filterList.push(b)
      }
    }

    const notIncluded: string[] = []
    for (const a of this.allSelected) {
      this.selectedRawData[a].visible = filterList.includes(a);
      if (!this.selectedRawData[a].visible) {
        notIncluded.push(a)
      }
    }

    for (const a of notIncluded) {
      filterList.push(a)
    }
    this.allSelected = filterList
  }

  changeInteraction() {
    this.filteredAllSelected = []
    for (const a of this.allSelected) {
      if (this.interactionType in this.uniprot.results.get(a)) {
        this.filteredAllSelected.push(a)
      }
    }
  }
}
