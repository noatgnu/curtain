import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../service/data.service";
import {ProteomicsDbService} from "../../service/proteomics-db.service";
declare const getSTRING: any;
@Component({
  selector: 'app-stringdb-interact',
  templateUrl: './stringdb-interact.component.html',
  styleUrls: ['./stringdb-interact.component.css']
})
export class StringdbInteractComponent implements OnInit {
  get data(): any {
    return this._data;
  }

  private _data: any = {}
  networkType = "physical"
  organism = ""
  ids: string[] = []
  selectedGenes: string[] = []
  requiredScore: number = 0
  networkFlavor: string = "evidence"
  @Input() set data(value: any) {
    this._data = value;
    if ("organism" in value) {
      const ids: string[] = []
      for (const i of value.identifiers) {
        if (i !== "") {
          ids.push(i)
        }
      }
      this.organism = value.organism
      this.ids = ids
      this.selectedGenes = value.selectedGenes
      this.getString()
    }
  }
  constructor(public activeModal: NgbActiveModal, private dataService: DataService, private proteomicsDB: ProteomicsDbService) { }

  ngOnInit(): void {
    const currentData = this
    window.parent.addEventListener("message", function (data) {
      if (data.origin.startsWith("http://localhost:4200")||data.origin.startsWith("http://curtain.proteo.info")) {

      }

    })
  }

  getString() {
    getSTRING('https://string-db.org',
      {'species': this.organism,
        'identifiers': this.ids,
        'network_flavor': this.networkFlavor,
        'caller_identity': 'dundee.ac.uk',
        'network_type': this.networkType,
        'required_score': this.requiredScore},
      this.selectedGenes,
      this.dataService.increase,
      this.dataService.decrease
    )
    console.log("String request submitted")
  }

  clickEvent(e:any) {
    console.log(e)
  }
}
