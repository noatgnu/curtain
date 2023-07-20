import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {UniprotService} from "../../uniprot.service";
import {WebService} from "../../web.service";
import {DataService} from "../../data.service";
import {Settings} from "../../classes/settings";
import {SettingsService} from "../../settings.service";
import {IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";
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
  @ViewChild("stringElement") stringElement: ElementRef|undefined
  _uniProtData: any = {}
  networkType = "physical"
  organism = ""
  ids: string[] = []
  selected = ""
  selectedGenes: string[] = []
  requiredScore: number = 0
  networkFlavor: string = "evidence"
  _data: any = {}
  selection: string = ""
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
      if (this.settings.settings.stringDBColorMap === undefined) {
        this.settings.settings.stringDBColorMap = {}
        for (const i in this.colorMap) {
          this.settings.settings.stringDBColorMap[i] = this.colorMap[i].slice()
          this.form.controls[i].setValue(this.colorMap[i])
        }

      } else {
        for (const i in this.settings.settings.stringDBColorMap) {
          this.colorMap[i] = this.settings.settings.stringDBColorMap[i].slice()
          this.form.controls[i].setValue(this.colorMap[i])
        }
      }
      this.getString().then()
    }

  }

  form: FormGroup = this.fb.group({
    "Increase": ["#8d0606",],
    "Decrease": ["#4f78a4",],
    "In dataset": ["#ce8080",],
    "Not in dataset": ["#676666",]
  })

  colorMap: any = {
    "Increase": "#8d0606",
    "Decrease": "#4f78a4",
    "In dataset": "#ce8080",
    "Not in dataset": "#676666"
  }
  constructor(private fb: FormBuilder, private uniprot: UniprotService, private data: DataService, private settings: SettingsService) {
    this.data.stringDBColorMapSubject.asObservable().subscribe((data) => {
      if (data) {
        for (const i in this.settings.settings.stringDBColorMap) {
          this.colorMap[i] = this.settings.settings.stringDBColorMap[i].slice()
          this.form.controls[i].setValue(this.colorMap[i])
        }
        this.form.markAsPristine()
      }
    })

  }

  ngOnInit(): void {
    const currentData = this
    window.parent.addEventListener("message", function (data) {
      if (data.origin.startsWith("http://localhost:4200")||data.origin.startsWith("http://curtain.proteo.info")) {

      }
    })
  }

  async getString() {
    if (this.form.dirty) {
      for (const i in this.form.value) {
        this.settings.settings.stringDBColorMap[i] = this.form.value[i]
      }
      this.data.stringDBColorMapSubject.next(true)
    }
    if (this.requiredScore > 1000) {
      this.requiredScore = 1000
    }
    const increased: string[] = []
    const decreased: string[] = []
    const allGenes: string[] = []

    if (this.selection !== "") {
      const df = this.data.currentDF.where(r => r[this.data.differentialForm.comparison] === this.selection).bake()
      await this.updateIncreaseDecrease(increased, decreased, allGenes, df);
    } else {
      await this.updateIncreaseDecrease(increased, decreased, allGenes, this.data.currentDF);
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
        allGenes,
        this.form.value
      )
      console.log("String request submitted")
    }, 3000)
  }

  private async updateIncreaseDecrease(increased: string[], decreased: string[], allGenes: string[], df: IDataFrame) {
    for (const r of df) {
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
  }

  handleSelection(e: string) {
    this.selection = e
    this.getString().then()
  }

  downloadSVG() {
    if (this.stringElement) {
      console.log(this.stringElement.nativeElement.innerHTML)
      const svg = this.stringElement.nativeElement.getElementsByTagName("svg")
      const blob = new Blob([svg[0].outerHTML], {type:"image/svg+xml;charset=utf-8"});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a")
      a.href = url
      a.download = "stringdb.svg"
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url)
    }
  }

  updateColor(color: string, key: string) {
    this.form.controls[key].setValue(color)
    this.form.markAsDirty()
  }

}
