import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, fromJSON, IDataFrame, Series} from "data-forge";
import {GraphData} from "../../classes/graph-data";
import {DrawPack} from "../../classes/draw-pack";
import {DataService} from "../../service/data.service";
import {BehaviorSubject, Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";
import {UniprotService} from "../../service/uniprot.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../service/web.service";
import {DbStringService} from "../../service/db-string.service";

@Component({
  selector: 'app-comparison-viewer',
  templateUrl: './comparison-viewer.component.html',
  styleUrls: ['./comparison-viewer.component.css']
})
export class ComparisonViewerComponent implements OnInit {
  closeResult = ""
  selectionTitle = ""
  pCutOff: number = 0.00001
  logFCCutoff: number = 2
  upRegulated: IDataFrame = new DataFrame()
  downRegulated: IDataFrame = new DataFrame()

  _data: IDataFrame = new DataFrame()
  @Input() intensityData: IDataFrame = new DataFrame()
  drawPack: DrawPack = new DrawPack()
  label: string[] = []
  searchType: "Gene names"|"Proteins"|"Subcellular locations" = "Gene names"
  proteins: string[] = []
  geneNames: string[] = []
  subLoc: string[] = []
  tableFilterModel: any = ""
  entryToProtein: Map<string, string> = new Map<string, string>()
  dbstringUp: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  dbstringDown: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  searchFilter(term: string) {
    switch (this.searchType) {
      case "Gene names":
        return this.geneNames.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Proteins":
        return this.proteins.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Subcellular locations":
        return this.subLoc.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      default:
        return [""]
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
    const subCel = []
    for (const r of value) {
      genes.push(this.getGene(r.Proteins))
      const s = this.getSubLoc(r.Proteins)
      for (const i of s) {
        if (!this.subLoc.includes(i)) {
          this.subLoc.push(i)
        }
      }
      subCel.push(s)
    }
    this._data = value
    this._data = this._data.withSeries("Gene names", new Series(genes)).bake()
    this._data = this._data.withSeries("Subcellular locations", new Series(subCel)).bake()
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

  interactionAnalysisObs = new Observable<boolean>()

  constructor(private modalService: NgbModal, private uniprot: UniprotService, private dataService: DataService, private web: WebService, private dbstring: DbStringService) {
    this.interactionAnalysisObs = this.dbstring.interactionAnalysis.asObservable()
    this.dbstring.dbstringIDRunStatus.asObservable().subscribe(data=> {
      if (data) {
        const sea: string[] = []
        for (const u of this.dataService.allSelected) {
          if (this.uniprot.results.has(u)) {
            sea.push(this.dbstring.stringMap.get(this.uniprot.results.get(u)["Entry name"])["stringId"])
            console.log(sea)
            this.dbstring.reverseStringMap.set(this.dbstring.stringMap.get(this.uniprot.results.get(u)["Entry name"])["stringId"], u)
            console.log(this.dbstring.reverseStringMap)
          }
        }
        this.dbstring.getInteractingPartners(sea, this.uniprot.organism)
      }
    })
  }

  startBatchSelection(content: any) {
    this.modalService.open(content, {ariaLabelledBy: "batch-selection-title", size: "xl"}).result.then((result) => {
      console.log(this.closeResult)
    })
  }

  viewProfile(content: any) {
    this.modalService.open(content, {ariaLabelledBy: "profile-plot", windowClass: "max-modal"}).result.then((result) => {

    })
  }

  viewInteraction(content: any) {
    this.modalService.open(content, {ariaLabelledBy: "profile-plot", size: 'xl'}).result.then((result) => {

    })
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

  getSubLoc(protein: string) {
    if (this.uniprot.results.has(protein)) {
      return this.uniprot.results.get(protein)["Subcellular location [CC]"]
    } else {
      return ""
    }
  }

  findInData(e: Event) {
    this.dataService.searchService.next({term: [this.tableFilterModel], type: this.searchType})
    e.stopPropagation()
    e.preventDefault()
  }

  clearAllSelected(e: Event) {
    this.dataService.clearAllSelected()
    e.stopPropagation()
    e.preventDefault()
  }

  getFilter(a: string) {
    this.closeResult = this.web.filters[a].join("\n")
    this.selectionTitle = a
  }

  batchSelect(content: any) {
    content.close()
    const data = []
    for (const r of this.closeResult.split("\n")) {
      const a = r.trim()
      const e = a.split(";")
      let selected = false
      for (const f of e) {
        switch (this.searchType) {
          case "Gene names":
            for (const b of this.geneNames) {
              const c = b.split(";")
              for (const d of c) {
                if (f === d) {
                  selected = true
                  data.push(b)
                  break
                }
              }
            }
            break
          case "Proteins":
            for (const b of this.proteins) {
              const c = b.split(";")
              for (const d of c) {
                if (f === d) {
                  selected = true
                  data.push(b)
                  break
                }
              }
            }
            break
          default:
            break
        }
        if (selected) {
          break
        }
      }

    }
    this.dataService.batchSelection(this.selectionTitle, this.searchType, data)
  }

  runDBStringAnalysis(){
    //this.dbstring.dbstringIDRunStatus.next(false)
    this.dbstring.interactionAnalysis.next(false)
    const data_up: string[] = []
    if (this.dataService.allSelected.length > 0) {
      for (const u of this.dataService.allSelected) {
        if (this.uniprot.results.has(u)) {
          for (const c of this.uniprot.results.get(u)["Cross-reference (STRING)"].split(";")) {
            if (c !== "") {
              this.dbstring.reverseStringMap.set(c, u)
              data_up.push(c)
            }
          }
        }
      }
      if (data_up.length > 150) {
        this.dbstring.getInteractingPartners(data_up, this.uniprot.organism)
      } else {
        this.dbstring.getInteractingPartnersNoProxy(data_up, this.uniprot.organism)
      }

    }
  }

}
