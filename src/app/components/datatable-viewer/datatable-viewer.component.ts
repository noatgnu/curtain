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
      if (data !== "") {
        this.selectingData(data);
      }
    })
    this.dataService.searchService.asObservable().subscribe(data => {
      if (data) {
        this.selectingData(data["term"], data["type"])
      }
    })

  }

  private selectingData(data: string, type: string = "Proteins") {
    let identical = false
    for (const s of this.mydatatable.selected) {
      if (s[type] === data) {
        identical = true
        break
      }
    }
    if (!identical) {
      const r = this.data.where(row => row[type] === data).bake().toPairs()

      if (r.length > 0) {
        this.mydatatable.selected.push(r[0][1])
        this.mydatatable.offset = Math.floor(r[0][0] / this.mydatatable.pageSize)
        this.rows = [...this.rows]
        this.dataService.updateRegTableSelect(this.tableType, this.mydatatable.selected)
      }
    }
  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {

  }

  handleSelect(e: any) {
    this.dataService.updateRegTableSelect(this.tableType, e.selected)
  }

  getGene(protein: string) {
    if (this.uniprot.results.has(protein)) {
      return this.uniprot.results.get(protein)["Gene names"]
    } else {
      return ""
    }
  }
}
