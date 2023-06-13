import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {PdbViewerComponent} from "../pdb-viewer/pdb-viewer.component";
import {ScrollService} from "../../scroll.service";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-raw-data-block',
  templateUrl: './raw-data-block.component.html',
  styleUrls: ['./raw-data-block.component.scss']
})
export class RawDataBlockComponent implements OnInit {
  _data: any = {}
  title = ""
  uni: any = null
  primaryID = ""
  foundIn: string[] = []
  active = 2
  annotateTrigger: boolean = false
  @Input() set data(value: any) {
    this._data = value

    this.primaryID = this._data[this.dataService.rawForm.primaryIDs]
    for (const i in this.settings.settings.textAnnotation) {
      if (this.settings.settings.textAnnotation[i].primary_id === this.primaryID) {
        this.annotateTrigger = true
        break
      }
    }
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
  constructor(private scroll: ScrollService, public dataService: DataService, private uniprot: UniprotService, private modal: NgbModal, private settings: SettingsService) {
    this.dataService.finishedProcessingData.asObservable().subscribe((value) => {
      if (value) {
        this.foundIn = Object.keys(this.dataService.selectedMap[this._data[this.dataService.rawForm.primaryIDs]])
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
    if (this.profileComparisonToggle) {
      if (!this.dataService.selectedComparison.includes(this.primaryID)) {
        this.dataService.selectedComparison.push(this.primaryID)
      }
    } else {
      const ind = this.dataService.selectedComparison.indexOf(this.primaryID)
      if (ind > -1) {
        this.dataService.selectedComparison = this.dataService.selectedComparison.splice(ind, 1)
      }
    }
  }

  annotate() {
    this.dataService.annotationService.next({
      id: this.primaryID,
      remove: !this.annotateTrigger
    })
  }
}
