import {AfterViewInit, ChangeDetectorRef, Component, Input, NgZone, OnInit, ViewChild} from '@angular/core';
import {DataFrame, IDataFrame, Series} from "data-forge";
import {UniprotService} from "../../service/uniprot.service";
import {SelectionType} from "@swimlane/ngx-datatable";
import {DataService} from "../../service/data.service";

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
    this.uniprotMap = uniprot.results
    this.selection = SelectionType.multiClick
    this.dataService.dataPointClickService.asObservable().subscribe(data => {
      if (data !== "") {
        const r = this.data.where(row => row["Proteins"] === data).bake().toPairs()
        console.log(r)
        if (r.length > 0) {
          if (!(this.mydatatable.selected).includes(data)) {
            this.mydatatable.selected.push(r[0][1])
          }
          this.rows = [...this.rows]
          this.mydatatable.offset = Math.floor(r[0][0]/20)
        }
      }
    })

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
