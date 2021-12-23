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
  enableUniprot: boolean = false;
  constructor(private dataService: DataService, private uniprot: UniprotService, private modalService: NgbModal, private dbstring:DbStringService) {
    this.enableUniprot = this.uniprot.fetched
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
      this.selectedRawData = {}
      let count = 0
      this.allSelected = this.dataService.allSelected
      this.filteredAllSelected = this.allSelected
      this.rows = this.dataComp.where(row => this.allSelected.includes(row["Primary IDs"])).bake().toArray()

      for (const i of this.dataService.allSelected) {
        count ++
        if (count > 20) {
          if (!(i in this.dataService.settings.selectedIDs)) {
            this.dataService.settings.selectedIDs[i] = {visible: false}
            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: false}
          } else {
            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: this.dataService.settings.selectedIDs[i].visible}
          }
        } else {
          if (!(i in this.dataService.settings.selectedIDs)) {
            this.dataService.settings.selectedIDs[i] = {visible: true}
            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: true}
          } else {
            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: this.dataService.settings.selectedIDs[i].visible}
          }

        }
      }


    })
    this.dataService.clearService.asObservable().subscribe(data => {
      this.allSelected = []
      this.selectedRawData = {}
      this.dataService.settings.selectedIDs = {}
    })
    this.dataService.clearSpecificService.asObservable().subscribe(data => {

      this.allSelected = this.dataService.allSelected
      this.selectedRawData = {}
      this.rows = this.dataComp.where(row => this.allSelected.includes(row["Primary IDs"])).bake().toArray()
      let count = 0
      const selectedIDs: any = {}
      for (const i of this.dataService.allSelected) {
        count ++
        if (count > 20) {
          if (!(i in selectedIDs)) {
            if (i in this.dataService.settings.selectedIDs) {
              selectedIDs[i] = {visible: this.dataService.settings.selectedIDs[i].visible}
            } else {
              selectedIDs[i] = {visible: false}
            }

            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: selectedIDs[i].visible}
          } else {
            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: selectedIDs[i].visible}
          }
        } else {
          if (!(i in selectedIDs)) {
            if (i in this.dataService.settings.selectedIDs) {
              selectedIDs[i] = {visible: this.dataService.settings.selectedIDs[i].visible}
            } else {
              selectedIDs[i] = {visible: true}
            }
            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: selectedIDs[i].visible}
          } else {
            this.selectedRawData[i] = {df: this._data.where(row => row["Primary IDs"] === i).bake(), visible: selectedIDs[i].visible}
          }
        }
      }
      this.dataService.settings.selectedIDs = selectedIDs
    })

    this.dataService.barChartSampleLabels.asObservable().subscribe(data => {
      this.labelKeys = this.dataService.barChartKeys
      this.labelSamples = this.dataService.relabelSamples
    })
  }

  viewAllSelected() {
    for (const a of this.allSelected) {
      this.selectedRawData[a].visible = true
      this.dataService.settings.selectedIDs[a].visible = true
    }

  }

  modalViewer(content: any, type: string) {
    this.modalService.open(content, {ariaLabelledBy: type, size: 'xl'}).result.then((result) => {
      this.dataService.settings.sampleLables = this.labelSamples;
      for (let k in this.selectedRawData) {
        this.dataService.settings.selectedIDs[k].visible = this.selectedRawData[k].visible
      }

    }, (reason) => {
      this.dataService.settings.sampleLables = this.labelSamples;
      for (let k in this.selectedRawData) {
        this.dataService.settings.selectedIDs[k].visible = this.selectedRawData[k].visible
      }
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
    if (this.uniprot.results.has(this.selectedInteractionFilter)) {
      for (const a of this.uniprot.results.get(this.selectedInteractionFilter)[this.interactionType]) {
        const b = this.dbstring.reverseStringMap.get(a.stringId_B)
        if (b) {
          filterList.push(b)
        }
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
      if (this.uniprot.results.has(a)) {
        if (this.interactionType in this.uniprot.results.get(a)) {
          this.filteredAllSelected.push(a)
        }
      }
    }
  }


  sortEnable: boolean = false
  sortParams: string = ""
  nativeParams: string[] = ["logFC", "pvalue"]
  sortUniprot() {
    if (this.sortEnable && this.sortParams !== "") {
      this.rows = this.rows.sort((a, b)=>{
        let au
        let bu
        if (!this.nativeParams.includes(this.sortParams)) {
          au = this.uniprot.results.get(a["Primary IDs"])[this.sortParams]
          bu = this.uniprot.results.get(b["Primary IDs"])[this.sortParams]
        } else {
          au = a[this.sortParams]
          bu = b[this.sortParams]
        }

        if (au > bu) {
          return 1;
        } else {
          return -1;
        }
      })
      this.rows = [...this.rows]
      const tempSelected = []
      for (const i of this.rows) {
        if (this.allSelected.includes(i["Primary IDs"])) {
          tempSelected.push(i["Primary IDs"])
        }
      }
      this.allSelected = tempSelected
    }

  }

  clearAllSelected() {
    for (const k in this.selectedRawData) {
      this.selectedRawData[k].visible = false
      this.dataService.settings.selectedIDs[k].visible = false
    }
  }

  selectTop(n: number = 10) {
    for (const r of this.rows.slice(0, n)) {
      this.selectedRawData[r['Primary IDs']].visible = true
      this.dataService.settings.selectedIDs[r['Primary IDs']].visible = true
    }
  }

  selectBottom(n: number = 10) {
    for (const r of this.rows.slice(this.rows.length-n)) {
      this.selectedRawData[r['Primary IDs']].visible = true
      this.dataService.settings.selectedIDs[r['Primary IDs']].visible = true
    }
  }

}
