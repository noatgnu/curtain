import { Component, OnInit } from '@angular/core';
import {GraphData} from "../../classes/graph-data";
import {DataFrame, IDataFrame, Series} from "data-forge";
import {WebService} from "../../service/web.service";
import {DbStringService} from "../../service/db-string.service";
import {ActivatedRoute} from "@angular/router";
import {UniprotService} from "../../service/uniprot.service";

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
  constructor(private webService: WebService, private dbstring: DbStringService, private route: ActivatedRoute, private uniprot: UniprotService) {
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
    const genes = []
    const subCel = []
    for (const r of this.g.processed) {
      const g = this.getGene(r["Primary IDs"])
      genes.push(g)
      const s = this.getSubLoc(r["Primary IDs"])
      subCel.push(s)
    }
    this.g.processed = this.g.processed.withSeries("Gene names", new Series(genes)).bake()
    this.g.processed = this.g.processed.withSeries("Subcellular locations", new Series(subCel)).bake()
    this.selectedComparison = this.comparison[0]

    this.selectedDF = this.g.processed.where(row => row.comparison === this.selectedComparison).bake()

  }
  getGene(protein: string) {
    if (this.uniprot.results.has(protein)) {
      return this.uniprot.results.get(protein)["Gene names"].slice()
    } else {
      return ""
    }
  }

  getSubLoc(protein: string) {
    if (this.uniprot.results.has(protein)) {
      return this.uniprot.results.get(protein)["Subcellular location [CC]"]
    } else {
      return ""
    }
  }
  selectComparison(e: Event) {
    e.stopPropagation()

    this.selectedDF = this.g.processed.where(row => row.comparison === this.selectedComparison).bake()

  }


}
