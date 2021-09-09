import {AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {DataFrame, IDataFrame, Series} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {SelectionType, SortType} from "@swimlane/ngx-datatable";
import {DataService} from "../../service/data.service";
import {Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";

@Component({
  selector: 'app-datatable-viewer',
  templateUrl: './datatable-viewer.component.html',
  styleUrls: ['./datatable-viewer.component.css']
})
export class DatatableViewerComponent implements OnInit, AfterViewInit {
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
  constructor(private uniprot: UniprotService, private dataService: DataService, private cd: ChangeDetectorRef) {
    this.sortType = SortType.single
    this.uniprotMap = uniprot.results
    this.selection = SelectionType.multiClick
    this.dataService.dataPointClickService.asObservable().subscribe(data => {
      if (data.length > 0) {
        this.selectingData(data);
      }
    })
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
    this.dataService.clearService.asObservable().subscribe(data => {
      if (this.selected) {
        this.selected = []
      }
      if (this.mydatatable) {
        this.mydatatable.selected = []
      }

    })

  }

  private selectingData(data: string[], type: string = "Proteins", annotate: boolean = true) {
    const temp: string[] = []
    for (const d of data) {
      let identical = false
      identical = this.checkIdentical(type, d, identical);
      if (!identical) {
        temp.push(d)
      }
    }
    console.log(data)
    const df = this.data.where(row => temp.includes(row[type])).bake().toPairs()
    console.log(df)
    if (df.length > 0) {
      for (const d of df) {
        this.mydatatable.selected.push(d[1])
      }
      console.log(df)
      this.mydatatable.offset = Math.floor(df[0][0] / this.mydatatable.pageSize)
      this.rows = [...this.rows]

      this.dataService.updateRegTableSelect(this.tableType, this.mydatatable.selected, annotate)
    }
  }

  private selectingSubLoc(data: string) {
    const da = this.data.where(row => row["Subcellular locations"].includes(data)).bake().toPairs()
    for (const r of da) {
      let identical = false
      identical = this.checkIdentical("Subcellular locations", r[1].Proteins, identical)
      if (!identical) {
        this.mydatatable.selected.push(r[1])
      }
    }
    this.rows = [...this.rows]
    this.dataService.updateRegTableSelect(this.tableType, this.mydatatable.selected, false)
  }

  private checkIdentical(type: string, data: string, identical: boolean) {
    for (const s of this.mydatatable.selected) {
      if (type !== "Subcellular location") {
        if (s.Proteins === data) {
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

  }

  ngAfterViewInit() {

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
