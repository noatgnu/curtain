import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {DataFrame, IDataFrame, Series} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {SelectionType, SortType} from "@swimlane/ngx-datatable";
import {DataService} from "../../service/data.service";
import {Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";
import {Event} from "@angular/router";

@Component({
  selector: 'app-datatable-viewer',
  templateUrl: './datatable-viewer.component.html',
  styleUrls: ['./datatable-viewer.component.css']
})
export class DatatableViewerComponent implements OnInit, AfterViewInit, AfterContentChecked {
  _data: IDataFrame = new DataFrame()
  @ViewChild("mydatatable") mydatatable: any;
  selected: any[] = []
  selection: SelectionType;
  rows: any[] = []
  sortType: SortType
  seekToPage(searchType: string, searchData: string) {
    const r = this.data.where(row => row[searchType] === searchData).bake().toPairs()
    if (r.length > 0) {
      this.mydatatable.selected.push(r[0][1])
      this.mydatatable.offset = Math.floor(r[0][0]/this.mydatatable.pageSize)
    }
  }


  @Input() tableType: string = ""
  @Input() set data(value: IDataFrame) {
    this._data = value.resetIndex().bake()
    this.rows = this._data.toArray()

    //console.log(this._data)

    if (this.mydatatable) {
      this.mydatatable.selected = []
    }

  }

  get data(): IDataFrame {
    return this._data
  }

  uniprotMap = new Map<string, any>()
  enableUniprot: boolean = false
  constructor(private uniprot: UniprotService, private dataService: DataService, private cd: ChangeDetectorRef) {
    this.enableUniprot = this.uniprot.fetched
    this.sortType = SortType.single
    this.uniprotMap = uniprot.results
    this.selection = SelectionType.multiClick

  }

  private selectingData(data: string[], type: string = "Primary IDs", annotate: boolean = true) {
    let temp: string[] = []
    if (this.mydatatable.selected) {
      for (const d of data) {
        let identical = false

        identical = this.checkIdentical(type, d, identical);
        if (!identical) {
          temp.push(d)
        }
      }
    } else {
      this.mydatatable.selected = []
      temp = data
    }


    const df = this.data.where(row => temp.includes(row[type])).bake().toPairs()
    if (df.length > 0) {
      for (const d of df) {
        this.mydatatable.selected.push(d[1])
      }
      this.mydatatable.offset = Math.floor(df[0][0] / this.mydatatable.pageSize)
      this.rows = [...this.rows]

      this.dataService.updateRegTableSelect(this.tableType, this.mydatatable.selected, annotate)
    }
  }

  selectFromSettings() {
    if (this.dataService.settings.selectedIDs) {
      const d = Object.keys(this.dataService.settings.selectedIDs)
      this.selected = this.data.where(row => d.includes(row["Primary IDs"])).bake().toArray()
      this.dataService.updateRegTableSelect(this.tableType, this.selected, false)
      this.cd.detectChanges()
    }
  }

  private selectingSubLoc(data: string) {

    const da = this.data.where(row => row["Subcellular locations"].includes(data[0])).bake().toPairs()

    let temp: any[] = []
    const result: string[] = []

    if (this.mydatatable.selected) {
      for (const d of da) {
        let identical = false
        identical = this.checkIdentical(data, d[1]["Primary IDs"], identical);
        if (!identical) {
          temp.push(d)
          result.push(d[1]["Primary IDs"])
        }
      }
    } else {
      this.mydatatable.selected = []
      for (const d of da) {
        temp.push(d)
        result.push(d[1]["Primary IDs"])
      }
    }

    if (temp.length > 0) {
      for (const d of temp) {
        this.mydatatable.selected.push(d[1])
      }
      this.mydatatable.offset = Math.floor(temp[0][0] / this.mydatatable.pageSize)
      this.rows = [...this.rows]
      this.dataService.batchSelectionService.next({title: data[0], type: "Primary IDs", data: result})
      this.dataService.updateRegTableSelect(this.tableType, this.mydatatable.selected, false)
    }
  }

  private checkIdentical(type: string, data: string, identical: boolean) {
    for (const s of this.mydatatable.selected) {
      if (type !== "Subcellular location") {
        if (s["Primary IDs"] === data) {
          identical = true
          break
        }
      } else {
        if (s[type].includes(data)) {
          identical = true
          break
        }
      }
    }
    return identical;
  }

  ngOnInit(): void {
    this.dataService.dataPointClickService.asObservable().subscribe(data => {
      if (data.length > 0) {
        this.selectingData(data);
      }
    })

    this.dataService.clearService.asObservable().subscribe(data => {
      if (this.selected) {
        this.selected = []
      }
      if (this.mydatatable) {
        this.mydatatable.selected = []
      }

    })
  }

  ngAfterViewInit() {
    this.dataService.searchService.asObservable().subscribe(data => {
      if (data) {
        if ("annotate" in data) {
          this.selectingData(data["term"], data["type"], data["annotate"])
        } else {
          if (data["type"]==="Subcellular locations") {
            this.selectingSubLoc(data["term"])
          } else {
            this.selectingData(data["term"], data["type"])
          }
        }
      }
    })
    //this.selectFromSettings()
  }

  ngAfterContentChecked() {

  }

  handleSelect(e: any) {
    this.dataService.updateRegTableSelect(this.tableType, e.selected, true)
  }

  getGene(protein: string) {
    if (this.uniprot.results.has(protein)) {
      return this.uniprot.results.get(protein)["Gene names"]
    } else {
      return ""
    }
  }
}
