import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "./uniprot.service";
import {BackEasingFactory} from "d3";
import {Settings} from "../classes/settings";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  comparisonSubject: BehaviorSubject<IDataFrame> = new BehaviorSubject<IDataFrame>(new DataFrame())
  dataPointClickService: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([])
  tableSelect: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([])
  annotationSelect: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([])
  searchService: BehaviorSubject<any> = new BehaviorSubject<any>(null)
  clearService: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)
  annotations: any[] = []
  upRegSelected: string[] = []
  downRegSelected: string[] = []
  allSelected: string[] = []
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
  constructor(private uniprot: UniprotService) {
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

  private selectedDataAnnotate(data: any[], up: boolean, annotate: boolean) {
    console.log(data)
    const arr: string[] = []
    for (const d of data) {
      arr.push(d["Primary IDs"])
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
        let t = d["Primary IDs"]
        if (this.uniprot.results.has(t)) {
          t = this.uniprot.results.get(t)["Gene names"] + "(" + t + ")"
        }
        if (annotate) {
          annotations.push({
            xref: 'x',
            yref: 'y',
            x: d.logFC,
            y: -Math.log10(d.pvalue),
            text: t,
            showarrow: true,
            arrowhead: 0.5,
            font: {
              size: 10
            }
          })
        }

        if (up) {
          this.upRegSelected.push(d["Primary IDs"])
        } else {
          this.downRegSelected.push(d["Primary IDs"])
        }
      }
    }
    this.allSelected = this.downRegSelected.concat(this.upRegSelected)
    this.annotations = annotations
    this.annotationSelect.next(this.annotations)
  }

  updateRegTableSelect(table: string, data: any[], annotate: boolean) {
    if (table==="up") {

      this.selectedDataAnnotate(data, true, annotate)
      //this.upRegTableSelect.next(data)
    } else {
      this.selectedDataAnnotate(data, false, annotate)
      //this.downRegTableSelect.next(data)
    }
  }

  clearAllSelected() {
    this.clearService.next(true)
    this.allSelected = []
    this.annotations = []
    this.upRegSelected = []
    this.downRegSelected = []
  }

  batchSelection(title: string, type: string, data: string[]) {
    this.batchSelectionService.next({title: title, type: type, data: data})
    this.searchService.next({term: data, type: type, annotate: false})
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
