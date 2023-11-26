import {Component, Input} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder} from "@angular/forms";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";

@Component({
  selector: 'app-sub-filter',
  templateUrl: './sub-filter.component.html',
  styleUrls: ['./sub-filter.component.scss']
})
export class SubFilterComponent {
  private _data: IDataFrame<number, any> = new DataFrame()
  primaryData: any[] = []
  @Input() set data(value: IDataFrame<number, any>) {
    this._data = value
    const primaryData: any[] = []
    this._data.forEach((row) => {
      const uniprot = this.uniprot.getUniprotFromPrimary(row[this.dataService.rawForm.primaryIDs])
      const data = {
        primaryID: row[this.dataService.rawForm.primaryIDs],
        uniprot: uniprot,
      }
      primaryData.push(data)
    })
    this.primaryData = primaryData
  }

  get data(): IDataFrame<number, any> {
    return this._data
  }

  form = this.fb.group({

  })
  constructor(private fb: FormBuilder, private dataService: DataService, private uniprot: UniprotService) { }


}
