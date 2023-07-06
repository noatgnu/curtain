import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {UniprotService} from "../../uniprot.service";
import {WebService} from "../../web.service";
import {
  VolcanoPlotTextAnnotationComponent
} from "../volcano-plot-text-annotation/volcano-plot-text-annotation.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {RankPlotTextAnnotationComponent} from "../rank-plot-text-annotation/rank-plot-text-annotation.component";
import {VolcanoColorsComponent} from "../volcano-colors/volcano-colors.component";

@Component({
  selector: 'app-rank-plot',
  templateUrl: './rank-plot.component.html',
  styleUrls: ['./rank-plot.component.scss']
})
export class RankPlotComponent implements OnInit {
  _data: IDataFrame = new DataFrame()
  sortedDataMap: any = {}

  graphData: any[] = []
  graphLayout: any = {
    height: 700, width: 1000,
    yaxis: {title: "log2(Abundance)"},
    xaxis: {title: "Rank"},
    annotations: [],
    title: "Rank Abundance Plot",
    showlegend: true, legend: {
      orientation: 'h'
    }
  }
  config: any = {
    //modeBarButtonsToRemove: ["toImage"]
    toImageButtonOptions: {
      format: 'svg',
      filename: "rank-plot",
      height: this.graphLayout.height,
      width: this.graphLayout.width,
      scale: 1
    }
  }
  legendStatus: any = {}
  annotated: any = {}
  @Input() set data(value: IDataFrame) {
    const processed: any[] = []
    if (!this.settings.settings.legendStatus) {
      this.settings.settings.legendStatus = {}
    }
    if (!this.settings.settings.rankPlotColorMap) {
      this.settings.settings.rankPlotColorMap = {}
    }
    if (!this.settings.settings.rankPlotAnnotation) {
      this.settings.settings.rankPlotAnnotation = {}
    }
    for (const r of value) {
      const total: any = {}
      const countNotNull: any = {}
      const average: any = {}
      for (const s in this.dataService.sampleMap) {
        if (!total[this.dataService.sampleMap[s].condition]) {
          total[this.dataService.sampleMap[s].condition] = 0
          countNotNull[this.dataService.sampleMap[s].condition] = 0
        }
        if (r[s]) {
          total[this.dataService.sampleMap[s].condition] = total[this.dataService.sampleMap[s].condition] + r[s]
          countNotNull[this.dataService.sampleMap[s].condition] = countNotNull[this.dataService.sampleMap[s].condition] + 1
        }
      }
      for (const c in total) {
        if (total[c] !== 0) {
          average[c] = total[c]/countNotNull[c]
          average[c] = Math.log2(average[c])
        } else {
          average[c] = 0
        }
      }
      average[this.dataService.rawForm.primaryIDs] = r[this.dataService.rawForm.primaryIDs]
      processed.push(average)
    }
    this._data = new DataFrame(processed)
    for (const c of this._data.getColumnNames()) {
      if (c !== this.dataService.rawForm.primaryIDs) {
        this.sortedDataMap[c] = this._data.orderByDescending(a => a[c]).bake().resetIndex().bake()
      }
    }
    const annotationsIds: string[] = []

    for (const t in this.settings.settings.textAnnotation) {
      if (!(t in this.settings.settings.rankPlotAnnotation)) {
        annotationsIds.push(this.settings.settings.textAnnotation[t].primary_id)
      }
    }
    if (annotationsIds.length > 0) {
      this.annotateDataPoints(annotationsIds).then(() => {
        this.draw().then()
      })
    } else {
      this.draw().then()
    }
  }

