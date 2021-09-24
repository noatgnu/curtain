import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

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
  constructor(private http: HttpClient) { }

  getProcessedInput() {
    return this.http.get("assets/limma.divided.txt", {observe: "response", responseType: "text"})
  }

  getRawInput() {
    return this.http.get("assets/lysoip.wce.csv", {observe: "response", responseType: "text"})
  }

  getFilter() {
    console.log(this._filters)
    for (const i in this._filters) {
      if (!(i in this.filters)) {
        this.filters[i] = []
      }

      this.http.get("assets/" + this._filters[i], {observe: "response", responseType: "text"}).subscribe(data => {
        const a = data.body?.split("\n")
        if (a) {
          for (const n of a) {
            if (n.trim() !== "") {
              this.filters[i].push(n.trim().toLowerCase())
            }
          }
        }
      })
    }

  }
}
