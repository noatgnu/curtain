import { Component, OnInit } from '@angular/core';
import {DataService} from "../../service/data.service";
import {UniprotService} from "../../service/uniprot.service";
import {DbStringService} from "../../service/db-string.service";
import {DataFrame, IDataFrame} from "data-forge";
import {NotificationService} from "../../service/notification.service";

@Component({
  selector: 'app-interaction-datatable',
  templateUrl: './interaction-datatable.component.html',
  styleUrls: ['./interaction-datatable.component.css']
})
export class InteractionDatatableComponent implements OnInit {
  selected: string = ""
  interactionType: string = "physical"
  allSelected: string[] = []
  uniprotData: Map<string, any> = new Map<string, any>()
  dbstringReverse: Map<string, string> = new Map<string, string>()
  df: any[] = []
  constructor(private dataService: DataService, private uniprot: UniprotService, private dbstring: DbStringService, private notification: NotificationService) {
    this.dbstring.interactionAnalysis.asObservable().subscribe(data => {
      if (data) {
        this.allSelected = this.dataService.allSelected
        this.uniprotData = this.uniprot.results
        this.dbstringReverse = this.dbstring.reverseStringMap
        this.selected = this.allSelected[0]
        this.getDF()
      } else {
        this.allSelected = []
      }
    })
  }

  getTitle(acc: string|undefined) {
    if (acc) {
      if (this.uniprotData.has(acc)) {
        const r = this.uniprotData.get(acc)
        return acc + "(" + r["Gene names"] + ")"
      }
    }
    return acc
  }

  getDF() {
    if (this.uniprotData.has(this.selected)) {

      this.df = this.uniprotData.get(this.selected)[this.interactionType].toArray()

    }
  }

  getIDB(row: any) {
    const r = this.dbstringReverse.get(row.stringId_B)
    return this.getTitle(r)
  }

  ngOnInit(): void {
  }

}
