import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import {PlotlyService} from "angular-plotly.js";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  graphData: any[] = []
  graphLayout: any = {title:"", height: 500,
    //xaxis:{"tickangle": 90}
  }
  _data: IDataFrame = new DataFrame()
  title = ""
  uniprotMap = new Map<string, any>()
  @Input() set data(value: IDataFrame) {
    this.drawBarChart(value);
    this._data = value
  }

  private drawBarChart(value: IDataFrame<number, any>) {
    this.graphData = []
    const temp: any = {}

    for (const r of value) {
      let protein = r.Proteins
      if (this.uniprotMap.has(protein)) {
        protein = this.uniprotMap.get(protein)["Gene names"] + "(" + protein + ")"
        this.title = protein
      }

      this.graphLayout.title = protein

      console.log(this.dataService.sampleColumns)
      for (const c of value.getColumnNames()) {
        if (this.dataService.sampleColumns.includes(c)) {

          const name = this.getHighlighted(c)
          if (!(name in temp)) {
            temp[name] = {
              x: [], y: [],
              type: 'bar',
              name: name
            }
          }
          temp[name].x.push(c)
          temp[name].y.push(r[c])
        }
      }
    }
    for (const t in temp) {
      this.graphData.push(temp[t])
    }
  }

  constructor(private plotly: PlotlyService, private uniprot: UniprotService, private dataService: DataService) {
    this.uniprotMap = this.uniprot.results
  }

  ngOnInit(): void {

  }

  async downloadPlotlyExtra(format: string) {
    const graph = this.plotly.getInstanceByDivId(this.graphLayout.title + "id");
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, filename: "image"})

  }

  highlighted: string[] = []

  highlightBar(e: any) {
    if (this.highlighted.includes(e.points[0].label)) {
      const ind = this.highlighted.indexOf(e.points[0].x)
      this.highlighted.splice(ind, 1)
    } else {
      this.highlighted.push(e.points[0].x)
    }
    this.drawBarChart(this._data)
  }

  getHighlighted(name: string) {
    if (this.highlighted.includes(name)) {
      return "Highlighted"
    } else {
      const group = name.split(".")
      return group[0]
    }
  }

}
