import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../service/data.service";
import {UniprotService} from "../../service/uniprot.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

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

  constructor(private dataService: DataService, private uniprot: UniprotService, private modalService: NgbModal) {
    this.dataService.annotationSelect.subscribe(data => {
      this.uniData = this.uniprot.results
      this.selectedRawData = []
      let count = 0
      this.allSelected = this.dataService.allSelected
      this.rows = this.dataComp.where(row => this.allSelected.includes(row.Proteins)).bake().toArray()
      console.log(this.rows)
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
  viewProfile(content: any) {
    this.modalService.open(content, {ariaLabelledBy: "profile-plot", size: 'xl'}).result.then((result) => {

    })
  }
}
