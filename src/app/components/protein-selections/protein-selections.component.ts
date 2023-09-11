import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataService} from "../../data.service";
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BatchSearchComponent} from "../batch-search/batch-search.component";
import {UniprotService} from "../../uniprot.service";
import {DataFrame, IDataFrame} from "data-forge";
import {Settings} from "../../classes/settings";
import {SettingsService} from "../../settings.service";

export interface selectionData {
  data: string[];
  title: string;
}

@Component({
  selector: 'app-protein-selections',
  templateUrl: './protein-selections.component.html',
  styleUrls: ['./protein-selections.component.scss']
})
export class ProteinSelectionsComponent implements OnInit {
  iscollapse: boolean = false
  tableFilterModel: string = ""
  @Output() searchResult: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  progressBar: any = {text: "", value: 0}

  @Input() set filterList(value: {searchType: string, data: string[], title: string, params: any}) {
    if (value) {
      if (!value.params) {
        value.params = {
          enableAdvanced: false,
          searchLeft: false,
          searchRight: false,
          maxFCRight: 0,
          maxFCLeft: 0,
          minFCRight: 0,
          minFCLeft: 0,
          maxP: 0,
          minP: 0,
          significantOnly: false
        }
      }

    }
  }

  openBatchSearch() {
    const ref = this.modal.open(BatchSearchComponent, {size: "lg"})

    ref.closed.subscribe(data => {
      let result = this.getPrimaryIDsDataFromBatch(data);
      this.searchResult.emit({data: result, title: data.title})
    })

  }

  getPrimaryIDsDataFromBatch(data: any) {
    let result: string[] = []
    for (const d in data.data) {
      let res = this.parseData(data, d, true);
      if (res.length === 0) {
        for (const dd of data.data[d]) {
          res = this.parseData(data, dd, false)
          if (res.length > 0) {
            for (const a of res) {
              if (!result.includes(a)) {
                result.push(a)
              }
            }
          }
        }
      }
      if (res.length > 0) {
        for (const a of res) {
          if (!result.includes(a)) {
            result.push(a)
          }
        }
      }
    }
    if (data["params"]) {
      if (data.params.enableAdvanced) {
        let res: string[] = []
        let df = this.data.currentDF.where(
          r =>
            r[this.data.differentialForm.significant] >= data.params.minP &&
            r[this.data.differentialForm.significant] <= data.params.maxP
        ).bake()
        if (data.params.searchLeft || data.params.searchRight) {
          if (data.params.searchRight) {
            const temp = df.where(
              r =>
                (r[this.data.differentialForm.foldChange] >= data.params.minFCRight) &&
                (r[this.data.differentialForm.foldChange] <= data.params.maxFCRight)
            ).bake()
            res = temp.getSeries(this.data.differentialForm.primaryIDs).bake().toArray()
          }
          if (data.params.searchLeft) {

            console.log(data)
            const left = df.where(
              r =>
                (r[this.data.differentialForm.foldChange] >= -data.params.maxFCLeft) &&
                (r[this.data.differentialForm.foldChange] <= -data.params.minFCLeft)
            ).bake()
            console.log(left)
            res = res.concat(left.getSeries(this.data.differentialForm.primaryIDs).bake().toArray())
          }
          result = res
        } else {
          result = df.getSeries(this.data.differentialForm.primaryIDs).bake().toArray()
        }

      } else {
        if (data.params.significantOnly) {
          const pCutoff = -(Math.log10(this.settings.settings.pCutoff))
          const df = this.data.currentDF.where(
            r => result.includes(r[this.data.differentialForm.primaryIDs]) &&
              (r[this.data.differentialForm.significant] >= pCutoff) &&
              (Math.abs(r[this.data.differentialForm.foldChange]) > this.settings.settings.log2FCCutoff)).bake()
          result = df.getSeries(this.data.differentialForm.primaryIDs).bake().toArray()
        }
      }
    }
    return result;
  }

  private parseData(data: any, d: string, exact: boolean) {
    //console.log(data)
    switch (data.searchType) {
      case "Gene Names":
        if (exact) {
          return this.data.getPrimaryIDsFromGeneNames(d)
        } else {
          //console.log(d)
          //console.log(this.data.genesMap[d])
          if (this.data.genesMap[d]) {
            for (const m in this.data.genesMap[d]) {
              const res = this.data.getPrimaryIDsFromGeneNames(m)
              if (res.length > 0) {
                return res
              }
            }
          }
        }
        break
      case "Primary IDs":
        if (exact) {
          return this.data.getPrimaryIDsFromAcc(d)
        } else {
          if (this.data.primaryIDsMap[d]) {
            for (const m in this.data.primaryIDsMap[d]) {
              const res = this.data.getPrimaryIDsFromAcc(m)
              if (res.length > 0) {
                return res
              }
            }
          }
        }
        break
    }
    return []
  }



  constructor(public data: DataService, private modal: NgbModal, private uniprot: UniprotService, private settings: SettingsService) {
    this.data.searchCommandService.asObservable().subscribe(data => {
      if (data) {
        const result = this.getPrimaryIDsDataFromBatch(data)
        this.searchResult.emit({data: result, title: data.title})
      }
    })
  }

  ngOnInit(): void {
  }

  singleSearchHandle() {
    const data: any = {}
    data[this.tableFilterModel] = {}
    data[this.tableFilterModel][this.tableFilterModel] = true
    const res = this.parseData({data: data, searchType: this.data.searchType, title: "Single Selection"}, this.tableFilterModel, true)
    this.searchResult.emit({data: res, title: this.tableFilterModel})
  }
}
