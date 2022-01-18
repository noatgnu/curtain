import {AfterContentInit, Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {EbiService} from "../../service/ebi.service";
// @ts-ignore
import * as ngl from "ngl";
@Component({
  selector: 'app-pdb-viewer',
  templateUrl: './pdb-viewer.component.html',
  styleUrls: ['./pdb-viewer.component.css']
})
export class PdbViewerComponent implements OnInit, AfterContentInit {
  get data(): any {
    return this._data;
  }

  private _data: any = {}

  @Input() set data(value: any) {
    this._data = value;
    this.getEbi()
  }

  constructor(public activeModal: NgbActiveModal, private ebi: EbiService) { }

  ngOnInit(): void {

  }

  ngAfterContentInit() {
    this.ebi.getEBIAlpha(this.data).subscribe(data => {
      const stage = new ngl.Stage("pdbViewer");
      // @ts-ignore
      stage.loadFile(data.body[0]["pdbUrl"], {defaultRepresentation: true})
    })
  }

  getEbi() {

  }

}
