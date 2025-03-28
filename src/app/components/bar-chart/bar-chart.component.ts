import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {PlotlyService} from "angular-plotly.js";
import {WebService} from "../../web.service";
import {StatsService} from "../../stats.service";
import {SettingsService} from "../../settings.service";
import {ObjectUnsubscribedError, Subject} from "rxjs";

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    standalone: false
})
export class BarChartComponent implements OnInit {
  _data: any = {}
  uni: any = {}
  comparisons: any[] = []
  conditionA: string = ""
  conditionB: string = ""
  conditions: string[] = []
  testType: string = "ANOVA"
  selectedConditions: string[] = []
  barChartErrorType: string = "Standard Error"
  violinPointPos: number = -2
  isCollapse: boolean = true
  @Input() set data(value: any) {
    this._data = value
    this.title = "<b>" + this._data[this.dataService.rawForm.primaryIDs] + "</b>"
    if (this.dataService.fetchUniprot) {
      this.uni = this.uniprot.getUniprotFromPrimary(this._data[this.dataService.rawForm.primaryIDs])

      if (this.uni) {
        if (this.uni["Gene Names"] !== "") {
          this.title = "<b>" + this.uni["Gene Names"] + "(" + this._data[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
        }
      }
    } else {
      if (this.dataService.differentialForm.geneNames !== "") {
        const result = this.dataService.currentDF.where(row => (row[this.dataService.differentialForm.primaryIDs] === this._data[this.dataService.rawForm.primaryIDs])).toArray()
        if (result.length > 0) {
          const diffData = result[0]
          this.title = "<b>" + diffData[this.dataService.differentialForm.geneNames] + "(" + this._data[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
        }
      } else {
        this.title = "<b>" + this._data[this.dataService.rawForm.primaryIDs] + "</b>"
      }
    }

    this.drawBarChart()
    this.graphLayout["title"] = this.title
    this.graphLayoutAverage["title"] = this.title
    this.graphLayoutViolin["title"] = this.title
    this.drawAverageBarChart()

  }

  averageBarchartEnableDot = true

  title = ""
  graph: any = {}
  graphData: any[] = []
  graphLayout: any = {
    width: 1200,
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: [],
      fixedrange: true
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      fixedrange: true
    },
    annotations: [],
    shapes: [],
    margin: {r: 50, l: 100, b: 100, t: 100},
    font: {
      family: this.settings.settings.plotFontFamily + ", monospace",
    }
  }

  graphDataAverage: any[] = []
  graphLayoutAverage: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    margin: {r: 40, l: 100, b: 120, t: 100},
    font: {
      family: this.settings.settings.plotFontFamily + ", monospace",
    }
  }

