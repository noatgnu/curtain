import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {PlotlyService} from "angular-plotly.js";
import {DrawPack} from "../../classes/draw-pack";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import * as d3 from "d3";

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css']
})
export class ScatterPlotComponent implements OnInit {
  graphData: any[] = []
  xaxisLog: boolean = true
  changeXaxis(e: Event) {
    e.stopPropagation()
    e.preventDefault()
    for (let i = 0; i < this.graphData.length; i ++) {
      for (let i2 = 0; i2 < this.graphData[i].x.length; i2 ++) {
        if (!this.xaxisLog) {
          if (this.graphData[i].x[i2] > 0) {
            this.graphData[i].x[i2] = 2**this.graphData[i].x[i2]
          } else {
            this.graphData[i].x[i2] = -(2**this.graphData[i].x[i2])
          }

        } else {
          if (this.graphData[i].x[i2] > 0) {
            this.graphData[i].x[i2] = Math.log2(this.graphData[i].x[i2])
          } else {
            this.graphData[i].x[i2] = -(2**this.graphData[i].x[i2])
          }
          this.graphData[i].x[i2] = Math.log2(this.graphData[i].x[i2])
        }

      }
      this.graphData[i].x = [...this.graphData[i].x]
      console.log(this.graphData[i].x)
    }
    this.graphData = [...this.graphData]
  }
  customTitle: string = ""
  annotationTextSize = 1
  updateTitle(e: Event) {
    if (this.customTitle !== "") {
      this.graphLayout.title = this.customTitle
    }
    this.dataService.titleGraph.next(this.graphLayout.title)
    e.stopPropagation()
    e.preventDefault()
  }
  graphLayout: any = {
    title:"Volcano Plot",
    height: 1000, xaxis: {title: "Log2FC"}, yaxis: {title: "-log10(p-value)"}, annotations: [],
    showlegend: true, legend: {
      orientation: 'h'
    },
    shapes: []
  }
  pCutOff: number = 0.00001
  log2FCCutoff: number = 2
  _data: IDataFrame = new DataFrame();
  upSelected: any[] = []
  downSelected: any[] = []
  originalFCType: "normal"|"log2"|"log10" = "log2"
  foldChangeType: "normal"|"log2"|"log10" = "log2"
  @Input() set data(value:DrawPack) {
    this.graphLayout.annotations = []
    this._data = value.df
    this.pCutOff = value.pCutOff
    this.log2FCCutoff = value.logFCCutoff
    this.graphScatterPlot()
  }

  uniprotMap = new Map<string, any>()

  batchSelection: any = {}
  constructor(private plotly: PlotlyService, private uniprot: UniprotService, private dataService: DataService) {
    this.uniprotMap = uniprot.results
    this.dataService.annotationSelect.subscribe(data => {
      this.graphLayout.annotations = data

    })
    this.dataService.clearService.asObservable().subscribe(data => {
      if (data) {
        this.graphLayout.annotations = []
        this.batchSelection = {}
        this.graphScatterPlot()
      }
    })
    this.dataService.batchSelectionService.asObservable().subscribe(data => {
      if (data) {
        this.batchSelection = data
        this.graphScatterPlot()
      }
    })

  }



