import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {PlotlyService} from "angular-plotly.js";
import {DrawPack} from "../../classes/draw-pack";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import * as d3 from "d3";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css']
})
export class ScatterPlotComponent implements OnInit {
  get fdrCurveText(): string {
    return this._fdrCurveText;
  }

  set fdrCurveText(value: string) {
    this.dataService.settings.fdrCurveText = value
    this._fdrCurveText = value;
  }
  drawFDRCurve: boolean = false
  graphData: any[] = []
  fdrDF: IDataFrame = new DataFrame()
  xaxisLog: boolean = true
  changeXaxis(e: Event) {
    e.stopPropagation()
    e.preventDefault()
    this.graphScatterPlot()
    console.log(this.graphData)
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
  pCutOff: number = this.dataService.settings.pCutOff
  log2FCCutoff: number = this.dataService.settings.logFCCutOff
  _data: IDataFrame = new DataFrame();
  upSelected: any[] = []
  downSelected: any[] = []
  originalFCType: "normal"|"log2"|"log10" = "log2"
  foldChangeType: "normal"|"log2"|"log10" = "log2"
  afterPlotTrigger: boolean = false;
  @Input() set data(value:DrawPack) {
    this.graphLayout.annotations = []
    this._data = value.df
    this.pCutOff = this.dataService.settings.pCutOff
    this.log2FCCutoff = this.dataService.settings.logFCCutOff
    this.graphScatterPlot()
  }
  batchSelections: any[] = []
  uniprotMap = new Map<string, any>()

  batchSelection: any = {}

  constructor(private plotly: PlotlyService, private uniprot: UniprotService, private dataService: DataService, private modal: NgbModal) {
    if (this.dataService.settings.fdrCurveText !== undefined) {
      this.fdrCurveText = this.dataService.settings.fdrCurveText
      if (this.fdrCurveText !== "") {
        this.drawFDRCurve = true
        this.fdrDF = fromCSV(<string>this.fdrCurveText)
      }
    }

    this.uniprotMap = uniprot.results
    this.dataService.downloadCurrentSelectedDataComparison.asObservable().subscribe(data => {
      if (data) {
        let data = this._data.where(row => this.dataService.allSelected.includes(row["Primary IDs"])).bake()
        data = this.addGeneNameToDF(data);
        ScatterPlotComponent.buildDataBlob(data);
      }
    })
    this.dataService.annotationSelect.subscribe(data => {
      this.graphLayout.annotations = data
      this.dataService.settings.annotatedIDs = data

    })
    this.dataService.clearService.asObservable().subscribe(data => {
      if (data) {
        this.graphLayout.annotations = []
        this.batchSelection = {}
        this.batchSelections = []
        this.graphScatterPlot()
      }
    })
    this.dataService.clearSpecificService.asObservable().subscribe(data => {
      if (data) {
        this.graphLayout.annotations = []
        const bs: any[] = []
        for (let i = 0; i < this.batchSelections.length; i ++) {
          if (this.dataService.settings.selectionTitles.indexOf(this.batchSelections[i].title) !== -1) {
            bs.push(this.batchSelections[i])
          }
        }
        this.batchSelections = bs
        this.graphScatterPlot()
      }
    })
    this.dataService.batchSelectionService.asObservable().subscribe(data => {
      if (data) {
        this.batchSelections.push(data)
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

  significantHits: string[] = []

  selectConditions(pvalue: number, log2FC: number, primaryID: string) {
    let conditions = ""
    if (pvalue > this.pCutOff) {
      conditions = conditions + "p >" + this.pCutOff.toString()
    } else {
      conditions = conditions + "p <=" + this.pCutOff.toString()
    }
    if (Math.abs(log2FC) > this.log2FCCutoff) {
      if (conditions.indexOf(">") !== -1) {
        this.significantHits.push(primaryID)
      }
      conditions = conditions + ", log2FC >" + this.log2FCCutoff.toString()

    } else {
      conditions = conditions + ", log2FC <=" + this.log2FCCutoff.toString()
    }
    return conditions
  }

  graphScatterPlot(group: any = {}) {
    this.significantHits = []
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
      for (const r of this._data) {
        const row = {...r}
        if (row["pvalue"]) {
          if (notStartedy) {
            minMax.yMin = row["pvalue"]
            minMax.yMax = row["pvalue"]
            notStartedy = false

          } else {
            if (row["pvalue"] < minMax.yMin) {
              minMax.yMin = row["pvalue"]
            } else {
              if (row["pvalue"] > minMax.yMax) {
                minMax.yMax = row["pvalue"]
              }
            }
          }
        }

        if (row["logFC"]) {
          if (!this.xaxisLog) {
            if (row["logFC"] < 0) {
              row["logFC"] = -(2**(-row["logFC"]))
            } else {
              row["logFC"] = 2**(row["logFC"])
            }
          }
          if (notStartedx) {
            minMax.xMin = row["logFC"]
            minMax.xMax = row["logFC"]
            notStartedx = false
          } else {
            if (r["logFC"] < minMax.xMin) {
              minMax.xMin = row["logFC"]
            } else {
              if (r["logFC"] > minMax.xMax) {
                minMax.xMax = row["logFC"]
              }
            }
          }
        }
        let selected: boolean = false
        for (const s of this.batchSelections) {
          if (s.data) {
            if (s.data.includes(r[s.type])) {

              if (!(s.title in temp)) {
                temp[s.title] = {x: [], y: [], text:[], type: 'scatter', name: s.title, mode: 'markers'}
              }

              temp[s.title].y.push(-Math.log10(row["pvalue"]))
              temp[s.title].x.push(row["logFC"])
              if (this.uniprotMap.has(row["Primary IDs"])) {
                temp[s.title].text.push(this.uniprotMap.get(row["Primary IDs"])["Gene names"] + "(" + row["Primary IDs"] + ")" )
              } else {
                temp[s.title].text.push(row["Primary IDs"])
              }
              selected = true
            }
          }
        }

        if (!selected) {
          const conditions = this.selectConditions(row["pvalue"], row["logFC"], row["Primary IDs"])

          if (!(conditions in temp)) {
            temp[conditions] = {x: [], y: [], text:[], type: 'scatter', name: conditions, mode: 'markers'}
          }
          temp[conditions].y.push(-Math.log10(row["pvalue"]))
          temp[conditions].x.push(row["logFC"])
          if (this.uniprotMap.has(row["Primary IDs"])) {
            temp[conditions].text.push(this.uniprotMap.get(row["Primary IDs"])["Gene names"] + "(" + row["Primary IDs"] + ")" )
          } else {
            temp[conditions].text.push(row["Primary IDs"])
          }
        }
      }
    }
    this.graphLayout.shapes = []

    if (this.drawFDRCurve) {
      if (this.graphLayout.xaxis.range === undefined) {
        this.graphLayout.xaxis.range = [minMax.xMin - 0.5, minMax.xMax + 0.5]
        this.graphLayout.xaxis.autoscale = true
        this.graphLayout.yaxis.range = [0, -Math.log10(minMax.yMin - minMax.yMin/2)]
        this.graphLayout.yaxis.autoscale = true
      }
      const left: IDataFrame = this.fdrDF.where(row => row.x < 0).bake()
      const right: IDataFrame = this.fdrDF.where(row => row.x >= 0).bake()
      const fdrLeft: any = {
        x: [],
        y: [],
        hoverinfo: 'skip',
        showlegend: false,
        mode: 'lines',
        line:{
          color: 'rgb(103,102,102)',
          width: 0.5,
          dash:'dot'
        }
      }
      const fdrRight: any = {
        x: [],
        y: [],
        hoverinfo: 'skip',
        showlegend: false,
        mode: 'lines',
        line:{
          color: 'rgb(103,102,102)',
          width: 0.5,
          dash:'dot'
        }
      }
      for (const l of left) {
        if (l.x < this.graphLayout.xaxis.range[0]) {
          this.graphLayout.xaxis.range[0] = l.x
        }
        if (l.y > this.graphLayout.yaxis.range[1]) {
          this.graphLayout.yaxis.range[1] = l.y
        }
        fdrLeft.x.push(l.x)
        fdrLeft.y.push(l.y)
      }
      for (const l of right) {
        if (l.x < this.graphLayout.xaxis.range[0]) {
          this.graphLayout.xaxis.range[0] = l.x
        }
        if (l.y > this.graphLayout.yaxis.range[1]) {
          this.graphLayout.yaxis.range[1] = l.y
        }
        fdrRight.x.push(l.x)
        fdrRight.y.push(l.y)
      }
      this.graphData.push(fdrLeft)
      this.graphData.push(fdrRight)
      this.graphLayout.xaxis.autorange = true
      this.graphLayout.yaxis.autorange = true
    } else {
      this.graphLayout.xaxis.range = [minMax.xMin - 0.5, minMax.xMax + 0.5]
      this.graphLayout.yaxis.range = [0, -Math.log10(minMax.yMin - minMax.yMin/2)]
      this.graphLayout.shapes.push({
        type: "line",
        x0: this.graphLayout.xaxis.range[0] - 0.5,
        x1: this.graphLayout.xaxis.range[1] + 0.5,
        y0: -Math.log10(this.pCutOff),
        y1: -Math.log10(this.pCutOff),
        line:{
          color: 'rgb(21,4,4)',
          width: 1,
          dash:'dot'
        }
      })
      this.graphLayout.shapes.push(
        {
          type: "line",
          x0: -this.log2FCCutoff,
          x1: -this.log2FCCutoff,
          y0: 0,
          y1: this.graphLayout.yaxis.range[1],
          line:{
            color: 'rgb(21,4,4)',
            width: 1,
            dash:'dot'
          }
        }
      )
      this.graphLayout.shapes.push(
        {
          type: "line",
          x0: this.log2FCCutoff,
          x1: this.log2FCCutoff,
          y0: 0,
          y1: this.graphLayout.yaxis.range[1],
          line:{
            color: 'rgb(21,4,4)',
            width: 1,
            dash:'dot'
          }
        }
      )
    }



    for (const t in temp) {
      this.graphData.push(temp[t])
    }
    if (!this.xaxisLog) {
      this.graphLayout.xaxis.title = "FC"
    } else {
      this.graphLayout.xaxis.title = "log2FC"
    }
    this.boundary.x0 = this.graphLayout.xaxis.range[0]
    this.boundary.x1 = this.graphLayout.xaxis.range[1]
    this.boundary.y0 = this.graphLayout.yaxis.range[0]
    this.boundary.y1 = this.graphLayout.yaxis.range[1]
  }

  selectData(e: any) {
    if ("points" in e) {
      const ind = e["points"][0].text.indexOf("(")
      if (e["points"][0].text.indexOf("(") !== -1) {
        if (e["points"][0].text.startsWith("UID")) {
          this.dataService.updateDataPointClick([e["points"][0].text])
        } else {
          this.dataService.updateDataPointClick([e["points"][0].text.slice(ind+1, -1)])
        }
      } else {
        this.dataService.updateDataPointClick([e["points"][0].text])
      }
    }
  }

  plotUpdated(e: any) {
  }
  private _fdrCurveText: string = ""

  customCurve(content: any) {
    this.modal.open(content, {ariaLabelledBy: "custom-fdr-curve"}).result.then((result) => {

    })
  }

  removeCurve() {
    this.drawFDRCurve = false
    this.fdrCurveText = ""
    this.fdrDF = new DataFrame()
    this.graphScatterPlot()
  }

  updatePlotWithFDRCurve(content: any) {
    this.fdrDF = fromCSV(this._fdrCurveText)
    this.drawFDRCurve = true
    this.graphScatterPlot()
    content.dismiss()
  }
  boundary = {
    x0: 0,
    y0: 0,
    x1: 1,
    y1: 1
  }


  changeLayout(e: any) {

    if (e) {

      this.boundary.x0 = e["xaxis.range[0]"]
      this.boundary.x1 = e["xaxis.range[1]"]
      this.boundary.y0 = e["yaxis.range[0]"]
      this.boundary.y1 = e["yaxis.range[1]"]
    }

  }

  downloadSignificantData() {
    let data = this._data.where(row => this.significantHits.includes(row["Primary IDs"])).bake()
    data = this.addGeneNameToDF(data);
    ScatterPlotComponent.buildDataBlob(data);
    data = this.dataService.settings.dataColumns.raw.where(row => this.significantHits.includes(row["Primary IDs"])).bake()
    data = this.addGeneNameToDF(data);
    ScatterPlotComponent.buildDataBlob(data, "raw.csv");
  }


  private addGeneNameToDF(data: IDataFrame<number, any>) {
    data = data.resetIndex().bake()
    if (this.dataService.settings.uniprot) {
      let geneNames: string[] = []
      for (const r of data) {
        if (this.uniprot.results.has(r["Primary IDs"])) {
          geneNames.push(this.uniprot.results.get(r["Primary IDs"])["Gene names"])
        } else {
          geneNames.push("")
        }
      }
      const a = new Series(geneNames)
      data = data.withSeries("Gene names", a).bake()
    }
    return data;
  }

  private static buildDataBlob(data: IDataFrame<number, any>, filename: string = "data.csv") {
    const blob = new Blob([data.toCSV()], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob);

    if (typeof (navigator.msSaveOrOpenBlob) === "function") {
      navigator.msSaveBlob(blob, "data.csv")
    } else {
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url)
  }

  downloadCurrentData() {
    const maxY = 10**(-this.boundary.y0)
    const minY = 10**(-this.boundary.y1)
    const minX = this.boundary.x0
    const maxX = this.boundary.x1

    let data = this._data
      .where(row => row["pvalue"] >= minY).where(row => row["pvalue"] <= maxY).where(row => row["logFC"] >= minX).where(row => row["logFC"] <= maxX).bake()
    data = this.addGeneNameToDF(data);
    ScatterPlotComponent.buildDataBlob(data);
    const downloadIDs = data.getSeries("Primary IDs").bake().toArray()
    data = this.dataService.settings.dataColumns.raw.where(row => downloadIDs.includes(row["Primary IDs"])).bake()
    data = this.addGeneNameToDF(data);
    ScatterPlotComponent.buildDataBlob(data, "raw.csv");
  }

  selectCurrentData() {
    const maxY = 10**(-this.boundary.y0)
    const minY = 10**(-this.boundary.y1)
    const minX = this.boundary.x0
    const maxX = this.boundary.x1

    let data = this._data
      .where(row => row["pvalue"] >= minY).where(row => row["pvalue"] <= maxY).where(row => row["logFC"] >= minX).where(row => row["logFC"] <= maxX).bake()
    console.log(data)
    const d = data.getSeries("Primary IDs").bake().toArray()
    this.dataService.searchService.next({term:d, type:"Primary IDs"})
  }

  finishPlot(e: any) {
    this.afterPlotTrigger = true
  }
}
