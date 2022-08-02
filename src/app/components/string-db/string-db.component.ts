import {Component, Input, OnInit} from '@angular/core';
import {UniprotService} from "../../uniprot.service";
import {WebService} from "../../web.service";
import {DataService} from "../../data.service";
import {Settings} from "../../classes/settings";
import {SettingsService} from "../../settings.service";
declare const getSTRING: any;
@Component({
  selector: 'app-string-db',
  templateUrl: './string-db.component.html',
  styleUrls: ['./string-db.component.scss']
})
export class StringDbComponent implements OnInit {
  get uniProtData(): any {
    return this._uniProtData;
  }

  _uniProtData: any = {}
  networkType = "physical"
  organism = ""
  ids: string[] = []
  selected = ""
  selectedGenes: string[] = []
  requiredScore: number = 0
  networkFlavor: string = "evidence"
  _data: any = {}

  @Input() set uniProtData(value: string) {
    const uni = this.uniprot.getUniprotFromPrimary(value)
    if (uni) {
      this._uniProtData = uni
      this.selected = uni["Gene Names"].split(";")[0]
      this._data = {organism: this.uniprot.organism, identifiers: this._uniProtData['STRING'].split(';'), selectedGenes: []}
      const ids: string[] = []
      for (const i of this._data.identifiers) {
        if (i !== "") {
          ids.push(i)
        }
      }
      this.organism = this._data.organism
      this.ids = ids
      this.selectedGenes = this._data.selectedGenes
      this.getString()
    }

  }
  constructor(private uniprot: UniprotService, private data: DataService, private settings: SettingsService) { }

  ngOnInit(): void {
    const currentData = this
    window.parent.addEventListener("message", function (data) {
      if (data.origin.startsWith("http://localhost:4200")||data.origin.startsWith("http://curtain.proteo.info")) {

      }
    })
  }

  getString() {
    if (this.requiredScore > 1000) {
      this.requiredScore = 1000
    }
    const increased: string[] = []
    const decreased: string[] = []
    const allGenes: string[] = []
    for (const r of this.data.differential.df) {
      const uni: any = this.uniprot.getUniprotFromPrimary(r[this.data.differentialForm.primaryIDs])
      if (uni) {
        if (r[this.data.differentialForm.foldChange] >= this.settings.settings.log2FCCutoff) {
          for (const u of uni["Gene Names"].split(";")) {
            if (u !== "") {
              increased.push(u)
            }
          }
        } else if (r[this.data.differentialForm.foldChange] <= -this.settings.settings.log2FCCutoff) {
          for (const u of uni["Gene Names"].split(";")) {
            if (u !== "") {
              decreased.push(u)
            }
          }
        }
        for (const u of uni["Gene Names"].split(";")) {
          if (u !== "") {
            allGenes.push(u)
          }
        }
      }
    }

    setTimeout(()=> {
      getSTRING('https://string-db.org',
        {'species': this.organism,
          'identifiers': this.ids,
          'network_flavor': this.networkFlavor,
          'caller_identity': 'dundee.ac.uk',
          'network_type': this.networkType,
          'required_score': this.requiredScore},
        this.uniProtData["Gene Names"].split(";"),
        increased,
        decreased,
        allGenes
      )
      console.log("String request submitted")
    }, 3000)
  }
}
