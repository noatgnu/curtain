import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
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

  @Input() set data(value: any) {
    this._data = value;
    if ("organism" in value) {
      const ids: string[] = []
      for (const i of value.identifiers) {
        if (i !== "") {
          ids.push(i)
        }
      }
      this.getString(value.organism, ids)
      console.log(value)
    }
  }
  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {

  }
  getString(species: string, identifiers: string[]) {
    getSTRING('https://string-db.org',{'species':species, 'identifiers':identifiers, 'network_flavor':'confidence', 'caller_identity': 'dundee.ac.uk', 'network_type': 'physical', 'required_score': 0})
  }

  clickEvent(e:any) {
    console.log(e)
  }
}
