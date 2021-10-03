import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {DataService} from "./data.service";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  private _filters: any = {
    Kinases: "kinases.txt",
    LRRK2: "lrrk2.txt",
    Phosphatases: "phosphatases.txt",
    PD: "pd.txt",
    PINK1: "pink1.txt",
    PDGWAS: "pd.gwas.txt"
  }
  filters: any = {}
  constructor(private http: HttpClient, private dataService: DataService) { }

  getProcessedInput(filename?: string) {
    if (!filename) {
      this.dataService.settings.processedFile = "assets/limma.divided.txt"
    } else {
      this.dataService.settings.processedFile = filename
    }
    return this.http.get(this.dataService.settings.processedFile, {observe: "response", responseType: "text"})
  }

  getRawInput(filename?: string) {
    if (!filename) {
      this.dataService.settings.rawFile = "assets/lysoip.wce.csv"
    } else {
      this.dataService.settings.rawFile = filename
    }
    return this.http.get(this.dataService.settings.rawFile, {observe: "response", responseType: "text"})
  }

  getFilter() {
    for (const i in this._filters) {
      if (!(i in this.filters)) {
        this.filters[i] = []
      }

      this.http.get("assets/" + this._filters[i], {observe: "response", responseType: "text"}).subscribe(data => {
        const a = data.body?.split("\n")
        if (a) {
          for (const n of a) {
            if (n.trim() !== "") {
              this.filters[i].push(n.trim().toUpperCase())
            }
          }
        }
      })
    }
  }

  getSettings(filename: string) {
    this.http.get("assets/" + filename + ".json", {responseType: "text", observe: "response"}).subscribe(res => {
      if (res.body) {
        this.dataService.settings = JSON.parse(res.body)
        this.dataService.updateSettings.next(true)
      }
    })
  }
}
