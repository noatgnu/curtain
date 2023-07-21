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
  instructorMode: boolean = false
  loadDataTrigger: Subject<boolean> = new Subject<boolean>()
  externalBarChartDownloadTrigger: Subject<boolean> = new Subject<boolean>()
  session: any = {}
  tempLink: boolean = false
  bypassUniProt: boolean = false
  stringDBColorMapSubject: Subject<boolean> = new Subject<boolean>()
  interactomeDBColorMapSubject: Subject<boolean> = new Subject<boolean>()

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
  batchAnnotateAnnoucement: Subject<any> = new Subject<any>()
  selectedComparison: string[] = []
  conditions: string[] = []
  dataTestTypes: string[] = [
    "ANOVA",
    "TTest"
  ]
  redrawTrigger: Subject<boolean> = new Subject()
  annotatedData: any = {}
  get allGenes(): string[] {
    return this._allGenes;
  }
  /*defaultColorList = [
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
  ]*/
  defaultColorList = [
    "#fd7f6f",
    "#7eb0d5",
    "#b2e061",
    "#bd7ebe",
    "#ffb55a",
    "#ffee65",
    "#beb9db",
    "#fdcce5",
    "#8bd3c7",
  ]

  palette: any = {
    "pastel": [
      "#fd7f6f",
      "#7eb0d5",
      "#b2e061",
      "#bd7ebe",
      "#ffb55a",
      "#ffee65",
      "#beb9db",
      "#fdcce5",
      "#8bd3c7"
    ], "retro":[
      "#ea5545",
      "#f46a9b",
      "#ef9b20",
      "#edbf33",
      "#ede15b",
      "#bdcf32",
      "#87bc45",
      "#27aeef",
      "#b33dc6"
    ],
    "solid": [
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
    ],
    "gradient_red_green": [
      "#ff0000",
      "#ff3300",
      "#ff6600",
      "#ff9900",
      "#ffcc00",
      "#ffff00",
      "#ccff00",
      "#99ff00",
      "#66ff00",
      "#33ff00",
      "#00ff00"
    ],
    "Tol_bright": [
      '#EE6677',
      '#228833',
      '#4477AA',
      '#CCBB44',
      '#66CCEE',
      '#AA3377',
      '#BBBBBB'
    ],
    "Tol_muted": [
      '#88CCEE',
      '#44AA99',
      '#117733',
      '#332288',
      '#DDCC77',
      '#999933',
      '#CC6677',
      '#882255',
      '#AA4499',
      '#DDDDDD'
    ],
    "Tol_light": [
      '#BBCC33',
      '#AAAA00',
      '#77AADD',
      '#EE8866',
      '#EEDD88',
      '#FFAABB',
      '#99DDFF',
      '#44BB99',
      '#DDDDDD'
    ],
    "Okabe_Ito": [
      "#E69F00",
      "#56B4E9",
      "#009E73",
      "#F0E442",
      "#0072B2",
      "#D55E00",
      "#CC79A7",
      "#000000"
    ]

  }
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
  searchCommandService: Subject<any> = new Subject<any>()
  constructor(private uniprot: UniprotService, private settings: SettingsService) { }
  minMax: any = {
    fcMin: 0,
    fcMax: 0,
    pMin: 0,
    pMax: 0
  }
  page: number = 1
  pageSize: number = 5


  clear() {
    this.selected = []
    this.selectedGenes = []
    this.selectedMap = {}
    this.selectOperationNames = []
    this.settings.settings.colorMap = {}
    this.settings.settings.textAnnotation = {}
    this.settings.settings.barchartColorMap = {}
    this.settings.settings.rankPlotAnnotation = {}
    this.settings.settings.rankPlotColorMap = {}
    this.annotatedData = {}
  }

  significantGroup(x: number, y: number) {
    const ylog = -Math.log10(this.settings.settings.pCutoff)
    const groups: string[] = []
    if (ylog > y) {
      groups.push("P-value > " + this.settings.settings.pCutoff)
    } else {
      groups.push("P-value <= " + this.settings.settings.pCutoff)
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
