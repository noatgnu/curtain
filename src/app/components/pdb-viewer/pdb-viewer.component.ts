import {Component, Input, OnInit} from '@angular/core';
import {EbiService} from "../../ebi.service";
import {UniprotService} from "../../uniprot.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";


declare const PDBeMolstarPlugin: any;
@Component({
  selector: 'app-pdb-viewer',
  templateUrl: './pdb-viewer.component.html',
  styleUrls: ['./pdb-viewer.component.scss']
})
export class PdbViewerComponent implements OnInit {

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
    setTimeout(()=> {
      this.ebi.getEBIAlpha(this._data.split(";")[0]).subscribe(data => {
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
