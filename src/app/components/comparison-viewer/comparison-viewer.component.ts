import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame, Series} from "data-forge";
import {GraphData} from "../../classes/graph-data";
import {DrawPack} from "../../classes/draw-pack";
import {DataService} from "../../service/data.service";
import {Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";
import {UniprotService} from "../../service/uniprot.service";

@Component({
  selector: 'app-comparison-viewer',
  templateUrl: './comparison-viewer.component.html',
  styleUrls: ['./comparison-viewer.component.css']
})
export class ComparisonViewerComponent implements OnInit {
  pCutOff: number = 0.00001
  logFCCutoff: number = 2
  upRegulated: IDataFrame = new DataFrame()
  downRegulated: IDataFrame = new DataFrame()

  _data: IDataFrame = new DataFrame()

  drawPack: DrawPack = new DrawPack()
  label: string[] = []
  searchType = "Gene names"
  proteins: string[] = []
  geneNames: string[] = []
  tableFilterModel: any = ""
  searchFilter(term: string) {
    if (this.searchType === "Gene names") {
      return this.geneNames.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
    } else {
      return this.proteins.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
    }
  }
  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilter(term))
    )
  @Input() set data(value: IDataFrame) {
    const genes = []
    for (const r of value) {
      genes.push(this.getGene(r.Proteins))
    }
    this._data = value
    this._data = this._data.withSeries("Gene names", new Series(genes)).bake()
    this.geneNames = this._data.getSeries("Gene names").distinct().bake().toArray()
    this.proteins = this._data.getSeries("Proteins").distinct().bake().toArray()
    this.downRegulated = this._data.where(row => row["logFC"] < 0).bake()
    this.upRegulated = this._data.where(row => row["logFC"] > 0).bake()

    this.drawPack = new DrawPack()
    this.drawPack.df = this._data
    this.drawPack.pCutOff = this.pCutOff
  }

  get data(): IDataFrame {
    return this._data
  }
  constructor(private uniprot: UniprotService, private dataService: DataService) {

  }

  ngOnInit(): void {
  }

  changeInput(e: Event) {
    e.stopPropagation()

    this.drawPack = new DrawPack()
    this.drawPack.df = this._data
    this.drawPack.pCutOff = this.pCutOff
    this.drawPack.logFCCutoff = this.logFCCutoff
  }

  getGene(protein: string) {
    if (this.uniprot.results.has(protein)) {
      return this.uniprot.results.get(protein)["Gene names"]
    } else {
      return ""
    }
  }

  findInData(e: Event) {
    this.dataService.searchService.next({term: this.tableFilterModel, type: this.searchType})
    e.stopPropagation()
    e.preventDefault()
  }

  clearAllSelected(e: Event) {
    this.dataService.clearAllSelected()
    e.stopPropagation()
    e.preventDefault()
  }
}
