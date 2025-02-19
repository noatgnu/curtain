import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {SettingsService} from "../../settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FdrCurveComponent} from "../fdr-curve/fdr-curve.component";
import {VolcanoColorsComponent} from "../volcano-colors/volcano-colors.component";
import {selectionData} from "../protein-selections/protein-selections.component";
import {WebService} from "../../web.service";
import {
  VolcanoPlotTextAnnotationComponent
} from "../volcano-plot-text-annotation/volcano-plot-text-annotation.component";
import {ToastService} from "../../toast.service";
import {FormBuilder} from "@angular/forms";
import {AreYouSureClearModalComponent} from "../are-you-sure-clear-modal/are-you-sure-clear-modal.component";
import {ColorByCategoryModalComponent} from "./color-by-category-modal/color-by-category-modal.component";

@Component({
    selector: 'app-volcano-plot',
    templateUrl: './volcano-plot.component.html',
    styleUrls: ['./volcano-plot.component.scss'],
    standalone: false
})
export class VolcanoPlotComponent implements OnInit {
  editMode: boolean = false
  settingsNav: string = "parameters"
  @Output() selected: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  isVolcanoParameterCollapsed: boolean = false
  _data: any;
  //nameToID: any = {}
  graphData: any[] = []
  scattergl: boolean = false
  yAxisPosition: string[] = [
    "middle",
    "left"
  ]
  revision = 0
  graphLayout: any = {
    editable: true,
    height: 700, width: 700,
    margin: {r: null, l: null, b: null, t: null},
    xaxis: {
      title: "<b>Log2FC</b>",
      tickmode: "linear",
      ticklen: 5,
      showgrid: false,
      visible: true,
      //zerolinecolor: "#ffffff"
    },
    yaxis: {
      title: "<b>-log10(p-value)</b>",
      tickmode: "linear",
      ticklen: 5,
      showgrid: false,
      visible: true,
      showticklabels: true,
      zeroline: true,
    },
    annotations: [],
    showlegend: true, legend: {
      orientation: 'h'
    },
    title: {
      text: this.settings.settings.volcanoPlotTitle,
      font: {
        size: 24,
        family: "Arial, sans-serif"
      },
    }
  }
  config: any = {
    //modeBarButtonsToRemove: ["toImage"]
    editable: this.editMode,
    toImageButtonOptions: {
      format: 'svg',
      filename: this.graphLayout.title.text,
      height: this.graphLayout.height,
      width: this.graphLayout.width,
      scale: 1
    }
  }
  layoutMaxMin: any = {
    xMin: 0, xMax: 0, yMin: 0, yMax: 0
  }

  annotated: any = {}


  @Input() set data(value: IDataFrame) {
    this._data = value
    if (this._data.count()) {
      this.messageService.show("Volcano plot", "Drawing volcano plot. This may take a while.").then(
        () => {
          this.drawVolcano()
        }
      )
    }
  }

  breakColor: boolean = false
  currentPosition = 0
  currentLegend: string[] = []

  markerSize: number = 10
  specialColorMap: any = {}
  repeat = false

