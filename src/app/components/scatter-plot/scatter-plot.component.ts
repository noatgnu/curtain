import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {PlotlyService} from "angular-plotly.js";
import {DrawPack} from "../../classes/draw-pack";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css']
})
export class ScatterPlotComponent implements OnInit {
  graphData: any[] = []
  graphLayout: any = {title:"Volcano Plot", height: 1000, xaxis: {title: "Log2FC"}, yaxis: {title: "-log10(p-value)"}, annotations: []
    //xaxis:{"tickangle": 90}
  }
  pCutOff: number = 0.00001
  log2FCCutoff: number = 2
  _data: IDataFrame = new DataFrame();
  upSelected: any[] = []
  downSelected: any[] = []
  @Input() set data(value:DrawPack) {
    this._data = value.df
    this.pCutOff = value.pCutOff
    this.log2FCCutoff = value.logFCCutoff
    this.graphScatterPlot()
  }

  uniprotMap = new Map<string, any>()


  constructor(private plotly: PlotlyService, private uniprot: UniprotService, private dataService: DataService) {
    this.uniprotMap = uniprot.results
    this.dataService.annotationSelect.subscribe(data => {
      this.graphLayout.annotations = data
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
    if (Object.keys(group).length === 0) {

      for (const r of this._data) {
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
    } else {
      for (const r of this._data) {
        if (!(group[r.Samples] in temp)) {
          temp[group[r.Samples]] = {
            x: [], y: [], type: 'scatter', name: group[r.Samples], mode: 'markers'
          }
        }
        temp[group[r.Samples]].y.push(r.PCA2)
        temp[group[r.Samples]].x.push(r.PCA1)
      }
    }
    for (const t in temp) {
      this.graphData.push(temp[t])
    }
  }

  selectData(e: any) {
    if ("points" in e) {
      const ind = e["points"][0].text.indexOf("(")
      if (e["points"][0].text.indexOf("(") !== -1) {
        this.dataService.updateDataPointClick(e["points"][0].text.slice(ind+1, -1))
      } else {
        this.dataService.updateDataPointClick(e["points"][0].text)
      }
    }
  }

  plotUpdated(e: any) {
  }
}
