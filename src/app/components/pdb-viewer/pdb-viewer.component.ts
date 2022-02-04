import {AfterContentInit, Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {EbiService} from "../../service/ebi.service";
// @ts-ignore
import * as ngl from "ngl";
import {UniprotService} from "../../service/uniprot.service";

declare const PDBeMolstarPlugin: any;
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
    const uni = this.uniprot.getUniprotFromPrimary(value)
    if (uni !== uni) {
      this.geneName = uni["Gene names"]
    }
    this.getEbi()
  }
  link = ""
  cifLink = ""
  modelCreatedDate = ""
  entryID = ""
  version = 0
  alignmentError = ""
  geneName: string = ""
  constructor(public activeModal: NgbActiveModal, private ebi: EbiService, private uniprot: UniprotService) { }

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

      const molstar = new PDBeMolstarPlugin()
      var options = {
        customData: {url: this.cifLink, format: "cif", binary: false},
        alphafoldView: true,
        bgColor: {r:255, g:255, b:255}
      }

      //Get element from HTML/Template to place the viewer
      const viewerContainer = document.getElementById('molstar');

      //Call render method to display the 3D view
      molstar.render(viewerContainer, options);


    })
  }

  getEbi() {

  }

}
