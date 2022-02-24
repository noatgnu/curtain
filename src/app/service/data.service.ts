import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject, Subscription} from "rxjs";
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "./uniprot.service";
import {BackEasingFactory} from "d3";
import {Settings} from "../classes/settings";
import {NotificationService} from "./notification.service";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  colorMap: any = {}
  geneToPrimaryMap: Map<string, string> = new Map<string, string>()
  initialSearch: any = {}
  noChange: string[] = []
  decrease: string[] = []
  increase: string[] = []
  allPages: any[] = []
  get currentBrowsePosition(): string {
    return this._currentBrowsePosition;
  }

  set currentBrowsePosition(value: string) {
    this._currentBrowsePosition = value;
    this.currentPositionIndex = this.allSelected.indexOf(value)
  }
  private _currentBrowsePosition: string = ""
  currentPositionIndex: number = -1
  rawFile: string = ""
  processedFile: string = ""
  comparisonSubject: BehaviorSubject<IDataFrame> = new BehaviorSubject<IDataFrame>(new DataFrame())
  dataPointClickService: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
  tableSelect: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([])
  annotationSelect: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([])
  searchService: BehaviorSubject<any> = new BehaviorSubject<any>(null)
  clearService: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)
  clearSpecificService: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)
  changePageService: Subject<any> = new Subject<any>();
  annotations: any[] = []
  upRegSelected: string[] = []
  downRegSelected: string[] = []
  allSelected: string[] = []
  allSelectedGenes: string[] = []
  sampleColumns: string[] = []
  batchSelectionService: BehaviorSubject<any> = new BehaviorSubject<any>({})
  titleGraph: BehaviorSubject<string> = new BehaviorSubject<string>("")
  barChartSampleLabels: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  barChartSampleUpdateChannel: BehaviorSubject<string> = new BehaviorSubject<string>("")
  barChartKeys: string[] = []
  relabelSamples: any = {}
  rawIdentifier: string = ""
  processedIdentifier: string = ""
  settings: Settings = new Settings()
  settingsSave: Subject<boolean> = new Subject<boolean>()
  updateSettings: Subject<boolean> = new Subject<boolean>()
  unique_id: string = ""
  selectionMap: Map<string, string[]> = new Map<string, string[]>()
  currentSelection: string = ""
  initialBatchSelection: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  downloadCurrentSelectedDataComparison: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  annotated: any = {}
  constructor(private uniprot: UniprotService, private notification: NotificationService) {
    this.barChartSampleUpdateChannel.asObservable().subscribe(key => {
      this.updateBarChartKey(key)
    })
  }

  updateComparison(data: IDataFrame) {
    this.comparisonSubject.next(data)
  }

  updateDataPointClick(data: string[]) {
    this.dataPointClickService.next(data)
  }
  updateSelected(value: string[], title: string = "") {

    const all: string[] = this.allSelected.slice()
    for (const v of value) {
      if (!this.allSelected.includes(v)) {
        all.push(v)
      }
    }

    const a: string[] = []
    this.allSelected = all
    if (title !== "") {
      for (const p of value) {
        if (!this.selectionMap.has(p)) {
          this.selectionMap.set(p, [])
        }
        const s = this.selectionMap.get(p)
        if (s !== undefined) {
          // @ts-ignore
          if (s.indexOf(title) === -1) {
            // @ts-ignore
            s.push(title)
            this.selectionMap.set(p, s)
          }
        }
      }
    }

    for (const p of this.allSelected) {
      if (this.uniprot.results.has(p)) {
        a.push(this.uniprot.results.get(p)["Gene names"])
      } else {
        a.push("")
      }
    }
    this.allSelectedGenes = a
    console.log(this.allSelected)
  }

  search: any = {}

  private selectedDataAnnotate(data: any[], up: boolean, annotate: boolean, title: string = "") {
    console.log(data)
    const arr: string[] = []
    if (!(title in this.search)) {
      this.search[title] = []
    }

    for (const d of data) {
      arr.push(d["Primary IDs"])
      if (title === "Selected") {
        if (!this.search[title].includes(d["Primary IDs"])) {
          this.search[title].push(d["Primary IDs"])
        }
      }
    }

    if (title !== "Selected") {
      this.search[title] = arr
    }

    let setForKeep = []
    let setForRemove = []
    if (!up) {
      setForKeep = this.downRegSelected.filter(item => arr.includes(item))
      setForRemove = this.downRegSelected.filter(item => !arr.includes(item))
      this.downRegSelected = setForKeep
    } else {
      setForKeep = this.upRegSelected.filter(item => arr.includes(item))
      setForRemove = this.upRegSelected.filter(item => !arr.includes(item))
      this.upRegSelected = setForKeep
    }

    const annotations = []
    for (const a of this.annotations) {
      const ind = a.text.indexOf("(")
      let primaryIDs = a.text
      if (a.text.indexOf("(") !== -1) {
        primaryIDs = a.text.slice(ind+1, -1)
      }
      if (!setForRemove.includes(primaryIDs)) {
        annotations.push(a)
      }
    }

    for (const d of data) {
      if (!setForKeep.includes(d["Primary IDs"])) {

        if (annotate) {
          this.annotated[d["Primary IDs"]] = d
        }

        if (up) {
          this.upRegSelected.unshift(d["Primary IDs"])
        } else {
          this.downRegSelected.unshift(d["Primary IDs"])
        }
      }
    }

    for (const a in this.annotated) {
      let t = a
      if (this.uniprot.results.has(t)) {
        t = this.uniprot.results.get(t)["Gene names"] + "(" + t + ")"
      }
      annotations.push({
        xref: 'x',
        yref: 'y',
        x: this.annotated[a].logFC,
        y: -Math.log10(this.annotated[a].pvalue),
        text: "<b>"+t+"</b>",
        showarrow: true,
        arrowhead: 0.5,
        font: {
          size: 15
        }
      })
    }

    if (up) {
      this.updateSelected(this.search[title], title)
    } else {
      this.updateSelected(this.search[title], title)
    }

    this.annotations = annotations
    this.annotationSelect.next(this.annotations)
  }

  updateRegTableSelect(table: string, data: any[], annotate: boolean, title: string = "") {
    console.log(data)
    if (table==="up") {
      this.notification.show("Selected " + data.length + " from Up-regulated datasets", {delay: 1000})
      this.selectedDataAnnotate(data, true, annotate, title)
      //this.upRegTableSelect.next(data)
    } else {
      this.notification.show("Selected " + data.length + " from Down-regulated datasets", {delay: 1000})
      this.selectedDataAnnotate(data, false, annotate, title)
      //this.downRegTableSelect.next(data)
    }
  }

  clearAllSelected() {
    this.clearService.next(true)
    this.allSelected = []
    this.allSelectedGenes = []
    this.annotated = {}
    this.annotations = []
    this.upRegSelected = []
    this.downRegSelected = []
  }

  batchSelection(title: string, type: string, data: string[], initialSearch: boolean = false) {
    this.notification.show("Search for " + data.length + " " + type)
    if (this.settings.selectionTitles.indexOf(title) === -1) {
      this.settings.selectionTitles.push(title)
    }

    this.batchSelectionService.next({title: title, type: type, data: data})
    this.searchService.next({term: data, type: type, annotate: false, title: title, initialSearch: initialSearch})
  }


  clearSpecificSelected(title: string) {

    const setForRemove: string[] = []
    const newSelected: string[] = []

    for (let i = 0; i < this.allSelected.length; i++) {
      const s = this.allSelected[i]

      if (this.selectionMap.has(s)) {
        // @ts-ignore
        const p = this.selectionMap.get(s)

        // @ts-ignore
        const ind = p.indexOf(title)

        if (ind !== -1) {
          // @ts-ignore
          if (p.length > 1) {
            // @ts-ignore
            this.selectionMap.get(s).splice(ind, 1)
          } else {
            this.selectionMap.delete(s)
            setForRemove.push(s)
          }
        }
      }
    }
    console.log(this.selectionMap)
    for (let i = 0; i < this.allSelected.length; i++) {
      const s = this.allSelected[i]
      if (setForRemove.indexOf(s) === -1) {
        newSelected.push(s)
      }
    }
    this.allSelected = newSelected
    console.log(this.allSelected)
    const a: string[] = []
    for (const p of this.allSelected) {
      if (this.uniprot.results.has(p)) {
        a.push(this.uniprot.results.get(p)["Gene names"])
      } else {
        a.push("")
      }
    }
    this.allSelectedGenes = a
    this.annotations = []
    this.upRegSelected = []
    this.downRegSelected = []
    const ind = this.settings.selectionTitles.indexOf(title)
    this.settings.selectionTitles.splice(ind, 1)
    this.clearSpecificService.next(true)
  }

  updateBarChartKey(key: string) {
    if (key !== "") {
      if (!this.barChartKeys.includes(key)) {
        this.barChartKeys.push(key)
        this.relabelSamples[key] = ""
      }
    }

    this.barChartSampleLabels.next(false)
  }

  updateBarChartKeyChannel(key: string) {
    this.barChartSampleUpdateChannel.next(key)
  }

}
