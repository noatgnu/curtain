import {Component, Input, OnInit} from '@angular/core';
import {WebService} from "../../web.service";
import {UniprotService} from "../../uniprot.service";
import {UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import {getProteomicsData} from "curtain-web-api";
import {SettingsService} from "../../settings.service";

@Component({
    selector: 'app-proteomics-db',
    templateUrl: './proteomics-db.component.html',
    styleUrls: ['./proteomics-db.component.scss'],
    standalone: false
})
export class ProteomicsDbComponent implements OnInit {
  _uniprotID = ""
  @Input() set uniprotID(value: string) {
    this._uniprotID = value
    if (this.settings.settings.proteomicsDBColor === undefined) {
      this.settings.settings.proteomicsDBColor = "#1f77b4"
    } else {
      this.form.controls["color"].setValue(this.settings.settings.proteomicsDBColor)
      this.color = this.settings.settings.proteomicsDBColor.slice()
    }
    if (this._uniprotID !== "") {
      getProteomicsData(this._uniprotID, this.form.value["selected"]).then((r:any) => {
        if (r.data) {
          this.drawBarChart(r.data)
        }
      })
    }
  }


  graphData: any[] = []
  graphLayout: any = {}
  config: any = {
    //modeBarButtonsToRemove: ["toImage"]
    toImageButtonOptions: {
      format: 'svg',
      filename: 'proteomicsdb',
      height: this.graphLayout.height,
      width: this.graphLayout.width,
      scale: 1
    }
  }

  form: UntypedFormGroup = this.fb.group({
    color: "rgb(128,51,169)",
    selected: "tissue"
  })

  color = "rgb(128,51,169)"

  constructor(public web: WebService, private uniprot: UniprotService, private fb: UntypedFormBuilder, private settings: SettingsService) {

    this.form.valueChanges.subscribe(value => {
      getProteomicsData(this._uniprotID, value.selected).then((r: any) => {
        if (r.data) {
          this.drawBarChart(r.data)
        }
      })
    })
  }

  ngOnInit(): void {
  }

  drawBarChart(data: any) {
    if (this.form.dirty) {
      this.settings.settings.proteomicsDBColor = this.form.value["color"]
    }
    let graphData: any[] = []
    const graphLayout = {
      title: {
        text: "",
        font: {
          size: 24,
        }
      },
      margin: {l:300, r:50, t:50, b:50},
      height: 400,
      xaxis: {
        "title": "<b>Normalized Intensity</b>"
      },
      yaxis: {
        "title" : "<b>Sample Categories</b>",
        "type" : "category",
        "tickmode": "array",
        "tickvals": [],
        "tickfont": {
          "size": 17,
          "color": 'black'
        }
      },
      font: {
        family: this.settings.settings.plotFontFamily + ", serif",
      }
    }
    graphLayout.yaxis.tickvals = []
    if (data) {
      // @ts-ignore
      if (data["d"]) {
        // @ts-ignore
        if (data["d"]["results"]) {
          const x: any = []
          const y: any = []

          const results: any[] = []
          // @ts-ignore
          for (const r of data["d"]["results"] ) {
            results.push({value: parseFloat(r["NORMALIZED_INTENSITY"]), name: r["TISSUE_NAME"]})
          }
          results.sort((a, b) => (a.value > b.value) ? 1: -1)
          for (const r of results) {
            x.push(r.value)
            y.push(r.name)
          }
          const temp: any = {
            type: "bar",
            x: x,
            y: y,
            marker: {
              color: this.form.value["color"]
            },
            orientation: "h"
          }
          graphData = [temp]
          graphLayout.yaxis.tickvals = temp.y
          graphLayout.height = 400 + 25*temp.y.length
          this.graphData = graphData
          this.graphLayout = graphLayout
          this.config = {
            //modeBarButtonsToRemove: ["toImage"]
            toImageButtonOptions: {
              format: 'svg',
              filename: "proteomicsdb",
              height: this.graphLayout.height,
              width: this.graphLayout.width,
              scale: 1
            }
          }
        }
      }
    }
  }
  downloadSVG() {
    this.web.downloadPlotlyImage("svg", "proteomicsDB", this._uniprotID+"bar").then()
  }

  updateColor(color: string) {
    this.form.controls["color"].setValue(color)
    this.form.markAsDirty()
  }
}
