import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import {PlotlyService} from "angular-plotly.js";
import {Event} from "@angular/router";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  graphData: any[] = []
  graphLayout: any = {title: {
    text: "",
      font: {
      family: "Arial Black",
      size: 24,
      }
    }, height: 500,
    xaxis: {
      "title" : "<b>Samples</b>",
      "tickmode": "array",
      //"categoryorder" : "array",
      //"categoryarray": [],
      "tickvals": [],
      "ticktext": [],
      "tickfont": {
        "size": 17
      },
      "font": {
        size: 20,
      }
    },
    yaxis: {
      "title" : "<b>Intensity</b>"
    }
    //xaxis:{"tickangle": 90}
  }
  _data: IDataFrame = new DataFrame()
  uniprotMap = new Map<string, any>()
  @Input() set data(value: IDataFrame) {
    this.drawBarChart(value);
    this._data = value
  }
  relabelSample: any = {}
  reverseLinkLabel: any = {}
  id: string = ""
  private drawBarChart(value: IDataFrame<number, any>) {
    this.graphData = []
    //this.graphLayout.xaxis.categoryarray = []
    this.graphLayout.xaxis.ticktext = []
    this.graphLayout.xaxis.tickvals = []
    const temp: any = {}

    for (const r of value) {
      let primaryIDs = r["Primary IDs"]
      this.id = r["Primary IDs"]
      let proteinName = ""
      if (this.uniprotMap.has(primaryIDs)) {
        primaryIDs = this.uniprotMap.get(primaryIDs)["Gene names"] + "(" + primaryIDs + ")"
        proteinName = "<br>" + this.uniprot.results.get(r["Primary IDs"])["Protein names"]
        this.title = primaryIDs + proteinName
      }
      this.graphLayout.title.text = "<b>" + primaryIDs + proteinName + "</b>"
      for (const c of value.getColumnNames()) {
        if (this.dataService.sampleColumns.includes(c)) {
          let visible: any = true
          const name = this.getHighlighted(c)
          if (name[0] !== ""){
            if (this.legendHideList.includes(name[0])) {
              visible = "legendonly"
            }
            if (!(name[0] in temp)) {
              temp[name[0]] = {
                x: [], y: [],
                type: 'bar',
                mode: 'markers',
                name: name[0],
                visible: visible,
                showlegend: false
              }
            }
            temp[name[0]].x.push(c)

            //this.graphLayout.xaxis.categoryarray.push(c)
            temp[name[0]].y.push(r[c])
          }
        }
      }
    }
    for (const t in temp) {
      this.graphData.push(temp[t])
      this.graphLayout.xaxis.tickvals.push(temp[t].x[Math.round(temp[t].x.length/2)-1])
      if (!(t in this.relabelSample)) {
        this.graphLayout.xaxis.ticktext.push(t)
        this.dataService.updateBarChartKeyChannel(t)
      } else {
        if (this.relabelSample[t] !== ""){
          this.graphLayout.xaxis.ticktext.push(this.relabelSample[t])
          this.reverseLinkLabel[this.relabelSample[t]] = t
        } else {
          this.graphLayout.xaxis.ticktext.push(t)
          this.dataService.updateBarChartKeyChannel(t)
        }

      }
    }
  }
  title: string = ""
  constructor(private plotly: PlotlyService, private uniprot: UniprotService, private dataService: DataService) {
    if (!this.dataService.settings.conditionParsePattern) {
      this.dataService.settings.conditionParsePattern = /^(.+)\.(\d+)$/
    }
    this.uniprotMap = this.uniprot.results
    this.dataService.titleGraph.asObservable().subscribe(data => {
      this.graphLayout.title.text = "<b>" + data + "<br>" + this.title + "</b>"
    })
    this.dataService.barChartSampleLabels.asObservable().subscribe(data => {
      if (data) {
        this.relabelSample = this.dataService.relabelSamples
        this.drawBarChart(this._data)
        /*for (let i = 0; i < this.graphLayout.xaxis.ticktext.length; i++) {
          if ((this.graphLayout.xaxis.ticktext[i] in this.reverseLinkLabel)) {
            if (this.reverseLinkLabel[this.graphLayout.xaxis.ticktext[i]] in this.relabelSample) {
              if (this.relabelSample[this.reverseLinkLabel[this.graphLayout.xaxis.ticktext[i]]]!== "") {
                this.graphLayout.xaxis.ticktext[i] = this.relabelSample[this.reverseLinkLabel[this.graphLayout.xaxis.ticktext[i]]]
              }
            }
          } else {
            if (this.relabelSample[this.graphLayout.xaxis.ticktext[i]] !== "") {
              const temp = this.graphLayout.xaxis.ticktext[i]
              this.reverseLinkLabel[this.relabelSample[this.graphLayout.xaxis.ticktext[i]]] = temp
              this.graphLayout.xaxis.ticktext[i] = this.relabelSample[this.graphLayout.xaxis.ticktext[i]]
            }
          }
        }

        this.graphLayout.xaxis.ticktext = [...this.graphLayout.xaxis.ticktext]
        this.graphLayout.xaxis = Object.create(this.graphLayout.xaxis)
        this.graphLayout = Object.create(this.graphLayout)
        console.log(this.graphLayout.xaxis.ticktext)*/
      }
    })

  }

  ngOnInit(): void {

  }

  async downloadPlotlyExtra(format: string) {
    const graph = this.plotly.getInstanceByDivId(this.title.replace(';', ''));
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, filename: "image"})

  }

  highlighted: string[] = []
  hideHighlighted: boolean = false
  highlightBar(e: any) {
    if (this.highlighted.includes(e.points[0].x)) {
      const ind = this.highlighted.indexOf(e.points[0].x)
      this.highlighted.splice(ind, 1)
    } else {
      this.highlighted.push(e.points[0].x)
    }
    this.drawBarChart(this._data)
  }

  getHighlighted(name: string) {
    if (this.highlighted.includes(name)) {
      if (this.hideHighlighted) {
        return ""
      } else {
        return "Highlighted"
      }

    } else {
      // const pattern = new RegExp(this.dataService.settings.conditionParsePattern)
      // const match = name.match(pattern)
      // if (match) {
      //   return [match[0], match[1]]
      // } else {
      //   return ["", ""]
      // }

      const group = name.split(".")
      if (group.length >= 3) {
        return [group.slice(0, group.length-1).join("_"), group[group.length-1]]
      } else {
        return [group[0], group[1]]
      }

    }
  }

  legendHideList: string[] = []

  clickLegend(e: any) {
    const ind = e.curveNumber
    if (this.legendHideList.includes(e.data[ind].name)) {
      const indL = this.legendHideList.indexOf(e.data[ind].name)
      this.legendHideList.splice(indL, 1)
    } else {
      this.legendHideList.push(e.data[ind].name)
    }
    //this.drawBarChart(this._data)
  }

  hideHighlightedHandler() {
    this.drawBarChart(this._data)
  }
}
