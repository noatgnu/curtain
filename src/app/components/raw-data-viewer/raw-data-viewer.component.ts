import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";

@Component({
  selector: 'app-raw-data-viewer',
  templateUrl: './raw-data-viewer.component.html',
  styleUrls: ['./raw-data-viewer.component.scss']
})
export class RawDataViewerComponent implements OnInit {
  _data: IDataFrame = new DataFrame()

  @Input() set data(value: IDataFrame) {
    this._data = value
  }
  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

}
