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
    PDGWAS: "pd.gwas.txt",
    DUBS: "dubs.txt",
    E3Ligase: "e3ligase.txt"
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
    /*this.http.get("assets/" + filename + ".json", {responseType: "text", observe: "response"}).subscribe(res => {
      if (res.body) {
        this.dataService.settings = JSON.parse(res.body)
        this.dataService.updateSettings.next(true)
      }
    })*/
    this.postSettingsId(filename, "").subscribe(res => {
      if (res.body) {
        if (!("data" in res.body)) {
          if ("settings" in res.body) {
            this.dataService.settings = JSON.parse(res.body["settings"])
            this.dataService.rawFile = res.body["raw"]
            this.dataService.processedFile = res.body["processed"]
            if ("selections" in res.body) {
              this.dataService.initialSearch = res.body["selections"]
              console.log(this.dataService.initialSearch)
            }
            this.dataService.updateSettings.next(true)
            if (!this.dataService.settings.pCutOff) {
              this.dataService.settings.pCutOff = 0.00001
            }
            if (!this.dataService.settings.logFCCutOff) {
              this.dataService.settings.logFCCutOff = 2
            }
          }

        }
      }
    })
  }

  putSettings(settings: any) {
    return this.http.put("http://www.conducto.me/file_data", JSON.stringify(settings), {responseType: "text", observe: "response"})
  }

  postSettingsId(id: string, password: string) {
    return this.http.post("http://www.conducto.me/file_data", JSON.stringify({id: id, password: password}), {responseType: "json", observe: "response"})
  }

}
