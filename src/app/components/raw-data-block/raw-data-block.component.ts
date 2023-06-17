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
  @Input() set data(value: any) {
    this._data = value

    this.primaryID = this._data[this.dataService.rawForm.primaryIDs]

    const form = this.fb.group({
      annotate: [false],
      profilePlot: [this.dataService.selectedComparison.includes(this.primaryID)],
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
        this.foundIn = Object.keys(this.dataService.selectedMap[this._data[this.dataService.rawForm.primaryIDs]])
      }
    })

    this.dataService.batchAnnotateAnnoucement.asObservable().subscribe((value: any) => {
      this.form.controls["profilePlot"].setValue(this.dataService.selectedComparison.includes(this.primaryID))
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
      if (!this.dataService.selectedComparison.includes(this.primaryID)) {
        this.dataService.selectedComparison.push(this.primaryID)
      }
    } else {
      if (this.dataService.selectedComparison.includes(this.primaryID)) {
        const ind = this.dataService.selectedComparison.indexOf(this.primaryID)
        console.log(ind)
        if (this.dataService.selectedComparison.length === 1) {
          this.dataService.selectedComparison = []
        } else {
          this.dataService.selectedComparison.splice(ind, 1)
        }
      }
    }

    console.log(this.dataService.selectedComparison)
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
}
