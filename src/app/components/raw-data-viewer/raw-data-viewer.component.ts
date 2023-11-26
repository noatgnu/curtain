import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame, Series} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {FormBuilder} from "@angular/forms";
import {debounceTime, distinctUntilChanged, map} from "rxjs";
import {Settings} from "../../classes/settings";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-raw-data-viewer',
  templateUrl: './raw-data-viewer.component.html',
  styleUrls: ['./raw-data-viewer.component.scss']
})
export class RawDataViewerComponent implements OnInit {
  _data: IDataFrame = new DataFrame()
  baseData: IDataFrame = new DataFrame()
  @Input() set data(value: IDataFrame) {
    this._data = value
    this.baseData = value
    this.displayDF = value
    this.ready = true
    console.log(this._data)
  }

  form = this.fb.group({
    filterTerm: [""],
    filterType: ["Gene Names"],
    filterSearchOperation: ["All selected"],
  })

  sortForm = this.fb.group({
    key: ["Fold Change"],
    order: ['asc'],
    enrichrRun: [""],
  })
  ready = false
  displayDF: IDataFrame = new DataFrame()
  constructor(public dataService: DataService, private fb: FormBuilder, private uniprot: UniprotService, public settings: SettingsService) {
    this.form.controls["filterTerm"].valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((value) => {
      this.ready = false
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
            case "Diseases":
              this.baseData.forEach((row: any) => {
                const uni = this.uniprot.getUniprotFromPrimary(row[this.dataService.rawForm.primaryIDs])
                if (uni["Involvement in disease"]) {
                  if (uni["Involvement in disease"].toLowerCase().includes(value.toLowerCase())) {
                    primaryIds.push(row[this.dataService.rawForm.primaryIDs])
                  }
                }
              })
          }
          if (value === "") {
            this.displayDF = this.baseData
          } else if (primaryIds.length > 0) {
            this.displayDF = this.baseData.where((row: any) => primaryIds.includes(row[this.dataService.rawForm.primaryIDs]))
          } else {
            this.displayDF = new DataFrame()
          }
        }
      } else {
        this.displayDF = this.baseData
      }
      this.ready = true
    })

    this.form.controls.filterSearchOperation.valueChanges.subscribe((value) => {
      this.ready = false
      if (value !== null) {
        if (value === "All selected") {
          this.baseData = this._data.where((row: any) => {
            if (this.dataService.selectedMap[row[this.dataService.rawForm.primaryIDs]]) {
              return true
            }
            return false
          }).bake()
        } else if (this.dataService.selectOperationNames.includes(value)) {
          this.baseData = this._data.where((row: any) => {
            if (this.dataService.selectedMap[row[this.dataService.rawForm.primaryIDs]]) {
              if (this.dataService.selectedMap[row[this.dataService.rawForm.primaryIDs]][value]) {
                return true
              }
            }
            return false
          }).bake()
        }
        this.displayDF = this.baseData
      }
      this.ready = true
    })
  }

  ngOnInit(): void {
  }
  sortDisplayDF(column: string, increase: boolean, enrichrRun: string) {
    if (column !== "Enrichr") {
      if (increase) {
        this.displayDF = this.displayDF.orderBy((row: any) => row[column])
      } else {
        this.displayDF = this.displayDF.orderByDescending((row: any) => row[column])
      }
    } else {
      const enrichrRankColumn: any[] = []
      this.displayDF.forEach((row: any) => {
        const uni = this.uniprot.getUniprotFromPrimary(row[this.dataService.rawForm.primaryIDs])
        if (uni) {
          if (uni["Gene Names"] !== "") {
            if (this.settings.settings.enrichrGeneRankMap[uni["Gene Names"]]) {
              enrichrRankColumn.push(this.settings.settings.enrichrGeneRankMap[uni["Gene Names"]])
            }
          }
        }
      })
      this.displayDF = this.displayDF.withSeries("Enrichr Rank", new Series(enrichrRankColumn))
      if (increase) {
        this.displayDF = this.displayDF.orderBy((row: any) => row["Enrichr Rank"][enrichrRun].rank)
      } else {
        this.displayDF = this.displayDF.orderByDescending((row: any) => row["Enrichr Rank"][enrichrRun].rank)
      }
    }
  }

  sort() {
    if (this.sortForm.value.key) {
      const highestEnrichrRankMap: any = {}
      if (this.settings.settings.enrichrRunList.length > 0) {
        this.settings.settings.enrichrRunList.forEach((run: string) => {
          highestEnrichrRankMap[run] = 0
        })
      }
      const miniDF = this.displayDF.join(
        this.dataService.currentDF, (left) => left[this.dataService.rawForm.primaryIDs], (right) => right[this.dataService.differentialForm.primaryIDs], (left, right) => {
          const uni = this.uniprot.getUniprotFromPrimary(left[this.dataService.rawForm.primaryIDs])

          const result: any = {
            ...left,
          }
          if (!left["Fold Change"]) {
            result["Fold Change"] = right[this.dataService.differentialForm.foldChange]
          }
          if (!left["P Value"]) {
            result["P Value"] = right[this.dataService.differentialForm.significant]
          }
          if (!left["Gene Names"]) {
            if (uni) {
              if (uni["Gene Names"] !== "") {
                result["Gene Names"] = uni["Gene Names"]
              }
            }
          }

          if (result["Gene Names"]) {
            const gene = result["Gene Names"].split(";")[0]
            if (this.settings.settings.enrichrGeneRankMap[gene]) {
              const enrichr = this.settings.settings.enrichrGeneRankMap[gene]
              // @ts-ignore
              if (enrichr[this.sortForm.value.enrichrRun]) {
                // @ts-ignore
                const firstKey = Object.keys(enrichr[this.sortForm.value.enrichrRun])[0]
                // @ts-ignore
                result["Enrichr Rank"] = enrichr[this.sortForm.value.enrichrRun][firstKey].rank
                // @ts-ignore
                if (highestEnrichrRankMap[this.sortForm.value.enrichrRun] < enrichr[this.sortForm.value.enrichrRun][firstKey].rank) {
                  // @ts-ignore
                  highestEnrichrRankMap[this.sortForm.value.enrichrRun] = enrichr[this.sortForm.value.enrichrRun][firstKey].rank
                }
              }

              for (const i in result["Enrichr Rank"]) {
                const firstKey = Object.keys(result["Enrichr Rank"][i])[0]
              }
            }
          }
          return result
        }).bake()

      if (this.sortForm.value.key !== "Enrichr") {
        if (this.sortForm.value.order === "asc") {
          // @ts-ignore
          this.displayDF = miniDF.orderBy((row: any) => row[this.sortForm.value.key]).bake()
        } else {
          // @ts-ignore
          this.displayDF = miniDF.orderByDescending((row: any) => row[this.sortForm.value.key]).bake()
        }
      } else {
        if (this.sortForm.value.order === "asc") {
          // @ts-ignore
          this.displayDF = miniDF.orderBy((row: any) => {
              if (row["Enrichr Rank"]) {
                return row["Enrichr Rank"]
              } else {
                // @ts-ignore
                return highestEnrichrRankMap[this.sortForm.value.enrichrRun] + 1
              }
            }
          ).bake()
        } else {
          // @ts-ignore
          this.displayDF = miniDF.orderByDescending((row: any) => {
            if (row["Enrichr Rank"]) {
              return row["Enrichr Rank"]
            } else {
              // @ts-ignore
              return highestEnrichrRankMap[this.sortForm.value.enrichrRun] + 1
            }
          }).bake()

        }
      }
      console.log(this.displayDF)
    }
  }

}
