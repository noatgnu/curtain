import { Injectable } from '@angular/core';
import {InputFile} from "./classes/input-file";
import {Differential} from "./classes/differential";
import {Raw} from "./classes/raw";
import {UniprotService} from "./uniprot.service";
import {SettingsService} from "./settings.service";
import {DataFrame, IDataFrame} from "data-forge";
import {BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, OperatorFunction, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  tempLink: boolean = false
  get colorMap(): any {
    return this._colorMap;
  }

  set colorMap(value: any) {
    this._colorMap = value;
  }
  finishedProcessingData: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  selectionUpdateTrigger: Subject<boolean> = new Subject<boolean>()
  dataMap: Map<string, string> = new Map<string, string>()
  sampleMap: any = {}
  currentDF: IDataFrame = new DataFrame()
  genesMap: any = {}
  primaryIDsMap: any = {}
  selectedComparison: string[] = []
  conditions: string[] = []
  dataTestTypes: string[] = [
    "ANOVA",
    //"TTest"
  ]
  redrawTrigger: Subject<boolean> = new Subject()
  annotatedData: any = {}
  get allGenes(): string[] {
    return this._allGenes;
  }
  defaultColorList = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf'
  ]
  private _colorMap: any ={}

  set allGenes(value: string[]) {
    this._allGenes = value;
  }
  fetchUniprot: boolean = true
  differentialForm: Differential = new Differential()
  rawForm: Raw = new Raw()
  private _allGenes: string[] = []
  get differential(): InputFile {
    return this._differential;
  }

  set differential(value: InputFile) {
    this._differential = value;
  }
  get raw(): InputFile {
    return this._raw;
  }

  set raw(value: InputFile) {
    this._raw = value;
  }
  searchType: "Gene Names"|"Primary IDs" = "Gene Names"
  private _raw: InputFile = new InputFile();
  private _differential: InputFile = new InputFile();
  selectedMap: any = {}
  selected: string[] = []
  selectOperationNames: string[] = []
  primaryIDsList: string[] = []
  restoreTrigger: Subject<boolean> = new Subject<boolean>()
  annotationService: Subject<any> = new Subject<any>()
  constructor(private uniprot: UniprotService, private settings: SettingsService) { }
  minMax: any = {
    fcMin: 0,
    fcMax: 0,
    pMin: 0,
    pMax: 0
  }
  page: number = 1
  pageSize: number = 5

  significantGroup(x: number, y: number) {
    const ylog = -Math.log10(this.settings.settings.pCutoff)
    const groups: string[] = []
    if (ylog > y) {
      groups.push("P-value < " + this.settings.settings.pCutoff)
    } else {
      groups.push("P-value >= " + this.settings.settings.pCutoff)
    }

    if (Math.abs(x) > this.settings.settings.log2FCCutoff) {
      groups.push("FC > " + this.settings.settings.log2FCCutoff)
    } else {
      groups.push("FC <= " + this.settings.settings.log2FCCutoff)
    }

    return groups.join(";")
  }

  getPrimaryIDsFromGeneNames(geneNames: string) {
    const result: string[] = []
    console.log(this.uniprot.geneNameToAcc[geneNames])
    if (this.uniprot.geneNameToAcc[geneNames]) {

      for (const a in this.uniprot.geneNameToAcc[geneNames]) {
        if (this.primaryIDsMap[a]) {
          for (const acc in this.primaryIDsMap[a]) {
            if (!result.includes(acc)) {
              result.push(acc)
            }
          }
        }
      }
    }
    return result
  }

  getPrimaryIDsFromAcc(primaryIDs: string) {
    const result: string[] = []
    if (this.primaryIDsMap[primaryIDs]) {
      for (const acc in this.primaryIDsMap[primaryIDs]) {
        if (!result.includes(acc)) {
          result.push(acc)
        }
      }
    }
    return result
  }

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilter(term, this.searchType))
    )

  searchFilter(term: string, searchType: string) {
    switch (searchType) {
      case "Gene Names":
        return this.allGenes.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Primary IDs":
        return this.primaryIDsList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      default:
        return [""]
    }
  }

  searchLimited: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilterLimited(term, this.searchType))
    )

  searchFilterLimited(term: string, searchType: string) {
    console.log(term)
    console.log(this.selectedGenes)
    switch (searchType) {
      case "Gene Names":
        return this.selectedGenes.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Primary IDs":
        return this.selected.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      default:
        return [""]
    }
  }

  selectedGenes: string[] = []

  pairwise(list: any[]): any[] {
    if (list.length < 2) { return []; }
    const first = list[0],
      rest  = list.slice(1),
      pairs = rest.map(function (x) { return [first, x]; });
    return pairs.concat(this.pairwise(rest));
  }
}
