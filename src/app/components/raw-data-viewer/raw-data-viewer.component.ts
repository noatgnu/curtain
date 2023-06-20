import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {FormBuilder} from "@angular/forms";
import {debounceTime, distinctUntilChanged, map} from "rxjs";

@Component({
  selector: 'app-raw-data-viewer',
  templateUrl: './raw-data-viewer.component.html',
  styleUrls: ['./raw-data-viewer.component.scss']
})
export class RawDataViewerComponent implements OnInit {
  _data: IDataFrame = new DataFrame()

  @Input() set data(value: IDataFrame) {
    this._data = value
    this.displayDF = value
  }

  form = this.fb.group({
    filterTerm: [""],
    filterType: ["Gene Names"],
  })
  displayDF: IDataFrame = new DataFrame()
  constructor(public dataService: DataService, private fb: FormBuilder) {
    this.form.controls["filterTerm"].valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((value) => {
      let primaryIds: string[] = []
      if (value){
        if (value.length > 2) {
          switch (this.form.controls["filterType"].value) {
            case "Gene Names":
              const genes = this.dataService.selectedGenes.filter((gene: string) => gene.toLowerCase().includes(value.toLowerCase()))
              genes.forEach((gene: string) => {
                  primaryIds.push(...this.dataService.getPrimaryIDsFromGeneNames(gene))
              })
              break
            case "Primary IDs":
              primaryIds = this.dataService.selected.filter((primaryID: string) => primaryID.toLowerCase().includes(value.toLowerCase()))
              break
          }
          if (value === "") {
            this.displayDF = this._data
          } else if (primaryIds.length > 0) {
            this.displayDF = this._data.where((row: any) => primaryIds.includes(row[this.dataService.rawForm.primaryIDs]))
          } else {
            this.displayDF = new DataFrame()
          }
        }

        console.log(this.displayDF)
        console.log(primaryIds)

      } else {
        this.displayDF = this._data
      }

    })
  }

  ngOnInit(): void {
  }

}
