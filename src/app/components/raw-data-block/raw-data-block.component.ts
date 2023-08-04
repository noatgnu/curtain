import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {PdbViewerComponent} from "../pdb-viewer/pdb-viewer.component";
import {ScrollService} from "../../scroll.service";
import {SettingsService} from "../../settings.service";
import {Subject, Subscription} from "rxjs";
import {FormBuilder} from "@angular/forms";

@Component({
  selector: 'app-raw-data-block',
  templateUrl: './raw-data-block.component.html',
  styleUrls: ['./raw-data-block.component.scss']
})
export class RawDataBlockComponent implements OnInit, OnDestroy {
  _data: any = {}
  title = ""
  uni: any = null
  primaryID = ""
  foundIn: string[] = []
  active = 2
  selfCheck = false
  enrichrData: any = null
  enrichrRunNameList: string[] = []
  enrichrTermList: string[] = []
  @Input() set data(value: any) {
    this._data = value

    this.primaryID = this._data[this.dataService.rawForm.primaryIDs]

    const form = this.fb.group({
      annotate: [false],
      profilePlot: [this.settings.settings.selectedComparison.includes(this.primaryID)],
    })

    for (const i in this.settings.settings.textAnnotation) {
      if (this.settings.settings.textAnnotation[i].primary_id === this.primaryID) {
        form.controls["annotate"].setValue(true)
        break
      }
    }

    this.form = form
    this.formChange()
    this.title = this._data[this.dataService.rawForm.primaryIDs]
    this.foundIn = Object.keys(this.dataService.selectedMap[this._data[this.dataService.rawForm.primaryIDs]])
    if (this.dataService.fetchUniprot) {
      this.uni = this.uniprot.getUniprotFromPrimary(this.primaryID)
      if (this.uni) {
        if (this.uni["Gene Names"] !== "") {
          this.title = this.uni["Gene Names"]
          const gene = this.uni["Gene Names"].split(";")[0]
          if (this.settings.settings.enrichrGeneRankMap[gene]) {
            this.enrichrData = this.settings.settings.enrichrGeneRankMap[gene]
            this.enrichrRunNameList = Object.keys(this.enrichrData)
            let terms: string[] = []
            for (const i of this.enrichrRunNameList) {
              terms = terms.concat(Object.keys(this.enrichrData[i]))
            }
            this.enrichrTermList = [...new Set(terms)]
          }
        }
      }
    }
  }
  profileComparisonToggle:boolean = false

  form = this.fb.group({
    annotate: [false],
    profilePlot: [false],
  })
  annotateSubscription = new Subscription()
  profilePlotSubscription = new Subscription()
  constructor(private scroll: ScrollService, public dataService: DataService, private uniprot: UniprotService, private modal: NgbModal, private settings: SettingsService, private fb: FormBuilder) {
    this.dataService.finishedProcessingData.asObservable().subscribe((value) => {
      if (value) {
        if (this.dataService.selectedMap[this._data[this.dataService.rawForm.primaryIDs]]) {
          this.foundIn = Object.keys(this.dataService.selectedMap[this._data[this.dataService.rawForm.primaryIDs]])
        }
      }
      if (this.uni) {
        if (this.uni["Gene Names"] !== "") {
          const gene = this.uni["Gene Names"].split(";")[0]
          if (this.settings.settings.enrichrGeneRankMap[gene]) {
            this.enrichrData = this.settings.settings.enrichrGeneRankMap[gene]
            this.enrichrRunNameList = Object.keys(this.enrichrData)
            let terms: string[] = []
            for (const i of this.enrichrRunNameList) {
              terms = terms.concat(Object.keys(this.enrichrData[i]))
            }
            this.enrichrTermList = [...new Set(terms)]
          }
        }
      }
      this.form.controls["profilePlot"].setValue(this.settings.settings.selectedComparison.includes(this.primaryID))
    })

    this.dataService.batchAnnotateAnnoucement.asObservable().subscribe((value: any) => {
      this.form.controls["profilePlot"].setValue(this.settings.settings.selectedComparison.includes(this.primaryID))
      if (value.id === this.primaryID || value.id.includes(this.primaryID)) {
        this.form.controls["annotate"].setValue(!value.remove)
      }
    })
  }

  ngOnInit(): void {
  }

  openAlphaFold() {
    const ref = this.modal.open(PdbViewerComponent, {size:"xl"})
    ref.componentInstance.data = this.primaryID
  }

  goToTop() {
    this.scroll.scrollToID("volcanoNcyto")
  }

  profileCompare() {
    if (this.form.value.profilePlot) {
      if (!this.settings.settings.selectedComparison.includes(this.primaryID)) {
        this.settings.settings.selectedComparison.push(this.primaryID)
      }
    } else {
      if (this.settings.settings.selectedComparison.includes(this.primaryID)) {
        const ind = this.settings.settings.selectedComparison.indexOf(this.primaryID)
        console.log(ind)
        if (this.settings.settings.selectedComparison.length === 1) {
          this.settings.settings.selectedComparison = []
        } else {
          this.settings.settings.selectedComparison.splice(ind, 1)
        }
      }
    }
  }

  annotate() {
    this.dataService.annotationService.next({
      id: this.primaryID,
      remove: !this.form.value.annotate
    })
  }

  formChange() {

  }

  ngOnDestroy(): void {
    this.annotateSubscription.unsubscribe()
    this.profilePlotSubscription.unsubscribe()
  }

  handleDragProtein(event: any) {
    const data =  JSON.stringify({title: this.title, selection:this._data[this.dataService.rawForm.primaryIDs], type: "selection-single"})
    console.log(data)
    event.dataTransfer?.setData("text/plain",data)
  }
}
