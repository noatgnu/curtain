import { Component, OnInit } from '@angular/core';
import {GraphData} from "../../classes/graph-data";
import {DataFrame, IDataFrame} from "data-forge";
import {WebService} from "../../service/web.service";
import {DbStringService} from "../../service/db-string.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  g: GraphData = new GraphData()
  comparison: string[] = []
  selectedDF: IDataFrame = new DataFrame()
  selectedComparison: string = ""
  constructor(private webService: WebService, private dbstring: DbStringService, private route: ActivatedRoute) {
    this.webService.getFilter()
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params) {
        console.log(params)
        if (params["settings"]) {
          this.webService.getSettings(params["settings"])
        }
      }
    })
  }

  handleData(e: GraphData) {
    this.g = e
    if (this.g.processedCompLabel !== "") {
      this.comparison = this.g.processed.getSeries("comparison").distinct().bake().toArray()
    } else {
      this.comparison = ["Default"]
    }
    this.selectedComparison = this.comparison[0]
    this.selectedDF = this.g.processed.where(row => row.comparison === this.selectedComparison).bake()
  }

  selectComparison(e: Event) {
    e.stopPropagation()
    this.selectedDF = this.g.processed.where(row => row.comparison === this.selectedComparison).bake()
  }


}
