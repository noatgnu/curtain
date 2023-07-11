import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-selected-data-distribution-plot',
  templateUrl: './selected-data-distribution-plot.component.html',
  styleUrls: ['./selected-data-distribution-plot.component.scss']
})
export class SelectedDataDistributionPlotComponent implements OnInit {
  graphData: any[] = []
  graphLayoutViolin: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: [],
      title: "<b>Selection Titles</b>",
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      title: "<b>Log2 Fold Change</b>",
    },
    margin: {r: 40, l: 40, b: 120, t: 100}
  }
  constructor(private data: DataService, private settings: SettingsService, private modal: NgbActiveModal) {
    this.drawPlot()
  }

  ngOnInit(): void {
  }

  drawPlot() {
    const temp: any = {}
    const tickVals: any[] = []
    const tickText: any[] = []
    for (const r of this.data.differential.df) {
      if (r[this.data.differentialForm.primaryIDs] in this.data.selectedMap) {
        for (const s of this.data.selectOperationNames) {
          if (this.data.selectedMap[r[this.data.differentialForm.primaryIDs]][s]) {
            if (!temp[s]) {
              temp[s] = {
                type: 'violin',
                x: [],
                //y: graph[g].filter((d: number) => !isNaN(d)),
                y: [],
                points: "all",
                box: {
                  visible: true
                },
                meanline: {
                  visible: true
                },
                line: {
                  color: "black"
                },
                marker: {
                  color: this.settings.settings.colorMap[s],
                },
                fillcolor: this.settings.settings.colorMap[s],
                name: s,
                showlegend: false,
                spanmode: 'soft'
              }

            }
            temp[s].x.push(s)
            temp[s].y.push(r[this.data.differentialForm.foldChange])
          }
        }
      }
    }
    const graph: any[] = []
    for (const s in temp) {
      if (temp[s].y.length > 0) {
        graph.push(temp[s])
        tickVals.push(s)
        tickText.push(s)
      }
    }
    this.graphData = graph
    this.graphLayoutViolin.xaxis.tickvals = tickVals
    this.graphLayoutViolin.xaxis.ticktext = tickText
  }

  config: any = {
    //modeBarButtonsToRemove: ["toImage"]
    toImageButtonOptions: {
      format: 'svg',
      filename: 'selected_data_distribution_plot',
      height: this.graphLayoutViolin.height,
      width: this.graphLayoutViolin.width,
      scale: 1
    }
  }

  close() {
    this.modal.dismiss()
  }
}
