import { Component, OnInit } from '@angular/core';
import {DataService} from "../../data.service";
import {JeezyService} from "../../jeezy.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastService} from "../../toast.service";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-correlation-matrix',
  templateUrl: './correlation-matrix.component.html',
  styleUrls: ['./correlation-matrix.component.scss']
})
export class CorrelationMatrixComponent implements OnInit {
  graphData: any[] = []
  graphLayout: any = {
    title: "Correlation Matrix",
    xaxis: {
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickvals: [],
      ticktext: []
    },
    height: 1100, width: 1100
  }
  cols: string[] = []
  constructor(private web: WebService, private toast: ToastService, public modal: NgbActiveModal, private data: DataService, private jz: JeezyService) {
    this.cols = Object.keys(this.data.sampleMap)

    this.graphData.push({
      z: this.calculateCorrelation(),
      x: this.cols,
      y: this.cols,
      type: 'heatmap',
      colorscale: [
        [0, "rgb(255,138,174)"],
        [0.33, "rgb(255,178,166)"],
        [0.66, "rgb(255,248,154)"],
        [1, "rgb(154,220,255)"]
      ]
    })


    this.graphLayout.xaxis.tickvals = this.cols
    this.graphLayout.xaxis.ticktext = this.cols
    this.graphLayout.yaxis.tickvals = this.cols
    this.graphLayout.yaxis.ticktext = this.cols
  }

  ngOnInit(): void {
  }

  calculateCorrelation() {
    this.toast.show("Correlation Matrix", "Calculating Pearson Correlation").then()
    const da: any[] = []
    let currentRow = 0
    for (const r of this.data.raw.df) {
      const row: any = {index:currentRow}
      for (const col of this.cols) {
        if (isNaN(r[col])) {
          row[col] = 0
        } else {
          row[col] = r[col]
        }
      }
      currentRow ++
      da.push(row)
    }
    const res = this.jz.calculateCorrMaxtrix(da, this.cols)
    const result: any = {}
    for (const r of res) {
      if (!result[r.column_x]) {
        result[r.column_x] = {}
      }
      result[r.column_x][r.column_y] = r.correlation
    }
    this.toast.show("Correlation Matrix", "Reformatting Correlation for Heatmap").then()

    const data: number[][] = []
    for (const c of this.cols) {
      const d: number[] = []
      if (result[c]) {
        for (const c2 of this.cols) {
          d.push(result[c][c2])
        }
      }
      data.push(d)
    }
    return data
  }

  downloadPlot() {
    this.web.downloadPlotlyImage('svg', 'correlation-matrix', 'correlationMatrix')
  }
}
