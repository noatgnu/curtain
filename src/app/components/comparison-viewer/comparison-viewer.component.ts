import {AfterViewInit, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DataFrame, fromJSON, IDataFrame, Series} from "data-forge";
import {GraphData} from "../../classes/graph-data";
import {DrawPack} from "../../classes/draw-pack";
import {DataService} from "../../service/data.service";
import {BehaviorSubject, Observable, OperatorFunction, Subscription} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";
import {UniprotService} from "../../service/uniprot.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../service/web.service";
import {DbStringService} from "../../service/db-string.service";
import {NotificationService} from "../../service/notification.service";

@Component({
  selector: 'app-comparison-viewer',
  templateUrl: './comparison-viewer.component.html',
  styleUrls: ['./comparison-viewer.component.css']
})
export class ComparisonViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  closeResult = ""
  selectionTitle = ""
  pCutOff = this.dataService.settings.pCutOff
  logFCCutoff = this.dataService.settings.logFCCutOff
  upRegulated: IDataFrame = new DataFrame()
  downRegulated: IDataFrame = new DataFrame()

  _data: IDataFrame = new DataFrame()
  @Input() intensityData: IDataFrame = new DataFrame()
  drawPack: DrawPack = new DrawPack()
  label: string[] = []
  searchType: "Gene names"|"Primary IDs"|"Subcellular locations" = "Gene names"
  primaryIDs: string[] = []
  geneNames: string[] = []
  subLoc: string[] = []
  tableFilterModel: any = ""
  entryToProtein: Map<string, string> = new Map<string, string>()
  dbstringUp: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  searchFilter(term: string) {
    switch (this.searchType) {
      case "Gene names":
        return this.geneNames.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Primary IDs":
        return this.primaryIDs.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
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
    this._data = value
    this.geneNames = this._data.getSeries("Gene names").distinct().bake().toArray()
    this.subLoc = this._data.getSeries("Subcellular locations").distinct().bake().toArray()
    this.primaryIDs = this._data.getSeries("Primary IDs").distinct().bake().toArray()
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
  enableUniprot: boolean = false
  initialSearch: Subscription | undefined
  constructor(private modalService: NgbModal, private uniprot: UniprotService, public dataService: DataService, private web: WebService, private dbstring: DbStringService, private notification: NotificationService) {
    this.enableUniprot = this.uniprot.fetched
    this.interactionAnalysisObs = this.dbstring.interactionAnalysis.asObservable()
    this.dbstring.dbstringIDRunStatus.asObservable().subscribe(data=> {
      if (data) {
        this.notification.show("Completed DB-String analysis", {className: "bg-success text-light", delay: 5000})
        if (this.uniprot.fetched) {
          const sea: string[] = []
          this.dataService.settings.dbString = true
          for (const u of this.dataService.allSelected) {
            if (this.uniprot.results.has(u)) {
              sea.push(this.dbstring.stringMap.get(this.uniprot.results.get(u)["Entry name"])["stringId"])
              this.dbstring.reverseStringMap.set(this.dbstring.stringMap.get(this.uniprot.results.get(u)["Entry name"])["stringId"], u)
            }
          }
          this.dbstring.getInteractingPartners(sea, this.uniprot.organism)
        }
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

  ngAfterViewInit() {
    this.initialSearch = this.dataService.initialBatchSelection.subscribe(data => {
      if (data) {
        for (const k in this.dataService.initialSearch) {
          this.dataService.batchSelection(k, "Primary IDs", this.dataService.initialSearch[k], true)
        }
      }
    })
  }

  ngOnDestroy() {
    this.initialSearch?.unsubscribe()
  }

  changeInput(e: Event) {
    e.stopPropagation()
    this.dataService.settings.pCutOff = this.pCutOff
    this.dataService.settings.logFCCutOff = this.logFCCutoff
    this.drawPack = new DrawPack()
    this.drawPack.df = this._data
    this.drawPack.pCutOff = this.pCutOff
    this.drawPack.logFCCutoff = this.logFCCutoff

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

  findInData(e: Event) {
    e.stopPropagation()
    e.preventDefault()
    this.dataService.searchService.next({term: [this.tableFilterModel], type: this.searchType})
  }

  clearAllSelected(e: Event) {
    this.dataService.clearAllSelected()
    e.stopPropagation()
    e.preventDefault()
  }

  clearSpecificSelected(e: Event, title: string) {
    this.dataService.clearSpecificSelected(title)
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
      for (let f of e) {
        f = f.trim()
        if (f !== "") {
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
            case "Primary IDs":
              for (const b of this.primaryIDs) {
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

    }
    this.dataService.batchSelection(this.selectionTitle, this.searchType, data)
  }

  runDBStringAnalysis(){
    //this.dbstring.dbstringIDRunStatus.next(false)
    if (this.uniprot.fetched) {
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
        this.notification.show("Performing DB-String interaction analysis for " + data_up.length + " proteins", {delay: 1000})
        this.dbstring.getInteractingPartners(data_up, this.uniprot.organism)
      }
    }
  }

}
