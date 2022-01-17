import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../service/data.service";
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
      this.getString("physical")
    }
  }
  constructor(public activeModal: NgbActiveModal, private dataService: DataService) { }

  ngOnInit(): void {
    const currentData = this
    window.parent.addEventListener("message", function (data) {
      if (data.origin.startsWith("http://localhost:4200")||data.origin.startsWith("http://curtain.proteo.info")) {
        console.log(currentData.dataService.geneToPrimaryMap.get(data.data.toUpperCase()))
      }

    })
  }

  getString(networkType: string) {
    this.networkType = networkType
    getSTRING('https://string-db.org',
      {'species': this.organism,
        'identifiers': this.ids,
        'network_flavor':'confidence',
        'caller_identity': 'dundee.ac.uk',
        'network_type': networkType,
        'required_score': 0},
      this.selectedGenes,
      this.dataService.increase,
      this.dataService.decrease
    )
  }

  clickEvent(e:any) {
    console.log(e)
  }
}
