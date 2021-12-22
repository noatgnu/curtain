import { Component, OnInit } from '@angular/core';
import {GraphData} from "../../classes/graph-data";
import {DataFrame, IDataFrame, Series} from "data-forge";
import {WebService} from "../../service/web.service";
import {DbStringService} from "../../service/db-string.service";
import {ActivatedRoute} from "@angular/router";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import {Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";
import {NotificationService} from "../../service/notification.service";

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
    this.dataService.settings.dataColumns.comparison = value
  }
  selectedProteinModel: string = ""
  selectedProtein: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
  text$.pipe(
    debounceTime(200),
  distinctUntilChanged(),
  map(term => term.length < 2 ? []
    : this.searchFilter(term))
  )

  searchType: string = "Gene names"

  searchFilter(term: string) {
    console.log(term)
    switch (this.searchType) {
      case "Primary IDs":
        return this.dataService.allSelected.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Gene names":
        return this.dataService.allSelectedGenes.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      default:
        return [""]
    }

  }
  g: GraphData = new GraphData()
  comparison: string[] = []
  selectedDF: IDataFrame = new DataFrame()
  private _selectedComparison: string = ""
  constructor(private webService: WebService, private dbstring: DbStringService, private route: ActivatedRoute, private uniprot: UniprotService, public dataService: DataService, private notification: NotificationService) {
    this.webService.getFilter()
  }

  enableQuickNav: boolean = true;
  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params) {
        console.log(params)
        if (params["settings"]) {
          this.webService.getSettings(params["settings"])
          this.dataService.unique_id = params["settings"]
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

    if ((this.comparison.includes(this.g.comparison))) {
      this._selectedComparison = this.g.comparison
    } else {
      this.selectedComparison = this.comparison[0]
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

  browseTo() {
    let acc = ""
    if (this.searchType === "Gene names") {
      const ind = this.dataService.allSelectedGenes.indexOf(this.selectedProteinModel)
      if (ind > -1) {
        acc = this.dataService.allSelected[ind]
      }
    } else {
      acc = this.selectedProteinModel
    }

    const e = document.getElementById(acc+"id")
    console.log(e)
    if (e) {
      e.scrollIntoView()
    }
  }

  browseToInd(next: boolean) {
    let nextPosition;
    const currentPosition = this.dataService.allSelected.indexOf(this.dataService.currentBrowsePosition)
    if (next) {
      if (currentPosition + 1 < this.dataService.allSelected.length) {
        nextPosition = currentPosition + 1
      }
    } else {
      if (currentPosition - 1 >= 0) {
        nextPosition = currentPosition - 1
      }
    }
    if (nextPosition!==undefined) {
      const acc = this.dataService.allSelected[nextPosition]
      const e = document.getElementById(acc+"id")
      if (e) {
        e.scrollIntoView()
      }
    }

  }

  copyLink() {
    navigator.clipboard.writeText(location.origin +"/#/"+ this.dataService.unique_id).then(
      result => {
        this.notification.show("Unique link has been copied to clipboard", {delay: 1000})
      }
    )
  }
}