  constructor(private web: WebService, public dataService: DataService, public settings: SettingsService, public uniprot: UniprotService, private modal: NgbModal) {
    this.dataService.selectionUpdateTrigger.asObservable().subscribe(data => {
      if (data) {
        this.draw().then()
      }
    })

    this.dataService.annotationService.asObservable().subscribe(data => {
      if (data) {
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

  async annotateDataPoints(data: string[]) {
    const annotations: any[] = []
    for (const i in this.sortedDataMap) {
      const annotatedData = this.sortedDataMap[i].where((r: any) => data.includes(r[this.dataService.rawForm.primaryIDs])).bake().toPairs()
      for (const a of annotatedData) {
        let title = a[1][this.dataService.rawForm.primaryIDs]
        const uni: any = this.uniprot.getUniprotFromPrimary(title)
        if (uni) {
          if (uni["Gene Names"] !== "") {
            title = uni["Gene Names"] + "(" + title + ")"
          }
        }
        if (!this.annotated[title]) {
          this.annotated[title] = {}
        }
        const ann: any = {
          xref: 'x',
          yref: 'y',
          x: a[0],
          y: a[1][i],
          text: `<b>${title} ${i}</b>`,
          showarrow: true,
          arrowhead: 1,
          arrowsize: 1,
          arrowwidth: 1,
          ax: -20,
          ay: -20,
          font: {
            size: 7,
            color: "#000000"
          },
          showannotation: true,
        }
        if (title in this.settings.settings.rankPlotAnnotation) {

        } else {
          this.settings.settings.rankPlotAnnotation[title] = {}

        }
        this.settings.settings.rankPlotAnnotation[title][i] = {
          primary_id: a[this.dataService.rawForm.primaryIDs],
          data: ann,
          title: title,
          condition: i
        }
        annotations.push(ann)
        this.annotated[title][i] = ann
      }
    }

    if (annotations.length > 0) {
      this.graphLayout.annotations = this.graphLayout.annotations.concat(annotations)
    }
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
        delete this.settings.settings.rankPlotAnnotation[title]
      }
    }
    this.graphLayout.annotations = Object.values(this.annotated)
  }

  ngOnInit(): void {
  }

  async draw() {
    const temp: any = {}
    let currentPosition = 0
    for (const i in this.sortedDataMap) {
      if (!this.settings.settings.rankPlotColorMap[i]) {
        this.settings.settings.rankPlotColorMap["Selected " + i] = this.settings.settings.defaultColorList[currentPosition]
      }
      currentPosition += 1
      if (currentPosition >= this.settings.settings.defaultColorList.length) {
        currentPosition = 0
      }
      if (!this.settings.settings.rankPlotColorMap[i]) {
        this.settings.settings.rankPlotColorMap[i] = this.settings.settings.defaultColorList[currentPosition]
      }
      currentPosition += 1
      if (currentPosition >= this.settings.settings.defaultColorList.length) {
        currentPosition = 0
      }
      // @ts-ignore
      const selected = this.sortedDataMap[i].where(r => this.dataService.selected.includes(r[this.dataService.rawForm.primaryIDs]))
      // @ts-ignore
      const notSelected = this.sortedDataMap[i].where(r => !this.dataService.selected.includes(r[this.dataService.rawForm.primaryIDs]))
      if (!(i in this.settings.settings.legendStatus)) {
        this.settings.settings.legendStatus[i] = true
      }
      if (selected.count() > 0) {
        if (!(("Selected "+ i) in this.settings.settings.legendStatus)) {
          this.settings.settings.legendStatus["Selected "+ i] = true
        }

        const text = selected.getSeries(this.dataService.rawForm.primaryIDs).toArray().map((a: string) => {
          const r: any = this.uniprot.getUniprotFromPrimary(a)
          if (r) {
            return r["Gene Names"] + " [" + a + "] " + i
          } else {
            return a + " " + i
          }
        })
        temp["Selected "+ i] = {
          x: selected.getIndex().toArray(),
          y: selected.getSeries(i).toArray(),
          text: text,
          type: "scattergl",
          mode: "markers",
          name: "Selected "+ i,
          marker: {
            size: 10,
            color: this.settings.settings.rankPlotColorMap["Selected "+ i]
          }
        }
        if (!this.settings.settings.legendStatus["Selected "+i]) {
          temp["Selected "+i]["visible"] = "legendonly"
        }
      }
      const text = notSelected.getSeries(this.dataService.rawForm.primaryIDs).toArray().map((a: string) => {
        const r: any = this.uniprot.getUniprotFromPrimary(a)
        if (r) {
          return r["Gene Names"] + " [" + a +"]"
        } else {
          return a
        }
      })
      temp[i] = {
        x: notSelected.getIndex().toArray(),
        y: notSelected.getSeries(i).toArray(),
        text: text,
        type: "scattergl",
        mode: "markers",
        name: i,
        opacity: 0.3,
        marker: {
          size: 5,
          color: this.settings.settings.rankPlotColorMap[i]
        }
      }
      if (!this.settings.settings.legendStatus[i]) {
        temp[i]["visible"] = "legendonly"
      }
    }
    const graphData: any[] = []
    for (const i in temp) {
      if (!i.startsWith("Selected")) {
        graphData.push(temp[i])
      }
    }
    for (const i in temp) {
      if (i.startsWith("Selected")) {
        graphData.push(temp[i])
      }
    }
    const annotations: any[] = []
    for (const i in this.settings.settings.rankPlotAnnotation) {
      for (const c in this.sortedDataMap) {
        if (this.settings.settings.rankPlotAnnotation[i][c]) {
          if (this.settings.settings.rankPlotAnnotation[i][c].data.showannotation) {
            annotations.push(this.settings.settings.rankPlotAnnotation[i][c]["data"])
          }
        }
      }
    }
    if (annotations.length > 0) {
      this.graphLayout.annotations = annotations
    }
    this.graphData = graphData
  }

  handleClick(e: any) {
    this.settings.settings.legendStatus[e.event.srcElement.__data__[0].trace.name] = !this.settings.settings.legendStatus[e.event.srcElement.__data__[0].trace.name]
  }

  hideAllSelected() {
    for (const l in this.settings.settings.legendStatus) {
      if (l.startsWith("Selected")) {
        this.settings.settings.legendStatus[l] = false
      }
    }
    this.draw().then()
  }

  hideAllNonSelected() {
    for (const l in this.settings.settings.legendStatus) {
      if (!l.startsWith("Selected")) {
        this.settings.settings.legendStatus[l] = false
      }
    }
    this.draw().then()
  }

  openTextEditor() {
    const ref = this.modal.open(RankPlotTextAnnotationComponent, {size: "xl", scrollable: true})
    ref.componentInstance.data = {annotation: this.settings.settings.rankPlotAnnotation}
    ref.closed.subscribe(data => {
      this.graphLayout.annotations = []
      this.annotated = {}
      for (const f of data) {
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.showarrow = f.value.showarrow
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.arrowhead = f.value.arrowhead
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.arrowsize = f.value.arrowsize
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.arrowwidth = f.value.arrowwidth
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.ax = f.value.ax
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.ay = f.value.ay
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.font.size = f.value.fontsize
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.font.color = f.value.fontcolor
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.text = f.value.text
        this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data.showannotation = f.value.showannotation
        this.annotated[f.value.id][f.value.condition]= this.settings.settings.rankPlotAnnotation[f.value.id][f.value.condition].data
        this.graphLayout.annotations.push(this.annotated[f.value.id][f.value.condition])
      }
      this.draw().then()
    })
  }

  openColorEditor() {
    const ref = this.modal.open(VolcanoColorsComponent, {scrollable: true})
    const groups = Object.keys(this.settings.settings.legendStatus).filter((a: string) => {
      return this.settings.settings.legendStatus[a]
    })
    const colorGroups:any[] = []
    groups.forEach((a: string) => {
      if (this.settings.settings.rankPlotColorMap[a]) {
        colorGroups.push({color: this.settings.settings.rankPlotColorMap[a], group: a, remove: false})
      }
    })
    ref.componentInstance.data = {colorGroups: colorGroups, groups: groups}
    ref.closed.subscribe(data => {
      for (const g of data) {
        if (this.settings.settings.rankPlotColorMap[g.group] !== g.color) {
          this.settings.settings.rankPlotColorMap[g.group] = g.color
        }
        if (g.remove) {
          delete this.settings.settings.rankPlotColorMap[g.group]
        }
      }
      this.draw().then()
    })
  }

  downloadSVG() {
    this.web.downloadPlotlyImage("svg", "rankplot", "rankplot").then()
  }
}
