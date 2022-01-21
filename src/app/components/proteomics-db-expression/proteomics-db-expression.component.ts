import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../service/data.service";
import {ProteomicsDbService} from "../../service/proteomics-db.service";
import {UniprotService} from "../../service/uniprot.service";

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

  geneName: string = ""

  @Input() set data(value: any) {
    this._data = value;
    if (this.uniprot.results.has(value)) {
      this.geneName = this.uniprot.results.get(value)["Gene names"]
    }
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
    margin: {l:300, r:50, t:50, b:50},
    height: 400,
    xaxis: {
      "title": "<b>Normalized Intensity</b>"
    },
    yaxis: {
      "title" : "<b>Sample Categories</b>",
      "type" : "category",
      "tickmode": "array",
      "tickvals": [],
      "tickfont": {
        "size": 17,
        "color": 'black'
      }
    }
  }
  constructor(public activeModal: NgbActiveModal, private dataService: DataService, private proteomicsDB: ProteomicsDbService, private uniprot: UniprotService) { }

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
              results.push({value: parseFloat(r["NORMALIZED_INTENSITY"]), name: r["TISSUE_NAME"]})
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
            this.graphLayout.height = 400 + 30*temp.y.length
            console.log(this.graphData)
          }
        }
      }
    })
  }
}
