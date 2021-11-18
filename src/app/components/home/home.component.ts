import { Component, OnInit } from '@angular/core';
import {GraphData} from "../../classes/graph-data";
import {DataFrame, IDataFrame, Series} from "data-forge";
import {WebService} from "../../service/web.service";
import {DbStringService} from "../../service/db-string.service";
import {ActivatedRoute} from "@angular/router";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  get selectedComparison(): string {
    return this._selectedComparison;
  }

  set selectedComparison(value: string) {
    this._selectedComparison = value;
    this.dataService.settings.currentComparison = value
  }

  g: GraphData = new GraphData()
  comparison: string[] = []
  selectedDF: IDataFrame = new DataFrame()
  private _selectedComparison: string = ""
  constructor(private webService: WebService, private dbstring: DbStringService, private route: ActivatedRoute, private uniprot: UniprotService, private dataService: DataService) {
    this.dataService.updateSettings.asObservable().subscribe(result => {
      this._selectedComparison = this.dataService.settings.currentComparison

    })
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
    console.log(this.comparison)
    console.log(this.selectedComparison)
    if (!(this.comparison.includes(this._selectedComparison))) {
      this._selectedComparison = this.comparison[0]
    }


    this.selectedDF = this.g.processed.where(row => row.comparison === this._selectedComparison).bake()

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

    this.selectedDF = this.g.processed.where(row => row.comparison === this._selectedComparison).bake()

  }


}
