import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../service/data.service";
import {ProteomicsDbService} from "../../service/proteomics-db.service";

@Component({
  selector: 'app-proteomics-db-expression',
  templateUrl: './proteomics-db-expression.component.html',
  styleUrls: ['./proteomics-db-expression.component.css']
})
export class ProteomicsDbExpressionComponent implements OnInit {
  get data(): any {
    return this._data;
  }

  private _data: any = {}

  @Input() set data(value: any) {
    this._data = value;
    this.getExpression()
  }

  graphData: any[] = []
  graphLayout: any = {
    title: {
      text: "",
      font: {
        family: "Arial Black",
        size: 24,
      }
    },
    margin: {l:200, r:50, t:50, b:50},
    height: 400,
    xaxis: {
      "title": "<b>Unnormalized Intensity</b>"
    },
    yaxis: {
      "title" : "<b>Sample Categories</b>",
      "type" : "category",
      "tickmode": "array",
      "tickvals": []
    }
  }
  constructor(public activeModal: NgbActiveModal, private dataService: DataService, private proteomicsDB: ProteomicsDbService) { }

  ngOnInit(): void {
  }

  getExpression() {
    this.proteomicsDB.getExpression(this.data).subscribe(data => {
      this.graphData = []
      this.graphLayout.yaxis.tickvals = []
      if (data.body) {
        // @ts-ignore
        if (data.body["d"]) {
          // @ts-ignore
          if (data.body["d"]["results"]) {
            const x: any = []
            const y: any = []

            const results: any[] = []
            // @ts-ignore
            for (const r of data.body["d"]["results"] ) {
              results.push({value: parseFloat(r["UNNORMALIZED_INTENSITY"]), name: r["TISSUE_NAME"]})
            }
            results.sort((a, b) => (a.value > b.value) ? 1: -1)
            for (const r of results) {
              x.push(r.value)
              y.push(r.name)
            }
            const temp: any = {
              type: "bar",
              x: x,
              y: y,
              orientation: "h"
            }
            this.graphData = [temp]
            this.graphLayout.yaxis.tickvals = temp.y
            this.graphLayout.height = 400 + 50*temp.y.length
            console.log(this.graphData)
          }
        }
      }
    })
  }
}
