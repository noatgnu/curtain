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
  link = ""
  cifLink = ""
  modelCreatedDate = ""
  entryID = ""
  version = 0
  alignmentError = ""
  constructor(public activeModal: NgbActiveModal, private ebi: EbiService) { }

  ngOnInit(): void {

  }

  ngAfterContentInit() {
    this.ebi.getEBIAlpha(this.data).subscribe(data => {
      console.log(data.body)
      // @ts-ignore
      this.link = data.body[0]["pdbUrl"]
      // @ts-ignore
      this.modelCreatedDate = data.body[0]["modelCreatedDate"]
      // @ts-ignore
      this.version = data.body[0]["latestVersion"]
      // @ts-ignore
      this.entryID = data.body[0]["entryId"]
      // @ts-ignore
      this.alignmentError = data.body[0]["paeImageUrl"]
      // @ts-ignore
      this.cifLink = data.body[0]["cifUrl"]

      const stage = new ngl.Stage("pdbViewer");

      stage.setParameters({backgroundColor: "white", hoverTimeout: -1})

      stage.loadFile(this.link, {defaultRepresentation: true})

    })
  }

  getEbi() {

  }

}
