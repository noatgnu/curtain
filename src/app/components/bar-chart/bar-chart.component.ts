import {Component, DestroyRef, effect, inject, input, OnInit, signal} from '@angular/core';
import {DataService} from "../../data.service";
import {Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {WebService} from "../../web.service";
import {StatsService} from "../../stats.service";
import {SettingsService} from "../../settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    standalone: false
})
export class BarChartComponent implements OnInit {
  private destroyRef = inject(DestroyRef)

  data = input<any>()

  _data = signal<any>({})
  currentPrimaryID = signal<string>("")
  title = signal<string>("")

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
  isYAxisCollapsed: boolean = true

  volcanoConditionLeft: string = ""
  volcanoConditionRight: string = ""
  foldChangeValue: number | null = null
  pValue: number | null = null

  averageBarchartEnableDot = true
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

  constructor(private stats: StatsService, private web: WebService, public dataService: DataService, private uniprot: UniprotService, public settings: SettingsService) {
    this.enableImputation = this.settings.settings.enableImputation

    effect(() => {
      const value = this.data()
      if (value) {
        this._data.set(value)
        const rawData = value
        this.currentPrimaryID.set(rawData[this.dataService.rawForm.primaryIDs])
        let newTitle = "<b>" + this.currentPrimaryID() + "</b>"

        this.volcanoConditionLeft = this.settings.settings.volcanoConditionLabels.leftCondition
        this.volcanoConditionRight = this.settings.settings.volcanoConditionLabels.rightCondition
        this.foldChangeValue = null
        this.pValue = null

        const result = this.dataService.currentDF.where(row => (row[this.dataService.differentialForm.primaryIDs] === rawData[this.dataService.rawForm.primaryIDs])).toArray()
        if (result.length > 0) {
          const diffData = result[0]
          if (this.dataService.differentialForm.foldChange !== "") {
            this.foldChangeValue = diffData[this.dataService.differentialForm.foldChange]
          }
          if (this.dataService.differentialForm.significant !== "") {
            this.pValue = diffData[this.dataService.differentialForm.significant]
          }
        }

        if (this.dataService.fetchUniprot) {
          this.uni = this.uniprot.getUniprotFromPrimary(rawData[this.dataService.rawForm.primaryIDs])
          if (this.uni) {
            if (this.uni["Gene Names"] !== "") {
              newTitle = "<b>" + this.uni["Gene Names"] + "(" + rawData[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
            }
          }
        } else {
          if (this.dataService.differentialForm.geneNames !== "") {
            if (result.length > 0) {
              const diffData = result[0]
              newTitle = "<b>" + diffData[this.dataService.differentialForm.geneNames] + "(" + rawData[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
            }
          } else {
            newTitle = "<b>" + rawData[this.dataService.rawForm.primaryIDs] + "</b>"
          }
        }
        this.title.set(newTitle)
        this.drawBarChart()
        this.graphLayout["title"] = this.title()
        this.graphLayoutAverage["title"] = this.title()
        this.graphLayoutViolin["title"] = this.title()
        this.drawAverageBarChart()
      }
    })

    this.dataService.externalBarChartDownloadTrigger.asObservable().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(trigger => {
      if (trigger) {
        const rawData = this._data()
        for (const i of ["bar", "average", "violin"]) {
          let e = document.getElementById(rawData[this.dataService.rawForm.primaryIDs]+i)
          if (e) {
            this.web.downloadPlotlyImage('svg', rawData[this.dataService.rawForm.primaryIDs]+this.uni["Gene Names"]+i+'.svg', rawData[this.dataService.rawForm.primaryIDs]+i).then()
          } else {
            let observer = new MutationObserver(mutations => {
              mutations.forEach((mutation) => {
                let nodes = Array.from(mutation.addedNodes)
                for (const node of nodes) {
                  if (node.contains(document.getElementById(rawData[this.dataService.rawForm.primaryIDs]+i))) {
                    e = document.getElementById(rawData[this.dataService.rawForm.primaryIDs]+i)
                    if (e) {
                      this.web.downloadPlotlyImage('svg', rawData[this.dataService.rawForm.primaryIDs]+this.uni["Gene Names"]+i+'.svg', rawData[this.dataService.rawForm.primaryIDs]+i).then()
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

    this.dataService.redrawTrigger.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      if (data) {
        this.enableImputation = this.settings.settings.enableImputation
        this.volcanoConditionLeft = this.settings.settings.volcanoConditionLabels.leftCondition
        this.volcanoConditionRight = this.settings.settings.volcanoConditionLabels.rightCondition

        const rawData = this._data()
        if (rawData && this.dataService.differentialForm.geneNames !== "") {
          const result = this.dataService.currentDF.where(row => (row[this.dataService.differentialForm.primaryIDs] === rawData[this.dataService.rawForm.primaryIDs])).toArray()
          if (result.length > 0) {
            const diffData = result[0]
            if (this.dataService.differentialForm.foldChange !== "") {
              this.foldChangeValue = diffData[this.dataService.differentialForm.foldChange]
            }
            if (this.dataService.differentialForm.significant !== "") {
              this.pValue = diffData[this.dataService.differentialForm.significant]
            }
          }
        }

        this.drawBarChart()
        this.drawAverageBarChart()
      }
    })
  }

  download(type: string) {
    const rawData = this._data()
    if (type === "all") {
      this.web.downloadPlotlyImage('svg', 'bar.svg', rawData[this.dataService.rawForm.primaryIDs]+"bar").then()
      this.web.downloadPlotlyImage('svg', 'average.svg', rawData[this.dataService.rawForm.primaryIDs]+"average").then()
      this.web.downloadPlotlyImage('svg', 'violin.svg', rawData[this.dataService.rawForm.primaryIDs]+"violin").then()
    } else {
      this.web.downloadPlotlyImage('svg', type+'.svg', rawData[this.dataService.rawForm.primaryIDs]+type).then()
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
        const rawData = this._data()
        let canImpute = false
        if (this.settings.settings.imputationMap[rawData[this.dataService.rawForm.primaryIDs]]) {
          if (this.settings.settings.imputationMap[rawData[this.dataService.rawForm.primaryIDs]][s]) {
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
        graph[condition].y.push(rawData[s])
        if (canImpute) {
          graph[condition].marker.pattern.shape.push("/")

        } else {
          graph[condition].marker.pattern.shape.push("")
        }
        if (this.settings.settings.peptideCountData && this.settings.settings.viewPeptideCount) {
          if (this.settings.settings.peptideCountData[rawData[this.dataService.rawForm.primaryIDs]]) {
            if (this.settings.settings.peptideCountData[rawData[this.dataService.rawForm.primaryIDs]][s]) {
              const peptideCountData = this.settings.settings.peptideCountData[rawData[this.dataService.rawForm.primaryIDs]][s].toString()
              graph[condition].hovertext.push(
                `Sample:${s}<br>Value:${rawData[s]}<br>${peptideCountData} peptides`
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
    let previousSampleNumber: number = 0
    let leftConditionPos: {x0: number, x1: number} | null = null
    let rightConditionPos: {x0: number, x1: number} | null = null

    for (const g of this.settings.settings.conditionOrder) {
      if (!graph[g]) {
        continue
      }
      let sampleCount = graph[g].x.length
      previousSampleNumber = currentSampleNumber
      currentSampleNumber = currentSampleNumber + sampleCount
      this.graphData.push(graph[g])
      tickvals.push(graph[g].x[Math.round(sampleCount/2)-1])
      if (this.imputationCount[g] > 0) {
        ticktext.push(`${g} (${this.imputationCount[g]} imputed)`)
      } else {
        ticktext.push(g)
      }

      const isLeftCondition = this.volcanoConditionLeft && g === this.volcanoConditionLeft
      const isRightCondition = this.volcanoConditionRight && g === this.volcanoConditionRight

      if (isLeftCondition || isRightCondition) {
        const x0 = previousSampleNumber/sampleNumber
        const x1 = currentSampleNumber/sampleNumber

        if (this.settings.settings.barChartConditionBracket.showBracket) {
          const width = x1 - x0
          const padding = width * 0.1
          shapes.push({
            type: "line",
            xref: "paper",
            yref: "paper",
            x0: x0 + padding,
            x1: x1 - padding,
            y0: 1.02,
            y1: 1.02,
            line: {
              color: this.settings.settings.barChartConditionBracket.bracketColor,
              width: this.settings.settings.barChartConditionBracket.bracketWidth
            }
          })
        }

        if (isLeftCondition) {
          leftConditionPos = {x0, x1}
        }
        if (isRightCondition) {
          rightConditionPos = {x0, x1}
        }
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

    if (leftConditionPos && rightConditionPos && this.settings.settings.barChartConditionBracket.showBracket) {
      const bracketY = 1.02 + this.settings.settings.barChartConditionBracket.bracketHeight
      const leftMidX = (leftConditionPos.x0 + leftConditionPos.x1) / 2
      const rightMidX = (rightConditionPos.x0 + rightConditionPos.x1) / 2

      shapes.push({
        type: "line",
        xref: "paper",
        yref: "paper",
        x0: leftMidX,
        x1: leftMidX,
        y0: 1.02,
        y1: bracketY,
        line: {
          color: this.settings.settings.barChartConditionBracket.bracketColor,
          width: this.settings.settings.barChartConditionBracket.bracketWidth
        }
      })
      shapes.push({
        type: "line",
        xref: "paper",
        yref: "paper",
        x0: leftMidX,
        x1: rightMidX,
        y0: bracketY,
        y1: bracketY,
        line: {
          color: this.settings.settings.barChartConditionBracket.bracketColor,
          width: this.settings.settings.barChartConditionBracket.bracketWidth
        }
      })
      shapes.push({
        type: "line",
        xref: "paper",
        yref: "paper",
        x0: rightMidX,
        x1: rightMidX,
        y0: bracketY,
        y1: 1.02,
        line: {
          color: this.settings.settings.barChartConditionBracket.bracketColor,
          width: this.settings.settings.barChartConditionBracket.bracketWidth
        }
      })
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

    this.applyYAxisLimits('barChart', this.graphLayout)
  }

  setIndividualLimit(chartType: string, limitType: 'min' | 'max', value: any) {
    const primaryID = this.currentPrimaryID()
    if (!this.settings.settings.individualYAxisLimits[primaryID]) {
      this.settings.settings.individualYAxisLimits[primaryID] = {}
    }
    if (!this.settings.settings.individualYAxisLimits[primaryID][chartType]) {
      this.settings.settings.individualYAxisLimits[primaryID][chartType] = { min: null, max: null }
    }
    this.settings.settings.individualYAxisLimits[primaryID][chartType][limitType] = value === '' ? null : Number(value)
    this.drawBarChart()
    this.drawAverageBarChart()
  }

  clearIndividualLimits() {
    delete this.settings.settings.individualYAxisLimits[this.currentPrimaryID()]
    this.drawBarChart()
    this.drawAverageBarChart()
  }

  applyYAxisLimits(chartType: string, layout: any) {
    const globalLimits = this.settings.settings.chartYAxisLimits?.[chartType]
    const individualLimits = this.settings.settings.individualYAxisLimits?.[this.currentPrimaryID()]?.[chartType]

    let minY = null
    let maxY = null

    if (globalLimits) {
      if (globalLimits.min !== null) minY = globalLimits.min
      if (globalLimits.max !== null) maxY = globalLimits.max
    }

    if (individualLimits) {
      if (individualLimits.min !== null) minY = individualLimits.min
      if (individualLimits.max !== null) maxY = individualLimits.max
    }

    if (minY !== null || maxY !== null) {
      layout.yaxis.range = [minY ?? 0, maxY ?? layout.yaxis.range?.[1] ?? 0]
      layout.yaxis.autorange = false
    } else {
      layout.yaxis.autorange = true
      delete layout.yaxis.range
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
        graph[condition].push(this._data()[s])
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
        showlegend: false
      }
      console.log(box)
      const violinX: any[] = graph[g].map(() => g)

      const violin = {
        type: 'violin',
        x: violinX,
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
        fillcolor: color,
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

    const avgShapes: any[] = []
    const violinShapes: any[] = []
    let conditionIndex = 0
    let avgLeftPos: {x0: number, x1: number} | null = null
    let avgRightPos: {x0: number, x1: number} | null = null

    for (const g of this.settings.settings.conditionOrder) {
      if (!graph[g]) {
        continue
      }
      const isLeftCondition = this.volcanoConditionLeft && g === this.volcanoConditionLeft
      const isRightCondition = this.volcanoConditionRight && g === this.volcanoConditionRight

      if (isLeftCondition || isRightCondition) {
        const x0 = conditionIndex / tickVals.length
        const x1 = (conditionIndex + 1) / tickVals.length

        if (this.settings.settings.barChartConditionBracket.showBracket) {
          const width = x1 - x0
          const padding = width * 0.1
          avgShapes.push({
            type: "line",
            xref: "paper",
            yref: "paper",
            x0: x0 + padding,
            x1: x1 - padding,
            y0: 1.02,
            y1: 1.02,
            line: {
              color: this.settings.settings.barChartConditionBracket.bracketColor,
              width: this.settings.settings.barChartConditionBracket.bracketWidth
            }
          })
          violinShapes.push({
            type: "line",
            xref: "paper",
            yref: "paper",
            x0: x0 + padding,
            x1: x1 - padding,
            y0: 1.02,
            y1: 1.02,
            line: {
              color: this.settings.settings.barChartConditionBracket.bracketColor,
              width: this.settings.settings.barChartConditionBracket.bracketWidth
            }
          })
        }

        if (isLeftCondition) {
          avgLeftPos = {x0, x1}
        }
        if (isRightCondition) {
          avgRightPos = {x0, x1}
        }
      }
      conditionIndex++
    }

    if (avgLeftPos && avgRightPos && this.settings.settings.barChartConditionBracket.showBracket) {
      const bracketY = 1.02 + this.settings.settings.barChartConditionBracket.bracketHeight
      const leftMidX = (avgLeftPos.x0 + avgLeftPos.x1) / 2
      const rightMidX = (avgRightPos.x0 + avgRightPos.x1) / 2

      const bracketShapes = [
        {
          type: "line",
          xref: "paper",
          yref: "paper",
          x0: leftMidX,
          x1: leftMidX,
          y0: 1.02,
          y1: bracketY,
          line: {
            color: this.settings.settings.barChartConditionBracket.bracketColor,
            width: this.settings.settings.barChartConditionBracket.bracketWidth
          }
        },
        {
          type: "line",
          xref: "paper",
          yref: "paper",
          x0: leftMidX,
          x1: rightMidX,
          y0: bracketY,
          y1: bracketY,
          line: {
            color: this.settings.settings.barChartConditionBracket.bracketColor,
            width: this.settings.settings.barChartConditionBracket.bracketWidth
          }
        },
        {
          type: "line",
          xref: "paper",
          yref: "paper",
          x0: rightMidX,
          x1: rightMidX,
          y0: bracketY,
          y1: 1.02,
          line: {
            color: this.settings.settings.barChartConditionBracket.bracketColor,
            width: this.settings.settings.barChartConditionBracket.bracketWidth
          }
        }
      ]
      avgShapes.push(...bracketShapes)
      violinShapes.push(...bracketShapes)
    }

    this.graphLayoutAverage.shapes = avgShapes
    this.graphLayoutViolin.shapes = violinShapes

    if (this.settings.settings.columnSize.violinPlot !== 0) {
      this.graphLayoutViolin.width = this.graphLayoutViolin.margin.l + this.graphLayoutViolin.margin.r + this.settings.settings.columnSize.violinPlot * tickVals.length
    }
    this.graphLayoutViolin.xaxis.tickvals = tickVals
    this.graphLayoutViolin.xaxis.ticktext = tickText
    this.graphDataViolin = graphViolin

    this.applyYAxisLimits('averageBarChart', this.graphLayoutAverage)
    this.applyYAxisLimits('violinPlot', this.graphLayoutViolin)
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
    const rawData = this._data()
    let data: string = ""
    data = Object.keys(rawData).join("\t") + "\n"
    data = data + Object.values(rawData).join("\t") + "\n"
    this.web.downloadFile(this.title() + ".txt", data)
  }
}