  graphDataViolin: any[] = []
  graphLayoutViolin: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    margin: {r: 40, l: 100, b: 120, t: 100},
    font: {
      family: this.settings.settings.plotFontFamily + ", monospace",
    }
  }
  config: any = {
    //modeBarButtonsToRemove: ["toImage"]
    toImageButtonOptions: {
      format: 'svg',
      filename: this.title+'_bar',
      height: this.graphLayout.height,
      width: this.graphLayout.width,
      scale: 1
    }
  }
  configAverage: any = {
    //modeBarButtonsToRemove: ["toImage"]
    toImageButtonOptions: {
      format: 'svg',
      filename: this.title + '_average',
      height: this.graphLayoutAverage.height,
      width: this.graphLayoutAverage.width,
      scale: 1
    }
  }
  configViolin: any = {
    //modeBarButtonsToRemove: ["toImage"]
    toImageButtonOptions: {
      format: 'svg',
      filename: this.title + '_violin',
      height: this.graphLayoutViolin.height,
      width: this.graphLayoutViolin.width,
      scale: 1
    }
  }

  hasImputation: boolean = false
  imputationCount: any = {}
  imputationMap: any = {}
  enableImputation: boolean = false

  constructor(private stats: StatsService, private web: WebService, public dataService: DataService, private uniprot: UniprotService, private settings: SettingsService) {
    if (this.settings.settings.enableImputation) {
      this.enableImputation = true
    } else {
      this.enableImputation = false
    }
    this.dataService.externalBarChartDownloadTrigger.asObservable().subscribe(trigger => {
      if (trigger) {
        for (const i of ["bar", "average", "violin"]) {
          let e = document.getElementById(this._data[this.dataService.rawForm.primaryIDs]+i)
          if (e) {
            this.web.downloadPlotlyImage('svg', this._data[this.dataService.rawForm.primaryIDs]+this.uni["Gene Names"]+i+'.svg', this._data[this.dataService.rawForm.primaryIDs]+i).then()
          } else {
            let observer = new MutationObserver(mutations => {
              mutations.forEach((mutation) => {
                let nodes = Array.from(mutation.addedNodes)
                for (const node of nodes) {
                  if (node.contains(document.getElementById(this._data[this.dataService.rawForm.primaryIDs]+i))) {
                    e = document.getElementById(this._data[this.dataService.rawForm.primaryIDs]+i)
                    if (e) {
                      this.web.downloadPlotlyImage('svg', this._data[this.dataService.rawForm.primaryIDs]+this.uni["Gene Names"]+i+'.svg', this._data[this.dataService.rawForm.primaryIDs]+i).then()
                    }
                    observer.disconnect()
                    break
                  }
                }
              })
            })
            observer.observe(document.documentElement, {
              childList: true,
              subtree: true
            })
          }
        }
      }
    })
    this.dataService.finishedProcessingData.subscribe(data => {
      if (data) {

      }
    })
    this.dataService.redrawTrigger.subscribe(data => {
      if (data) {
        if (this.settings.settings.enableImputation) {
          this.enableImputation = true
        } else {
          this.enableImputation = false
        }
        this.drawBarChart()
        this.drawAverageBarChart()
      }
    })
  }

  download(type: string) {
    if (type === "all") {
      this.web.downloadPlotlyImage('svg', 'bar.svg', this._data[this.dataService.rawForm.primaryIDs]+"bar").then()
      this.web.downloadPlotlyImage('svg', 'average.svg', this._data[this.dataService.rawForm.primaryIDs]+"average").then()
      this.web.downloadPlotlyImage('svg', 'violin.svg', this._data[this.dataService.rawForm.primaryIDs]+"violin").then()
    } else {
      this.web.downloadPlotlyImage('svg', type+'.svg', this._data[this.dataService.rawForm.primaryIDs]+type).then()
    }

  }

  ngOnInit(): void {
  }
  drawBarChart() {
    const tickvals: string[] = []
    const ticktext: string[] = []
    const graph: any = {}
    this.imputationMap = {}
    this.imputationCount = {}
    this.graphData = []
    const annotations: any[] = []
    const shapes: any[] = []
    let sampleNumber: number = 0
    let heatmap: any = {
      x: [],
      y: [],
      z: [],
      text: [],
      type: "heatmap",
      colorscale: [
        [0, "#EE6677"],
        [0.5, "#BBBBBB"],
        [1,"#4477AA"]
      ],
      showscale: true,
      hoverinfo: "z",
      yaxis: "y2",
      xaxis: "x",
      colorbar: {
        thickness: 10,
        len: 0.5,
        y: 0.5,
        x: 1.1
      },
      font: {
        color: "white",
        family: 'Arial',
      }
    }
    console.log(this.settings.settings.peptideCountData)
    if (this.settings.settings.viewPeptideCount) {
      this.graphLayout.yaxis.domain = [0.3, 0.9]
      this.graphLayout.yaxis2 = {
        domain: [0, 0.1]
      }
    } else {
      if (this.graphLayout.yaxis2) {
        delete this.graphLayout.yaxis2
      }
      if (this.graphLayout.yaxis.domain) {
        this.graphLayout.yaxis.domain = [0, 1]
      }
    }
    for (const s in this.settings.settings.sampleMap) {

      if (this.settings.settings.sampleVisible[s]) {

        const condition = this.settings.settings.sampleMap[s].condition
        let color = this.settings.settings.colorMap[condition]
        if (this.settings.settings.barchartColorMap[condition]) {
          color = this.settings.settings.barchartColorMap[condition]
        }
        if (!graph[condition]) {
          graph[condition] = {
            x: [],
            y: [],
            marker: {
              pattern: {
                shape: []
              },
              "color": color,
            },
            line: {
              color: "black"
            },
            type: "bar",
            hovertext: [],
            name: condition,
            showlegend: false,
          }
        }
        let canImpute = false
        if (this.settings.settings.imputationMap[this._data[this.dataService.rawForm.primaryIDs]]) {
          if (this.settings.settings.imputationMap[this._data[this.dataService.rawForm.primaryIDs]][s]) {
            if (!this.imputationCount[condition]) {
              this.imputationCount[condition] = 0
              this.imputationMap[condition] = []
            }
            this.imputationCount[condition] = this.imputationCount[condition] + 1
            this.imputationMap[condition].push(s)
            canImpute = true
          }
        }
        if (this.enableImputation && canImpute) {
          continue
        }
        sampleNumber ++

        graph[condition].x.push(s)
        graph[condition].y.push(this._data[s])
        if (canImpute) {
          graph[condition].marker.pattern.shape.push("/")

        } else {
          graph[condition].marker.pattern.shape.push("")
        }
        if (this.settings.settings.peptideCountData && this.settings.settings.viewPeptideCount) {
          if (this.settings.settings.peptideCountData[this._data[this.dataService.rawForm.primaryIDs]]) {
            if (this.settings.settings.peptideCountData[this._data[this.dataService.rawForm.primaryIDs]][s]) {
              const peptideCountData = this.settings.settings.peptideCountData[this._data[this.dataService.rawForm.primaryIDs]][s].toString()
              graph[condition].hovertext.push(
                `Sample:${s}<br>Value:${this._data[s]}<br>${peptideCountData} peptides`
              )
              heatmap.x.push(s)
              heatmap.y.push("Peptide Count")
              heatmap.z.push(peptideCountData)
              heatmap.text.push(peptideCountData)
              this.graphLayout.annotations.push(
                {
                  xref: "x",
                  yref: "y2",
                  x: s,
                  y: "Peptide Count",
                  text: peptideCountData,
                  showarrow: false,
                  font: {
                    size: 12,
                    color: "white"
                  }
                }
              )
            }
          }
        }
      }
    }

    let currentSampleNumber: number = 0

    for (const g of this.settings.settings.conditionOrder) {
      if (!graph[g]) {
        continue
      }
      //const annotationsPosition = currentSampleNumber +  graph[g].x.length/2
      let sampleCount = graph[g].x.length
      //if (this.imputationCount[g] >0) {
      //  sampleCount = sampleCount - this.imputationCount[g]
      //}
      currentSampleNumber = currentSampleNumber + sampleCount
      this.graphData.push(graph[g])
      tickvals.push(graph[g].x[Math.round(sampleCount/2)-1])
      if (this.imputationCount[g] > 0) {
        ticktext.push(`${g} (${this.imputationCount[g]} imputed)`)
      } else {
        ticktext.push(g)
      }
      if (sampleNumber !== currentSampleNumber) {
        shapes.push({
          type: "line",
          xref: "paper",
          yref: "paper",
          x0: currentSampleNumber/sampleNumber,
          x1: currentSampleNumber/sampleNumber,
          y0: 0,
          y1: 1,
          line: {
            dash: "dash",
          }
        })
      }
    }
    if (this.settings.settings.viewPeptideCount) {
      this.graphData.push(heatmap)
    } else {
      this.graphLayout.annotations = this.graphLayout.annotations.filter((a:any) => {
        return a.y !== "Peptide Count"
      })
    }



    //const combos = this.dataService.pairwise(this.dataService.conditions)
    //const comparisons = []
    // for (const c of combos) {
    //   const a = graph[c[0]]
    //   const b = graph[c[1]]
    //   comparisons.push({
    //     a: c[0], b: c[1], comparison: this.anova.calculateAnova(a.y, b.y)
    //   })
    // }
    this.graph = graph
    // this.comparisons = comparisons
    this.graphLayout.shapes = shapes
    if (this.settings.settings.columnSize.barChart !== 0) {
      this.graphLayout.width = this.graphLayout.margin.l + this.graphLayout.margin.r + this.settings.settings.columnSize.barChart * sampleNumber
    }
    this.graphLayout.xaxis.tickvals = tickvals
    this.graphLayout.xaxis.ticktext = ticktext
    for (const c in this.imputationCount) {
      if (this.imputationCount[c] > 0) {
        this.hasImputation = true
      }
    }
  }

  changeImputation() {
    this.drawBarChart()
    this.drawAverageBarChart()
  }

  drawAverageBarChart() {
    const tickVals: string[] = []
    const tickText: string[] = []
    const graphData: any[] = []
    const graphViolin: any[] = []
    const graph: any = {}
    let sampleNumber: number = 0
    let boxDotInnerColor: any = {}
    let selectedPoints: any = {}

    for (const s in this.settings.settings.sampleMap) {
      if (this.settings.settings.sampleVisible[s]) {

        const condition = this.settings.settings.sampleMap[s].condition
        if (!graph[condition]) {
          graph[condition] = []
          boxDotInnerColor[condition] = []
          selectedPoints[condition] = []
        }

        if (this.imputationMap[condition]) {
          if (this.imputationMap[condition].includes(s)) {
            if (this.enableImputation) {
              continue
            }
            boxDotInnerColor[condition].push("rgba(0,0,0,0)")

          } else {
            boxDotInnerColor[condition].push("#654949")
          }
        } else {
          boxDotInnerColor[condition].push("#654949")
        }
        graph[condition].push(this._data[s])
        if (this.imputationMap[condition]) {
          if (this.imputationMap[condition].includes(s)) {
            selectedPoints[condition].push(graph[condition].length-1)
          }
        }
        sampleNumber ++
      }

    }

    for (const g of this.settings.settings.conditionOrder) {
      if (!graph[g]) {
        continue
      }
      let color = this.settings.settings.colorMap[g]
      if (this.settings.settings.barchartColorMap[g]) {
        color = this.settings.settings.barchartColorMap[g]
      }




      const box: any = {
        x: g, y: graph[g].filter((d: number) => !isNaN(d)),
        type: 'box',
        boxpoints: 'all',
        pointpos: 0,
        jitter: 0.3,
        fillcolor: 'rgba(255,255,255,0)',
        line: {
          color: 'rgba(255,255,255,0)',
        },
        hoveron: 'points',
        marker: {
          color: "#654949",
          opacity: 0.8,
        },
        selectedpoints: selectedPoints[g],
        selected: {
          marker: {
            color: '#e61010'
          }
        },
        name: g,
        //visible: visible,
        showlegend: false
      }
      console.log(box)
      const violinX: any[] = graph[g].map(() => g)

      const violin = {
        type: 'violin',
        x: violinX,
        //y: graph[g].filter((d: number) => !isNaN(d)),
        y: graph[g],
        points: "all",
        pointpos: this.settings.settings.violinPointPos,
        box: {
          visible: true
        },
        meanline: {
          visible: true
        },
        line: {
          color: "black"
        },
        fillcolor: color
        ,
        name: g,
        showlegend: false,
        spanmode: 'soft',
        selectedpoints: selectedPoints[g],
        selected: {
          marker: {
            color: '#e61010'
          }
        }
      }
      graphViolin.push(violin)
      const s = new Series(graph[g].filter((d: number) => !isNaN(d)))
      const std =  s.std()
      const standardError = std/Math.sqrt(s.count())
      let total = 0
      let countNotNull = 0
      for (const i of s) {
        if (i) {
          total = total + i
          countNotNull = countNotNull + 1
        }
      }
      const mean = total/countNotNull
      let error = std
      switch (this.barChartErrorType) {
        case "Standard Error":
          error = standardError
          break
        default:
          break
      }
      const data: any = {
        x: [g], y: [mean],
        type: 'bar',
        mode: 'markers',
        error_y: {
          type: 'data',
          array: [error],
          visible: true
        },
        marker: {
          "color": color,
        },
        line: {
          color: "black"
        },
        //visible: temp[t].visible,
        showlegend: false
      }

      if (!this.averageBarchartEnableDot) {
        box.boxpoints = "false"
      }
      graphData.push(data)
      graphData.push(box)
      tickVals.push(g)
      tickText.push(g)
    }
    this.graphDataAverage = graphData
    if (this.settings.settings.columnSize.averageBarChart !== 0) {
      this.graphLayoutAverage.width = this.graphLayoutAverage.margin.l + this.graphLayoutAverage.margin.r + this.settings.settings.columnSize.averageBarChart * tickVals.length
    }
    this.graphLayoutAverage.xaxis.tickvals = tickVals
    this.graphLayoutAverage.xaxis.ticktext = tickText
    if (this.settings.settings.columnSize.violinPlot !== 0) {
      this.graphLayoutViolin.width = this.graphLayoutViolin.margin.l + this.graphLayoutViolin.margin.r + this.settings.settings.columnSize.violinPlot * tickVals.length
    }
    this.graphLayoutViolin.xaxis.tickvals = tickVals
    this.graphLayoutViolin.xaxis.ticktext = tickText
    this.graphDataViolin = graphViolin
  }

  performTest() {
    //const a = this.graph[this.conditionA]
    //const b = this.graph[this.conditionB]

    const conditions = this.selectedConditions.map(a => this.graph[a].y)
    switch (this.testType) {
      case "ANOVA":
        this.comparisons = [{conditions: this.selectedConditions.slice(), comparison: this.stats.calculateAnova2(conditions)}]
        break
      case "TTest":
        this.stats.calculateTTest(this.graph[this.conditionA].y, this.graph[this.conditionB].y).then((result: any) => {
          this.selectedConditions = [this.conditionA, this.conditionB]
          this.comparisons = [{conditions: this.selectedConditions.slice(), comparison: result.data}]
        })
        //console.log(this.stats.calculateTTest(a.y, b.y))
        //this.comparisons = [{a: this.conditionA, b: this.conditionB, comparison: this.stats.calculateTTest(a.y, b.y)}]
        break
    }
  }

  downloadData() {
    console.log(this._data)
    let data: string = ""
    data = Object.keys(this._data).join("\t") + "\n"
    data = data+ Object.values(this._data).join("\t") + "\n"

    this.web.downloadFile(this.title + ".txt", data)
  }
}
