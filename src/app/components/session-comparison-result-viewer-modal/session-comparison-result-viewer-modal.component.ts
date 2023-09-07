import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {UniprotService} from "../../uniprot.service";
import {FormBuilder} from "@angular/forms";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-session-comparison-result-viewer-modal',
  templateUrl: './session-comparison-result-viewer-modal.component.html',
  styleUrls: ['./session-comparison-result-viewer-modal.component.scss']
})
export class SessionComparisonResultViewerModalComponent {
  private _data: any = {}
  sessionList: string[] = []
  currentID: string = ""
  queryList: string[] = []
  viewDF: any = {}
  comparison: any = {}

  form = this.fb.group({
    comparison: [""],
    targetComparison: [""],
    term: [""],
    category: ["geneName"],
  })

  @Input() set data(value : any) {
    this.queryList = value.queryList
    const currentDF = this.dataService.currentDF.where(row => this.queryList.includes(row[this.dataService.differentialForm.primaryIDs])).bake()
    for (const i in value.data) {
      if (this.settings.settings.currentID !== i) {
        this.sessionList.push(i)
        this._data[i] = currentDF.joinOuterLeft(new DataFrame(value.data[i]), (left:any) => left[this.dataService.differentialForm.primaryIDs],(right:any) => right["source_pid"],  (left:any, right:any) => {
          const uni = this.uniprot.getUniprotFromPrimary(left[this.dataService.differentialForm.primaryIDs])
          const result: any = {
            primaryID: left[this.dataService.differentialForm.primaryIDs],
            currentFC: parseFloat(left[this.dataService.differentialForm.foldChange]),
            currentPValue: parseFloat(left[this.dataService.differentialForm.significant]),
          }
          if (this.dataService.differentialForm.comparison !== "" && this.dataService.differentialForm.comparison !== null && this.dataService.differentialForm.comparison !== undefined && this.dataService.differentialForm.comparison !== "CurtainSetComparison") {
            result["comparison"] = left[this.dataService.differentialForm.comparison]
            if (typeof (this.dataService.differentialForm.comparisonSelect) === "string") {
              this.comparison['source'] = [this.dataService.differentialForm.comparisonSelect]
            } else {
              this.comparison['source'] = this.dataService.differentialForm.comparisonSelect
            }
          }
          if (right) {
            result["targetFC"] = parseFloat(right["foldChange"])
            result["targetPValue"] = parseFloat(right["significant"])
            result["targetPrimaryID"] = right["primaryID"]
            if (right["comparison"]) {
              if (typeof (right["comparison"]) === "string") {
                result["targetComparison"] = [right["comparison"]]
                this.comparison[i] = [right["comparison"]]
              } else{
                result["targetComparison"] = right["comparison"]
                this.comparison[i] = right["comparison"]
              }

            }
          }

          if (uni) {
            if (uni["Gene Names"] !== "") {
              result["geneName"] = uni["Gene Names"]
            }
          }
          return result
        }).bake()
        this.viewDF[i] = this._data[i].where((row: any) => row["primaryID"] !== undefined).bake()
      }
    }

    this.currentID = this.sessionList[0]
    console.log(this.form)

  }

  get data() {
    return this._data
  }

  constructor(
    private modal: NgbActiveModal,
    private dataService: DataService,
    public settings: SettingsService,
    private uniprot: UniprotService,
    private fb: FormBuilder,
    private web: WebService
  ) {


  }

  closeModal() {
    this.modal.dismiss()
  }

  filterData(id: string) {
    let data = this._data[id].where((row: any) => row["primaryID"]!== undefined).bake()

    if (this.form.value.comparison !== "" && this.form.value.comparison !== null && this.form.value.comparison !== undefined) {
      data = data.where((row: any) => row["comparison"] === this.form.value.comparison).bake()
    }
    if (this.form.value.targetComparison !== "" && this.form.value.targetComparison !== null && this.form.value.targetComparison !== undefined) {
      data = data.where((row: any) => row["targetComparison"] === this.form.value.targetComparison).bake()
    }
    if (this.form.value.term !== "" && this.form.value.term !== null && this.form.value.term !== undefined) {
      if (this.form.value.category === "geneName") {
        // @ts-ignore
        data = data.where((row: any) => row["geneName"].toLowerCase().includes(this.form.value.term.toLowerCase())).bake()
      } else {
        // @ts-ignore
        data = data.where((row: any) => row["primaryID"].toLowerCase().includes(this.form.value.term.toLowerCase())).bake()
      }
    }
    this.viewDF[id] = data
  }

  resetFilter(id: string) {
    this.viewDF[id] = this._data[id].where((row: any) => row["primaryID"]!== undefined).bake()
    this.form.reset()
  }

  exportData(id: string) {
    const data = this.viewDF[id].toCSV()
    this.web.downloadFile("comparison_result.csv", data)
  }

  exportAll() {
    //a function to export all data from viewDF
    for (const id in this.viewDF) {
      const data = this.viewDF[id].toCSV()
      this.web.downloadFile(id + "_comparison_result.csv", data)
    }
  }
}
