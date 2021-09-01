import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {DataFrame, IDataFrame} from "data-forge";
import {UniprotService} from "./uniprot.service";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  comparisonSubject: BehaviorSubject<IDataFrame> = new BehaviorSubject<IDataFrame>(new DataFrame())
  dataPointClickService: BehaviorSubject<string> = new BehaviorSubject<string>("")
  tableSelect: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([])
  annotationSelect: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([])
  searchService: BehaviorSubject<any> = new BehaviorSubject<any>(null)
  annotations: any[] = []
  upRegSelected: string[] = []
  downRegSelected: string[] = []
  allSelected: string[] = []
  sampleColumns: string[] = []
  constructor(private uniprot: UniprotService) {

  }

  updateComparison(data: IDataFrame) {
    this.comparisonSubject.next(data)
  }

  updateDataPointClick(data: string) {
    this.dataPointClickService.next(data)
  }

  private selectedDataAnnotate(data: any[], up: boolean) {
    const arr: string[] = []
    for (const d of data) {
      arr.push(d.Proteins)
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
      let protein = a.text
      if (a.text.indexOf("(") !== -1) {
        protein = a.text.slice(ind+1, -1)
      }
      if (!setForRemove.includes(protein)) {
        annotations.push(a)
      }
    }

    for (const d of data) {
      if (!setForKeep.includes(d.Proteins)) {
        let t = d.Proteins
        if (this.uniprot.results.has(t)) {
          t = this.uniprot.results.get(t)["Gene names"] + "(" + t + ")"
        }
        annotations.push({
          xref: 'x',
          yref: 'y',
          x: d.logFC,
          y: -Math.log10(d.pvalue),
          text: t,
          showarrow: true,
          arrowhead: 7
        })
        if (up) {
          this.upRegSelected.push(d.Proteins)
        } else {
          this.downRegSelected.push(d.Proteins)
        }
      }
    }
    this.allSelected = this.downRegSelected.concat(this.upRegSelected)
    this.annotations = annotations
    this.annotationSelect.next(this.annotations)
  }

  updateRegTableSelect(table: string, data: any[]) {
    if (table==="up") {

      this.selectedDataAnnotate(data, true)
      //this.upRegTableSelect.next(data)
    } else {
      this.selectedDataAnnotate(data, false)
      //this.downRegTableSelect.next(data)
    }
  }
}
