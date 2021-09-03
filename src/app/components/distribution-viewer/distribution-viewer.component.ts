import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../service/data.service";

@Component({
  selector: 'app-distribution-viewer',
  templateUrl: './distribution-viewer.component.html',
  styleUrls: ['./distribution-viewer.component.css']
})
export class DistributionViewerComponent implements OnInit {
  _data: IDataFrame = new DataFrame()
  @Input() set data(value: IDataFrame) {
    this._data = value
  }
  get data(): IDataFrame {
    return this._data
  }

  selectedRawData: IDataFrame[] = []

  constructor(private dataService: DataService) {
    this.dataService.annotationSelect.subscribe(data => {
      this.selectedRawData = []
      for (const i of this.dataService.allSelected) {
        const a = this._data.where(row => row.Proteins === i).bake()
        this.selectedRawData.push(a)
      }
    })
    this.dataService.clearService.asObservable().subscribe(data => {
      this.selectedRawData = []
    })
  }

  ngOnInit(): void {
  }

}
