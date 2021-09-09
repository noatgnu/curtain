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
  graphLayout: any = {title:"", height: 500,
    xaxis: {
      "title" : "Samples",
      "tickmode": "array",
      //"categoryorder" : "array",
      //"categoryarray": [],
      "tickvals": [],
      "ticktext": []
    },
    yaxis: {
      "title" : "Intensity"
    }
    //xaxis:{"tickangle": 90}
  }
  _data: IDataFrame = new DataFrame()
  uniprotMap = new Map<string, any>()
  @Input() set data(value: IDataFrame) {
    this.drawBarChart(value);
    this._data = value
  }

  private drawBarChart(value: IDataFrame<number, any>) {
    this.graphData = []
    //this.graphLayout.xaxis.categoryarray = []
    this.graphLayout.xaxis.ticktext = []
    this.graphLayout.xaxis.tickvals = []
    const temp: any = {}

    for (const r of value) {
      let protein = r.Proteins
      if (this.uniprotMap.has(protein)) {
        protein = this.uniprotMap.get(protein)["Gene names"] + "(" + protein + ")"
        this.title = protein
      }
      this.graphLayout.title = protein
      for (const c of value.getColumnNames()) {
        if (this.dataService.sampleColumns.includes(c)) {
          let visible: any = true
          const name = this.getHighlighted(c)
          if (name !== ""){
            if (this.legendHideList.includes(name)) {
              visible = "legendonly"
            }
            if (!(name in temp)) {
              temp[name] = {
                x: [], y: [],
                type: 'bar',
                name: name,
                visible: visible
              }
            }
            temp[name].x.push(c)

            //this.graphLayout.xaxis.categoryarray.push(c)
            temp[name].y.push(r[c])
          }
        }
      }
    }

    for (const t in temp) {
      this.graphData.push(temp[t])
      this.graphLayout.xaxis.tickvals.push(temp[t].x[1])
      this.graphLayout.xaxis.ticktext.push(t)
    }
  }
  title: string = ""
  constructor(private plotly: PlotlyService, private uniprot: UniprotService, private dataService: DataService) {
    this.uniprotMap = this.uniprot.results
    this.dataService.titleGraph.asObservable().subscribe(data => {
      this.graphLayout.title = data + "<br>" + this.title
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
      const group = name.split(".")
      return group[0]
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
