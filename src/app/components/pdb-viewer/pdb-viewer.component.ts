import {AfterContentInit, Component, Input, OnInit} from '@angular/core';
import {EbiService} from "../../ebi.service";
import {UniprotService} from "../../uniprot.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap"
import {getEBIAlpha} from "curtain-web-api"


declare const PDBeMolstarPlugin: any;
@Component({
  selector: 'app-pdb-viewer',
  templateUrl: './pdb-viewer.component.html',
  styleUrls: ['./pdb-viewer.component.scss']
})
export class PdbViewerComponent implements OnInit, AfterContentInit {

  get data(): any {
    return this._data;
  }

  private _data: any = {}
  uni: any = {}
  @Input() set data(value: any) {
    this._data = value;
    const uni = this.uniprot.getUniprotFromPrimary(value)
    if (this.uni !== uni) {
      this.geneName = uni["Gene Names"]
      this.uni = uni
    }


  }
  link = ""
  cifLink = ""
  modelCreatedDate = ""
  entryID = ""
  version = 0
  alignmentError = ""
  geneName: string = ""
  constructor(private ebi: EbiService, private uniprot: UniprotService, public activeModal: NgbActiveModal) { }

  ngOnInit(): void {

  }

  ngAfterContentInit() {
    const match = this.uniprot.Re.exec(this._data.split(";")[0])
    if (match) {
      setTimeout(()=> {

        getEBIAlpha(match[1]).then((data: any) => {
          this.link = data.data[0]["pdbUrl"]
          this.modelCreatedDate = data.data[0]["modelCreatedDate"]
          this.version = data.data[0]["latestVersion"]
          this.entryID = data.data[0]["entryId"]
          this.alignmentError = data.data[0]["paeImageUrl"]
          this.cifLink = data.data[0]["cifUrl"]
          const molstar = new PDBeMolstarPlugin()
          const options = {
            customData: {
              url: this.cifLink,
              format: "cif",
              binary: false
            },
            alphafoldView: true,
            bgColor: {r:255, g:255, b:255}
          }

          //Get element from HTML/Template to place the viewer
          const viewerContainer = document.getElementById('molstar');

          //Call render method to display the 3D view
          molstar.render(viewerContainer, options);
        }), 4000
      })
    }

  }

}
