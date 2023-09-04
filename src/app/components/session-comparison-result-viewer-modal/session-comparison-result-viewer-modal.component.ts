import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {UniprotService} from "../../uniprot.service";

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
  @Input() set data(value : any) {
    this.queryList = value.queryList
    const currentDF = this.dataService.currentDF.where(row => this.queryList.includes(row[this.dataService.differentialForm.primaryIDs])).bake()
    for (const i in value.data) {
      if (this.settings.settings.currentID !== i) {
        this.sessionList.push(i)
        this._data[i] = currentDF.joinOuterLeft(new DataFrame(value.data[i]), (left:any) => left[this.dataService.differentialForm.primaryIDs],(right:any) => right["source_pid"],  (left:any, right:any) => {
          const uni = this.uniprot.getUniprotFromPrimary(left[this.dataService.differentialForm.primaryIDs])

          const result: any = {
            primaryID: parseFloat(left[this.dataService.differentialForm.primaryIDs]),
            currentFC: parseFloat(left[this.dataService.differentialForm.foldChange]),
            currentPValue: parseFloat(left[this.dataService.differentialForm.significant]),

          }
          if (right) {
            result["targetFC"] = parseFloat(right["foldChange"])
            result["targetPValue"] = parseFloat(right["significant"])
          }
          if (uni) {
            if (uni["Gene Names"] !== "") {
              result["geneName"] = uni["Gene Names"]
            }
          }
          return result
        }).bake()
      }

    }
    console.log(this._data)

    this.currentID = this.sessionList[0]
  }

  get data() {
    return this._data
  }

  constructor(private modal: NgbActiveModal, private dataService: DataService, public settings: SettingsService, private uniprot: UniprotService) {

  }

  closeModal() {
    this.modal.dismiss()
  }

}
