import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {PlotlyService} from "angular-plotly.js";
import {WebService} from "../../web.service";
import {StatsService} from "../../stats.service";
import {SettingsService} from "../../settings.service";
import {Subject} from "rxjs";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
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

  @Input() set data(value: any) {
    this._data = value
    this.title = "<b>" + this._data[this.dataService.rawForm.primaryIDs] + "</b>"

    this.uni = this.uniprot.getUniprotFromPrimary(this._data[this.dataService.rawForm.primaryIDs])

    if (this.uni) {
      if (this.uni["Gene Names"] !== "") {
        this.title = "<b>" + this.uni["Gene Names"] + "(" + this._data[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
      }
    }
    this.drawBarChart()
    this.graphLayout["title"] = this.title
    this.graphLayoutAverage["title"] = this.title
    this.graphLayoutViolin["title"] = this.title
    this.drawAverageBarChart()

  }

  title = ""
  graph: any = {}
  graphData: any[] = []
  graphLayout: any = {
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
    annotations: [],
    shapes: [],
    margin: {r: 50, l: 50, b: 100, t: 100}
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
    margin: {r: 40, l: 40, b: 120, t: 100}
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
    margin: {r: 40, l: 40, b: 120, t: 100}
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

  constructor(private stats: StatsService, private web: WebService, public dataService: DataService, private uniprot: UniprotService, private settings: SettingsService) {
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

    this.graphData = []
    const annotations: any[] = []
    const shapes: any[] = []
    let sampleNumber: number = 0
    console.log(this.settings.settings.barchartColorMap)

    for (const s in this.dataService.sampleMap) {

      if (this.settings.settings.sampleVisible[s]) {
        sampleNumber ++
        const condition = this.dataService.sampleMap[s].condition
        let color = this.dataService.colorMap[condition]
        if (this.settings.settings.barchartColorMap[condition]) {
          color = this.settings.settings.barchartColorMap[condition]
        }
        if (!graph[condition]) {
          graph[condition] = {
            x: [],
            y: [],
            marker: {
              "color": color
            },
            line: {
              color: "black"
            },
            type: "bar",
            name: condition,
            showlegend: false
          }
        }
        graph[condition].x.push(s)
        graph[condition].y.push(this._data[s])
      }
    }
    let currentSampleNumber: number = 0
    for (const g in graph) {
      const annotationsPosition = currentSampleNumber +  graph[g].x.length/2
      currentSampleNumber = currentSampleNumber + graph[g].x.length
      this.graphData.push(graph[g])
      tickvals.push(graph[g].x[Math.round(graph[g].x.length/2)-1])
      ticktext.push(g)
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

    this.graphLayout.xaxis.tickvals = tickvals
    this.graphLayout.xaxis.ticktext = ticktext
  }

  drawAverageBarChart() {
    const tickVals: string[] = []
    const tickText: string[] = []
    const graphData: any[] = []
    const graphViolin: any[] = []
    const graph: any = {}
    let sampleNumber: number = 0
    for (const s in this.dataService.sampleMap) {
      if (this.settings.settings.sampleVisible[s]) {
        sampleNumber ++
        const condition = this.dataService.sampleMap[s].condition
        if (!graph[condition]) {
          graph[condition] = []
        }
        graph[condition].push(this._data[s])
      }
    }
    for (const g in graph) {
      let color = this.dataService.colorMap[g]
      if (this.settings.settings.barchartColorMap[g]) {
        color = this.settings.settings.barchartColorMap[g]
      }
      const box = {
        x: g, y: graph[g],
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
        name: g,
        //visible: visible,
        showlegend: false
      }
      const violinX: any[] = graph[g].map(() => g)

      const violin = {
        type: 'violin',
        x: violinX, y: graph[g], points: "all",
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
        spanmode: 'soft'
      }
      graphViolin.push(violin)
      const s = new Series(graph[g])
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
      graphData.push({
        x: [g], y: [mean],
        type: 'bar',
        mode: 'markers',
        error_y: {
          type: 'data',
          array: [error],
          visible: true
        },
        marker: {
          "color": color
        },
        line: {
          color: "black"
        },
        //visible: temp[t].visible,
        showlegend: false
      })
      graphData.push(box)
      tickVals.push(g)
      tickText.push(g)
    }
    this.graphDataAverage = graphData
    this.graphLayoutAverage.xaxis.tickvals = tickVals
    this.graphLayoutAverage.xaxis.ticktext = tickText
    this.graphLayoutViolin.xaxis.tickvals = tickVals
    this.graphLayoutViolin.xaxis.ticktext = tickText
    this.graphDataViolin = graphViolin
  }

  performTest() {
    //const a = this.graph[this.conditionA]
    //const b = this.graph[this.conditionB]

    const conditions = this.selectedConditions.map(a => this.graph[a].y)
    console.log(conditions)
    switch (this.testType) {
      case "ANOVA":
        this.comparisons = [{conditions: this.selectedConditions.slice(), comparison: this.stats.calculateAnova2(conditions)}]
        break
      case "TTest":
        //console.log(this.stats.calculateTTest(a.y, b.y))
        //this.comparisons = [{a: this.conditionA, b: this.conditionB, comparison: this.stats.calculateTTest(a.y, b.y)}]
        break
    }
  }
}