  drawVolcano() {
    console.log(this.dataService.selected)
    this.currentPosition = 0
    this.settings.settings.scatterPlotMarkerSize = this.markerSize
    if (!this.settings.settings.visible) {
      this.settings.settings.visible = {}
    }
    this.graphLayout.title.text = this.settings.settings.volcanoPlotTitle
    let currentColors: string[] = []
    if (this.settings.settings.colorMap) {
      for (const s in this.settings.settings.colorMap) {
        if (!this.dataService.conditions.includes(s)) {
          if (this.settings.settings.colorMap[s]) {
            if (this.settings.settings.defaultColorList.includes(this.settings.settings.colorMap[s])) {
              currentColors.push(this.settings.settings.colorMap[s])
            }
          }
        }
      }
    } else {
      this.settings.settings.colorMap = {}
    }
    console.log(currentColors)
    let fdrCurve: IDataFrame = new DataFrame()
    if (this.settings.settings.fdrCurveTextEnable) {
      if (this.settings.settings.fdrCurveText !== "") {
        fdrCurve = fromCSV(this.settings.settings.fdrCurveText)
      }
    }
    const temp: any = {}


    if (currentColors.length !== this.settings.settings.defaultColorList.length) {
      if (currentColors.length >= this.settings.settings.defaultColorList.length) {
        this.currentPosition = 0
      } else {
        this.currentPosition = currentColors.length
      }


    }
    for (const s of this.dataService.selectOperationNames) {
      if (!this.settings.settings.colorMap[s]) {

        while (true) {
          if (this.breakColor) {
            this.settings.settings.colorMap[s] = this.settings.settings.defaultColorList[this.currentPosition]
            break
          }
          if (currentColors.indexOf(this.settings.settings.defaultColorList[this.currentPosition]) !== -1) {
            this.currentPosition ++
            if (this.repeat) {
              this.settings.settings.colorMap[s] = this.settings.settings.defaultColorList[this.currentPosition]
              break
            }
          } else if (this.currentPosition >= this.settings.settings.defaultColorList.length) {
            this.currentPosition = 0
            this.settings.settings.colorMap[s] = this.settings.settings.defaultColorList[this.currentPosition]
            this.repeat = true
            break
          } else if (this.currentPosition !== this.settings.settings.defaultColorList.length) {
            this.settings.settings.colorMap[s] = this.settings.settings.defaultColorList[this.currentPosition]
            break

          } else {
            this.breakColor = true
            this.currentPosition = 0
          }
        }

        this.currentPosition ++
        if (this.currentPosition === this.settings.settings.defaultColorList.length) {
          this.currentPosition = 0
        }
      }
      temp[s] = {
        x: [],
        y: [],
        text: [],
        primaryIDs: [],
        //type: "scattergl",
        type: "scatter",
        mode: "markers",
        name: s,
        marker: {
          color: this.settings.settings.colorMap[s],
          size: this.settings.settings.scatterPlotMarkerSize
        }
      }
    }
    this.layoutMaxMin = {
      xMin: 0, xMax: 0, yMin: 0, yMax: 0
    }
    this.layoutMaxMin.xMin = this.dataService.minMax.fcMin
    this.layoutMaxMin.xMax = this.dataService.minMax.fcMax
    this.layoutMaxMin.yMin = this.dataService.minMax.pMin
    this.layoutMaxMin.yMax = this.dataService.minMax.pMax

    this.graphLayout.xaxis.range = [this.layoutMaxMin.xMin - 0.5, this.layoutMaxMin.xMax + 0.5]
    if (this.settings.settings.volcanoAxis.minX) {
      this.graphLayout.xaxis.range[0] = this.settings.settings.volcanoAxis.minX
    }
    if (this.settings.settings.volcanoAxis.maxX) {
      this.graphLayout.xaxis.range[1] = this.settings.settings.volcanoAxis.maxX
    }

    this.graphLayout.yaxis.range = [0, this.layoutMaxMin.yMax + this.layoutMaxMin.yMin / 10]
    if (this.settings.settings.volcanoAxis.minY) {
      this.graphLayout.yaxis.range[0] = this.settings.settings.volcanoAxis.minY
    }
    if (this.settings.settings.volcanoAxis.maxY) {
      this.graphLayout.yaxis.range[1] = this.settings.settings.volcanoAxis.maxY
    }
    if (this.settings.settings.volcanoAxis.x) {
      this.graphLayout.xaxis.title = `<b>${this.settings.settings.volcanoAxis.x}</b>`
    }
    if (this.settings.settings.volcanoAxis.y) {
      this.graphLayout.yaxis.title = `<b>${this.settings.settings.volcanoAxis.y}</b>`
    }

    temp["Background"] = {
      x:[],
      y:[],
      text: [],
      primaryIDs: [],
      //type: "scattergl",
      type: "scatter",
      mode: "markers",
      name: "Background"
    }
    if (this.scattergl) {
      temp["Background"].type = "scattergl"
    }
    if (this.settings.settings.backGroundColorGrey) {
      temp["Background"]["marker"] = {
        color: "#a4a2a2",
        opacity: 0.3,
        size: this.settings.settings.scatterPlotMarkerSize
      }
    }


    for (const r of this._data) {
      let geneNames = ""
      const x = r[this.dataService.differentialForm.foldChange]
      const y = r[this.dataService.differentialForm.significant]
      let primaryID = r[this.dataService.differentialForm.primaryIDs]
      //if (primaryID === "P52850") {
        //console.log(this.uniprot.getUniprotFromPrimary(primaryID))
      //}
      let uniquePrimaryID = ""
      if (this.dataService.differentialForm.comparisonSelect.length > 1) {
        uniquePrimaryID = r["UniquePrimaryIDs"]
      }
      let text = primaryID
      if (this.dataService.fetchUniprot) {
        const rd: any = this.uniprot.getUniprotFromPrimary(primaryID)
        if (rd) {
          geneNames = rd["Gene Names"]
        }
      } else {
        if (this.dataService.differentialForm.geneNames !== "") {
          geneNames = r[this.dataService.differentialForm.geneNames]
        }
      }
      if (geneNames !== "") {
        text = geneNames + "[" + primaryID + "]" + " (" + r[this.dataService.differentialForm.comparison] + ")"
      }
      if (this.settings.settings.customVolcanoTextCol !== "") {
        text = r[this.settings.settings.customVolcanoTextCol]
      }
      //this.nameToID[text] = primaryID

      if (this.dataService.selectedMap[primaryID]) {
        for (const o in this.dataService.selectedMap[primaryID]) {
          const match = /\(([^)]*)\)[^(]*$/.exec(o)
          if (match) {
            if (match[1] === r[this.dataService.differentialForm.comparison]) {
              temp[o].x.push(x)
              temp[o].y.push(y)
              temp[o].text.push(text)
              temp[o].primaryIDs.push(primaryID)
            }
          } else {
            temp[o].x.push(x)
            temp[o].y.push(y)
            temp[o].text.push(text)
            temp[o].primaryIDs.push(primaryID)
          }
        }
      } else if (this.settings.settings.backGroundColorGrey) {
        temp["Background"].x.push(x)
        temp["Background"].y.push(y)
        temp["Background"].text.push(text)
        temp["Background"].primaryIDs.push(primaryID)
      } else {
        const gr = this.dataService.significantGroup(x, y)
        let group = this.dataService.significantGroup(x, y)[0] + " (" + r[this.dataService.differentialForm.comparison] + ")"

        if (!temp[group]) {
          if (!this.settings.settings.colorMap[group]) {
            if (!this.specialColorMap[gr[1]]) {
              if (this.settings.settings.defaultColorList[this.currentPosition]) {
                this.specialColorMap[gr[1]] = this.settings.settings.defaultColorList[this.currentPosition].slice()
                this.settings.settings.colorMap[group] = this.settings.settings.defaultColorList[this.currentPosition].slice()
              } else {
                this.currentPosition = 0
                this.specialColorMap[gr[1]] = this.settings.settings.defaultColorList[this.currentPosition].slice()
                this.settings.settings.colorMap[group] = this.settings.settings.defaultColorList[this.currentPosition].slice()
              }
            } else {
              this.settings.settings.colorMap[group] = this.specialColorMap[gr[1]].slice()
            }


            this.currentPosition ++
            if (this.currentPosition === this.settings.settings.defaultColorList.length) {
              this.currentPosition = 0
            }
          } else {
            this.specialColorMap[gr[1]] = this.settings.settings.colorMap[group].slice()
          }

          temp[group] = {
            x: [],
            y: [],
            text: [],
            primaryIDs: [],
            //type: "scattergl",
            type: "scatter",
            mode: "markers",
            marker: {
              color: this.settings.settings.colorMap[group],
              size: this.settings.settings.scatterPlotMarkerSize
            },
            name: group
          }
          if (this.scattergl) {
            temp[group].type = "scattergl"
          }
        }
        temp[group].x.push(x)
        temp[group].y.push(y)
        temp[group].text.push(text)
        temp[group].primaryIDs.push(primaryID)
      }
    }
    const graphData: any[] = []
    this.currentLegend = []
    for (const t in temp) {
      if (temp[t].x.length > 0) {
        if (this.settings.settings.visible[t]) {
          temp[t].visible = this.settings.settings.visible[t]
        } else {
          temp[t].visible = true
        }
        graphData.push(temp[t])
        this.currentLegend.push(t)
      }
    }

    if (fdrCurve.count() > 0) {
      if (this.graphLayout.xaxis.range === undefined) {
        this.graphLayout.xaxis.range = [this.layoutMaxMin.xMin - 0.5, this.layoutMaxMin.xMax + 0.5]
        this.graphLayout.xaxis.autoscale = true
        this.graphLayout.yaxis.range = [0, -Math.log10(this.layoutMaxMin.yMin - this.layoutMaxMin.yMin/2)]
        this.graphLayout.yaxis.autoscale = true
      }
      const left: IDataFrame = fdrCurve.where(row => row.x < 0).bake()
      const right: IDataFrame = fdrCurve.where(row => row.x >= 0).bake()
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
        },
        name: "Left Curve"
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
        },
        name: "Right Curve"
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
      graphData.push(fdrLeft)
      graphData.push(fdrRight)
      this.graphLayout.xaxis.autorange = true
      this.graphLayout.yaxis.autorange = true
    } else {
      const cutOff: any[] = []
      cutOff.push({
        type: "line",
        x0: -this.settings.settings.log2FCCutoff,
        x1: -this.settings.settings.log2FCCutoff,
        y0: 0,
        y1: this.graphLayout.yaxis.range[1],
        line: {
          color: 'rgb(21,4,4)',
          width: 1,
          dash: 'dot'
        }
      })
      cutOff.push({
        type: "line",
        x0: this.settings.settings.log2FCCutoff,
        x1: this.settings.settings.log2FCCutoff,
        y0: 0,
        y1: this.graphLayout.yaxis.range[1],
        line: {
          color: 'rgb(21,4,4)',
          width: 1,
          dash: 'dot'
        }
      })
      let x0 = this.layoutMaxMin.xMin - 1
      if (this.settings.settings.volcanoAxis.minX) {
        x0 = this.settings.settings.volcanoAxis.minX - 1
      }
      let x1 = this.layoutMaxMin.xMax + 1
      if (this.settings.settings.volcanoAxis.maxX) {
        x1 = this.settings.settings.volcanoAxis.maxX + 1
      }
      cutOff.push({
        type: "line",
        x0: x0,
        x1: x1,
        y0: -Math.log10(this.settings.settings.pCutoff),
        y1: -Math.log10(this.settings.settings.pCutoff),
        line: {
          color: 'rgb(21,4,4)',
          width: 1,
          dash: 'dot'
        }
      })

      this.graphLayout.shapes = cutOff
    }
    if (!this.scattergl) {
      this.graphData = graphData.reverse()
    }
    this.graphLayout.yaxis.showgrid = this.settings.settings.volcanoPlotGrid.y
    this.graphLayout.xaxis.showgrid = this.settings.settings.volcanoPlotGrid.x
    if (this.settings.settings.volcanoPlotDimension.height) {
      this.graphLayout.height = this.settings.settings.volcanoPlotDimension.height
    }
    if (this.settings.settings.volcanoPlotDimension.width) {
      this.graphLayout.width = this.settings.settings.volcanoPlotDimension.width
    }
    if (this.settings.settings.volcanoPlotDimension.margin) {
      for (const i in this.settings.settings.volcanoPlotDimension.margin) {
        if (this.settings.settings.volcanoPlotDimension.margin[i]) {
          this.graphLayout.margin[i] = this.settings.settings.volcanoPlotDimension.margin[i]
        }
      }
    }

    if (this.settings.settings.volcanoPlotYaxisPosition.includes("left")) {

      // draw y axis line at min x
      this.graphLayout.shapes.push({
        type: "line",
        x0: this.graphLayout.xaxis.range[0],
        x1: this.graphLayout.xaxis.range[0],
        y0: this.graphLayout.yaxis.range[0],
        y1: this.graphLayout.yaxis.range[1],
        line: {
          color: 'rgb(21,4,4)',
          width: 1,
        }
      })
    } else {

    }
    if (this.settings.settings.volcanoPlotYaxisPosition.includes("middle")) {
      this.graphLayout.xaxis.zerolinecolor = "#000000"
    } else {
      this.graphLayout.xaxis.zerolinecolor = "#ffffff"
    }


    this.graphLayout.annotations = []
    for (const i in this.settings.settings.textAnnotation) {
      if (this.settings.settings.textAnnotation[i].data.showannotation === true) {
        this.annotated[this.settings.settings.textAnnotation[i].title] = this.settings.settings.textAnnotation[i].data
        this.graphLayout.annotations.push(this.settings.settings.textAnnotation[i].data)
      }

    }
    this.config = {
      editable: this.editMode,
      toImageButtonOptions: {
        format: 'svg',
        filename: this.graphLayout.title.text,
        height: this.graphLayout.height,
        width: this.graphLayout.width,
        scale: 1,
        margin: this.graphLayout.margin
      },
      modeBarButtonsToAdd: ["drawline", "drawcircle", "drawrect", "eraseshape", "editinchartstudio"]
    }
    if (this.settings.settings.volcanoAdditionalShapes) {
      for (const s of this.settings.settings.volcanoAdditionalShapes) {
        if (s.editable) {
          if (!s.label.font) {
            s.label.font = {
              size: null,
              family: "Arial, sans-serif",
              color: "#000000"
            }
          }
          this.graphLayout.shapes.push(s)
        }
      }
    }
    if (this.settings.settings.volcanoPlotLegendX) {
      this.graphLayout.legend.x = this.settings.settings.volcanoPlotLegendX
    }
    if (this.settings.settings.volcanoPlotLegendY) {
      this.graphLayout.legend.y = this.settings.settings.volcanoPlotLegendY
    }
    if (this.settings.settings.volcanoAxis.dtickX) {
      this.graphLayout.xaxis.dtick = this.settings.settings.volcanoAxis.dtickX
    } else {
      this.graphLayout.xaxis.dtick = undefined
    }
    if (this.settings.settings.volcanoAxis.dtickY) {
      this.graphLayout.yaxis.dtick = this.settings.settings.volcanoAxis.dtickY
    } else {
      this.graphLayout.yaxis.dtick = undefined
    }
    if (this.settings.settings.volcanoAxis.ticklenX) {
      this.graphLayout.xaxis.ticklen = this.settings.settings.volcanoAxis.ticklenX
    } else {
      this.graphLayout.xaxis.ticklen = 5
    }
    if (this.settings.settings.volcanoAxis.ticklenY) {
      this.graphLayout.yaxis.ticklen = this.settings.settings.volcanoAxis.ticklenY
    } else {
      this.graphLayout.yaxis.ticklen = 5
    }

    this.revision ++
    this.messageService.show("Volcano Plot", "Finished drawing volcano plot")
    //this.removeAnnotatedDataPoints([])
    console.log(this.graphData)
  }

  constructor(private fb: FormBuilder, private web: WebService, public dataService: DataService, private uniprot: UniprotService, public settings: SettingsService, private modal: NgbModal, private messageService: ToastService) {
    this.annotated = {}
    for (const i in this.settings.settings.textAnnotation) {
      if (this.settings.settings.textAnnotation[i].data.showannotation === undefined || this.settings.settings.textAnnotation[i].data.showannotation === null) {
        this.settings.settings.textAnnotation[i].data.showannotation = true
      }
      this.annotated[i] = this.settings.settings.textAnnotation[i]
    }
    this.dataService.resetVolcanoColor.asObservable().subscribe(data => {
      if (data) {
        this.specialColorMap = {}
      }
    })
    this.markerSize = this.settings.settings.scatterPlotMarkerSize
    this.dataService.selectionUpdateTrigger.asObservable().subscribe(data => {
      if (data) {

        if (Object.keys(this.dataService.annotatedData).length === 0) {
          this.annotated = {}
        }
        this.drawVolcano()
      }
    })
    this.dataService.annotationService.asObservable().subscribe(data => {
      if (data) {
        console.log(data)
        if (data.remove) {
          if (typeof data.id === "string") {
            this.removeAnnotatedDataPoints([data.id]).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          } else {
            this.removeAnnotatedDataPoints(data.id).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          }

        } else {
          if (typeof data.id === "string") {
            this.annotateDataPoints([data.id]).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          } else {
            this.annotateDataPoints(data.id).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          }

        }
      }
    })
  }

  ngOnInit(): void {
  }

  selectData(e: any) {
    if ("points" in e) {
      const selected: string[] = []
      for (const p of e["points"]) {
        selected.push(p.data.primaryIDs[p.pointNumber])
      }
      console.log(selected)
      if (selected.length === 1) {
        this.selected.emit(
          {
            data: selected,
            title: e["points"][0].text
          }
        )
      } else {
        if (selected.length !== 0) {
          this.selected.emit(
            {
              data: selected,
              title: "Selected " + selected.length + " genes." + "[Selection #" + (this.dataService.selectOperationNames.length+1) + "]"
            }
          )
        }
      }
    }
  }

  FDRCurveSettings() {
    this.modal.open(FdrCurveComponent)
  }

  openCustomColor() {
    const ref = this.modal.open(VolcanoColorsComponent)
    const colorGroups: any[] = []
    console.log(this.settings.settings.colorMap)
    for (const g in this.settings.settings.colorMap) {
      if (this.currentLegend.includes(g)) {
        colorGroups.push({color: this.settings.settings.colorMap[g], group: g, remove: false})
      }
    }
    ref.componentInstance.data = {colorGroups: colorGroups, groups: this.currentLegend}
    ref.closed.subscribe(data => {
      for (const g of data) {
        if (this.settings.settings.colorMap[g.group] !== g.color) {
          this.settings.settings.colorMap[g.group] = g.color
        }
        if (g.remove) {
          delete this.settings.settings.colorMap[g.group]
        }
      }
      this.drawVolcano()
    })
  }

  async annotateDataPoints(data: string[]) {
    const annotations: any[] = []
    const annotatedData = this.dataService.currentDF.where(r => data.includes(r[this.dataService.differentialForm.primaryIDs])).bake()
    for (const a of annotatedData) {
      let title = a[this.dataService.differentialForm.primaryIDs]
      const uni: any = this.uniprot.getUniprotFromPrimary(title)
      if (uni) {
        if (uni["Gene Names"] !== "") {
          title = uni["Gene Names"] + "(" + title + ")"
        }
      }

      if (!this.annotated[title]) {

        const ann: any = {
          xref: 'x',
          yref: 'y',
          x: a[this.dataService.differentialForm.foldChange],
          y: a[this.dataService.differentialForm.significant],
          text: "<b>"+title+"</b>",
          showarrow: true,
          arrowhead: 1,
          arrowsize: 1,
          arrowwidth: 1,
          ax: -20,
          ay: -20,
          font: {
            size: 15,
            color: "#000000",
            family: "Arial, sans-serif"
          },
          showannotation: true,
          annotationID: title
        }
        if (this.settings.settings.customVolcanoTextCol !== "") {
          ann.text = "<b>"+a[this.settings.settings.customVolcanoTextCol]+"</b>"
        }
        if (title in this.settings.settings.textAnnotation) {

        } else {
          this.settings.settings.textAnnotation[title] = {
            primary_id: a[this.dataService.differentialForm.primaryIDs],
            data: ann,
            title: title
          }
        }

        annotations.push(ann)
        this.annotated[title] = ann
      }
    }
    if (annotations.length > 0) {
      this.graphLayout.annotations = this.graphLayout.annotations.concat(annotations)
    }
    console.log(this.graphLayout.annotations)
    this.dataService.annotationVisualUpdated.next(true)
  }

  async removeAnnotatedDataPoints(data: string[]) {
    for (const d of data) {
      let title = d
      const uni: any = this.uniprot.getUniprotFromPrimary(title)

      if (uni) {
        if (uni["Gene Names"] !== "") {
          title = uni["Gene Names"] + "(" + title + ")"
        }
      }
      if (this.annotated[title]) {
        delete this.annotated[title]
        delete this.settings.settings.textAnnotation[title]
      }
    }
    this.graphLayout.annotations = Object.values(this.annotated)
    this.dataService.annotationVisualUpdated.next(true)
  }

  download() {
    this.web.downloadPlotlyImage("svg", "volcano","volcanoPlot")
  }

  updateAnnotation(data: any) {
    this.graphLayout.annotations = []
    this.annotated = {}
    for (const f of data) {
      console.log(f)
      this.settings.settings.textAnnotation[f.value.annotationID].data.showarrow = f.value.showarrow
      this.settings.settings.textAnnotation[f.value.annotationID].data.arrowhead = f.value.arrowhead
      this.settings.settings.textAnnotation[f.value.annotationID].data.arrowsize = f.value.arrowsize
      this.settings.settings.textAnnotation[f.value.annotationID].data.arrowwidth = f.value.arrowwidth
      this.settings.settings.textAnnotation[f.value.annotationID].data.ax = f.value.ax
      this.settings.settings.textAnnotation[f.value.annotationID].data.ay = f.value.ay
      this.settings.settings.textAnnotation[f.value.annotationID].data.font.size = f.value.fontsize
      this.settings.settings.textAnnotation[f.value.annotationID].data.font.color = f.value.fontcolor
      this.settings.settings.textAnnotation[f.value.annotationID].data.text = f.value.text
      this.settings.settings.textAnnotation[f.value.annotationID].data.showannotation = f.value.showannotation
      this.settings.settings.textAnnotation[f.value.annotationID].data.annotationID = f.value.annotationID
      this.annotated[f.value.annotationID] = this.settings.settings.textAnnotation[f.value.annotationID].data
      this.graphLayout.annotations.push(this.annotated[f.value.annotationID])
    }
    this.drawVolcano()
  }

  openTextEditor() {
    const ref = this.modal.open(VolcanoPlotTextAnnotationComponent, {size: "xl", scrollable: true})
    ref.componentInstance.data = {annotation: this.settings.settings.textAnnotation}
    ref.closed.subscribe(data => {
      this.updateAnnotation(data)
    })
  }

  legendClickHandler(event: any) {
    if (event.event.srcElement.__data__[0].trace.visible === "legendonly") {
      this.settings.settings.visible[event.event.srcElement.__data__[0].trace.name] = true
    } else {
      this.settings.settings.visible[event.event.srcElement.__data__[0].trace.name] = "legendonly"
    }
  }

  clear() {
    const rememberClearSettings = localStorage.getItem("curtainRememberClearSettings")
    if (rememberClearSettings === "true") {
      this.dataService.clear()
    } else {
      const ref = this.modal.open(AreYouSureClearModalComponent)
      ref.closed.subscribe((result: boolean) => {
        if (result) {
          this.dataService.clear()
        }
      })
    }

  }

  isOverlapping(labelA: any, labelB: any) {
    const labelAWidth = labelA["font"]["size"] * this.stripHTML(labelA["text"]).length
    const labelBWidth = labelB["font"]["size"] * this.stripHTML(labelB["text"]).length
    return !(labelA.x > labelB.x + labelBWidth || labelA.x + labelAWidth < labelB.x || labelA.y > labelB.y + labelB["font"]["size"] || labelA.y + labelA["font"]["size"] < labelB.y)
  }

  addJitterUntilNoOverlap(currentLabel: any, existingLabels: any[], jitterAmount: number, plotBounds: {xMin: number, xMax: number, yMin: number, yMax: number}) {
    let jitteredLabel = {...currentLabel}; // Create a copy of the current label
    let isOverlapping: boolean;

    do {
      isOverlapping = false; // Reset the overlap flag for each iteration

      // Check if the jittered label overlaps with any of the existing labels
      for (const existingLabel of existingLabels) {
        if (this.isOverlapping(jitteredLabel, existingLabel)) {
          isOverlapping = true; // Set the overlap flag to true

          // Add jitter to the label's position
          jitteredLabel.x += (Math.random() - 0.5) * 2 * jitterAmount;
          jitteredLabel.y += (Math.random() - 0.5) * 2 * jitterAmount;

          // Ensure the jittered label does not go out of the plot
          jitteredLabel.x = Math.max(plotBounds.xMin, Math.min(plotBounds.xMax, jitteredLabel.x));
          jitteredLabel.y = Math.max(plotBounds.yMin, Math.min(plotBounds.yMax, jitteredLabel.y));

          break; // Break the loop as soon as an overlap is found
        }
      }
    } while (isOverlapping); // Repeat until no overlap is found

    return jitteredLabel; // Return the jittered label
  }

  jitterAnnotations() {
    // Jitter the annotations to prevent overlapping
    const jitterAmount = 5; // Amount of jitter to add to the annotations
    const jitteredAnnotations = this.graphLayout.annotations.map((annotation: any) => {
      return this.addJitterUntilNoOverlap(annotation, this.graphLayout.annotations.filter((a: any) => a !== annotation), jitterAmount, {
        xMin: this.graphLayout.xaxis.range[0],
        xMax: this.graphLayout.xaxis.range[1],
        yMin: this.graphLayout.yaxis.range[0],
        yMax: this.graphLayout.yaxis.range[1]
      });
    });

    // Update the annotations with the jittered positions
    this.graphLayout.annotations = jitteredAnnotations;
  }

  stripHTML(text: string) {
    return text.replace(/<[^>]*>?/gm, '')
  }

  handleLayoutChange(data: any) {
    const keys = Object.keys(data)
    console.log(data)
    if (data.shapes) {
      this.settings.settings.volcanoAdditionalShapes = data.shapes

      for (let i=0; i<this.settings.settings.volcanoAdditionalShapes.length; i++) {
        if (this.settings.settings.volcanoAdditionalShapes[i].editable) {
          this.settings.settings.volcanoAdditionalShapes[i].label = {
            text: "",
            texttemplate: "",
            font: {
              size: null,
              family: "Arial, sans-serif",
              color: "#000000"
            }
          }
        }
      }
      console.log(this.settings.settings.volcanoAdditionalShapes)
      this.dataService.volcanoAdditionalShapesSubject.next(true)
    }
    if (data["legend.x"]) {
      this.settings.settings.volcanoPlotLegendX = data["legend.x"]
    }
    if (data["legend.y"]) {
      this.settings.settings.volcanoPlotLegendY = data["legend.y"]
    }
    if (data["title.text"]) {
      this.settings.settings.volcanoPlotTitle = data["title.text"]
    }
    if (data["yaxis.title.text"]) {
      this.settings.settings.volcanoAxis.y = data["yaxis.title.text"]
    }
    if (data["xaxis.title.text"]) {
      this.settings.settings.volcanoAxis.x = data["xaxis.title.text"]
    }
    if (keys[0].startsWith("annotations")) {
      for (const k of keys) {
        const index = parseInt(keys[0].split("[")[1].split("]")[0])
        const annotationID = this.graphLayout.annotations[index].annotationID
        if (`annotations[${index}].ax` === k) {
          this.settings.settings.textAnnotation[annotationID].ax = data[k]
        } else if (`annotations[${index}].ay` === k) {
          this.settings.settings.textAnnotation[annotationID].ay = data[k]
        } else if (`annotations[${index}].text` === k) {
          this.settings.settings.textAnnotation[annotationID].text = data[k]
        }
      }
    } else if (keys[0].startsWith("shapes")) {
      for (const k of keys) {
        const index = parseInt(keys[0].split("[")[1].split("]")[0])
        const shape = this.settings.settings.volcanoAdditionalShapes[index]
        if (`shapes[${index}].x0` === k) {
          shape.x0 = data[k]
        } else if (`shapes[${index}].x1` === k) {
          shape.x1 = data[k]
        } else if (`shapes[${index}].y0` === k) {
          shape.y0 = data[k]
        } else if (`shapes[${index}].y1` === k) {
          shape.y1 = data[k]
        }
      }
      this.dataService.volcanoAdditionalShapesSubject.next(true)
    }
  }

  updateShapes(data: any[]) {
    for (const i of data) {
      this.settings.settings.volcanoAdditionalShapes[i.index].label = i.label
      this.settings.settings.volcanoAdditionalShapes[i.index].fillcolor = i.fillcolor
      this.settings.settings.volcanoAdditionalShapes[i.index].line.color = i.line.color
      this.settings.settings.volcanoAdditionalShapes[i.index].line.width = i.line.width
    }
    this.drawVolcano()
    console.log(this.graphLayout.shapes)
  }

  openColorByCategoryModal() {
    const ref = this.modal.open(ColorByCategoryModalComponent, {scrollable: true})
    ref.componentInstance.data = this.dataService.currentDF
    ref.componentInstance.primaryIDColumn = this.dataService.differentialForm.primaryIDs
    ref.componentInstance.comparisonCol = this.dataService.differentialForm.comparison
    ref.closed.subscribe((data: {column: string, categoryMap: {[key: string]: {count: number, color: string, primaryIDs: string[], comparison: string}}}) => {
      if (data) {
        console.log(data)
        for (const c in data.categoryMap) {
          if (!this.dataService.selectOperationNames.includes(c)) {
            this.dataService.selectOperationNames.push(c)
          }
          this.settings.settings.colorMap[c] = data.categoryMap[c].color
          for (const p of data.categoryMap[c].primaryIDs) {
            if (!this.dataService.selectedMap[p]) {
              this.dataService.selectedMap[p] = {}
            }
            this.dataService.selectedMap[p][c] = true

          }
          console.log(this.dataService.selectedMap)
        }

        this.drawVolcano()
      }
    })
  }

}
