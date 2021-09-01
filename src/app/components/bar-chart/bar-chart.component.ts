import {Component, Input, OnInit} from '@angular/core';
import {IDataFrame} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";

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
  uniprotMap = new Map<string, any>()
  @Input() set data(value: IDataFrame) {
    const temp: any = {}

    for (const r of value) {
      console.log(r)
      let protein = r.Proteins
      if (this.uniprotMap.has(protein)) {
        protein = this.uniprotMap.get(protein)["Gene names"] + "(" + protein + ")"
      }

      this.graphLayout.title = protein

      console.log(this.dataService.sampleColumns)
      for (const c of value.getColumnNames()) {
        if (this.dataService.sampleColumns.includes(c)) {
          const group = c.split(".")
          if (!(group[0] in temp)) {
            temp[group[0]] = {x: [], y: [],
              type: 'bar',
              name: group[0]
            }
          }
          temp[group[0]].x.push(c)
          temp[group[0]].y.push(r[c])
        }
      }
    }
    console.log(temp)
    for (const t in temp) {
      this.graphData.push(temp[t])
    }
  }
  constructor(private uniprot: UniprotService, private dataService: DataService) {
    this.uniprotMap = this.uniprot.results
  }

  ngOnInit(): void {

  }

}
