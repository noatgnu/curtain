import { Component } from '@angular/core';
import {GraphData} from "./classes/graph-data";
import {DataFrame, IDataFrame} from "data-forge";
import {parse} from "@angular/compiler/src/render3/view/style_parser";
import {WebService} from "./service/web.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'curtain';
  g: GraphData = new GraphData()
  comparison: string[] = []
  selectedDF: IDataFrame = new DataFrame()
  selectedComparison: string = ""
  constructor(private webService: WebService) {
    this.webService.getFilter()
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