  async downloadPlotlyExtra(format: string) {
    const graph = this.plotly.getInstanceByDivId("scatterplot");
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, width: 1000, height: 1000, filename: "image"})

  }

  ngOnInit(): void {
  }

  conditions = ["p >" + this.pCutOff, "p <=" + this.pCutOff, "log2FC >" + this.log2FCCutoff, "log2FC <=" + this.log2FCCutoff]

  selectConditions(pvalue: number, log2FC: number) {
    let conditions = ""
    if (pvalue > this.pCutOff) {
      conditions = conditions + "p >" + this.pCutOff.toString()
    } else {
      conditions = conditions + "p <=" + this.pCutOff.toString()
    }
    if (Math.abs(log2FC) > this.log2FCCutoff) {
      conditions = conditions + ", log2FC >" + this.log2FCCutoff.toString()
    } else {
      conditions = conditions + ", log2FC <=" + this.log2FCCutoff.toString()
    }
    return conditions
  }

  graphScatterPlot(group: any = {}) {

    const temp: any = {}
    this.graphData = []
    const minMax = {
      xMin: 0,
      yMin: 0,
      xMax: 0,
      yMax: 0}
    let notStartedx = true
    let notStartedy = true
    if (Object.keys(group).length === 0) {
      console.log(this.batchSelection)
      for (const r of this._data) {
        if (r["pvalue"]) {
          if (notStartedy) {
            minMax.yMin = r["pvalue"]
            minMax.yMax = r["pvalue"]
            notStartedy = false

          } else {
            if (r["pvalue"] < minMax.yMin) {
              minMax.yMin = r["pvalue"]
            } else {
              if (r["pvalue"] > minMax.yMax) {
                minMax.yMax = r["pvalue"]
              }
            }
          }
        }

        if (r["logFC"]) {
          if (notStartedx) {
            minMax.xMin = r["logFC"]
            minMax.xMax = r["logFC"]
            notStartedx = false
          } else {
            if (r["logFC"] < minMax.xMin) {
              minMax.xMin = r["logFC"]
            } else {
              if (r["logFC"] > minMax.xMax) {
                minMax.xMax = r["logFC"]
              }
            }
          }
        }
        let selected: boolean = false
        if (this.batchSelection.data) {
          if (this.batchSelection.data.includes(r[this.batchSelection.type])) {
            if (!(this.batchSelection.title in temp)) {
              temp[this.batchSelection.title] = {x: [], y: [], text:[], type: 'scatter', name: this.batchSelection.title, mode: 'markers'}
            }

            console.log(minMax)
            temp[this.batchSelection.title].y.push(-Math.log10(r["pvalue"]))
            temp[this.batchSelection.title].x.push(r["logFC"])
            if (this.uniprotMap.has(r["Proteins"])) {
              temp[this.batchSelection.title].text.push(this.uniprotMap.get(r["Proteins"])["Gene names"] + "(" + r["Proteins"] + ")" )
            } else {
              temp[this.batchSelection.title].text.push(r["Proteins"])
            }
            selected = true
          }
        }
        if (!selected) {
          const conditions = this.selectConditions(r["pvalue"], r["logFC"])

          if (!(conditions in temp)) {
            temp[conditions] = {x: [], y: [], text:[], type: 'scatter', name: conditions, mode: 'markers'}
          }
          temp[conditions].y.push(-Math.log10(r["pvalue"]))
          temp[conditions].x.push(r["logFC"])
          if (this.uniprotMap.has(r["Proteins"])) {
            temp[conditions].text.push(this.uniprotMap.get(r["Proteins"])["Gene names"] + "(" + r["Proteins"] + ")" )
          } else {
            temp[conditions].text.push(r["Proteins"])
          }
        }
      }
    }
    this.graphLayout.xaxis.range = [minMax.xMin - 0.5, minMax.xMax + 0.5]
    this.graphLayout.yaxis.range = [0, -Math.log10(minMax.yMin - minMax.yMin/2)]
    this.graphLayout.shapes = [
      {
        type: "line",
        x0: this.graphLayout.xaxis.range[0],
        x1: this.graphLayout.xaxis.range[1],
        y0: -Math.log10(this.pCutOff),
        y1: -Math.log10(this.pCutOff),
        line:{
          color: 'rgb(21,4,4)',
          width: 2,
          dash:'dot'
        }
      },
      {
        type: "line",
        x0: -this.log2FCCutoff,
        x1: -this.log2FCCutoff,
        y0: this.graphLayout.yaxis.range[0],
        y1: this.graphLayout.yaxis.range[1],
        line:{
          color: 'rgb(21,4,4)',
          width: 2,
          dash:'dot'
        }
      },
      {
        type: "line",
        x0: this.log2FCCutoff,
        x1: this.log2FCCutoff,
        y0: this.graphLayout.yaxis.range[0],
        y1: this.graphLayout.yaxis.range[1],
        line:{
          color: 'rgb(21,4,4)',
          width: 2,
          dash:'dot'
        }
      },
    ]

    for (const t in temp) {
      this.graphData.push(temp[t])
    }
  }

  selectData(e: any) {
    if ("points" in e) {
      const ind = e["points"][0].text.indexOf("(")
      if (e["points"][0].text.indexOf("(") !== -1) {
        this.dataService.updateDataPointClick([e["points"][0].text.slice(ind+1, -1)])
      } else {
        this.dataService.updateDataPointClick([e["points"][0].text])
      }
    }
  }

  plotUpdated(e: any) {
  }
}
