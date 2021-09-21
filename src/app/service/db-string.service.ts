import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from "@angular/common/http";
import {fromCSV, Series} from "data-forge";
import {BehaviorSubject, forkJoin} from "rxjs";
import {UniprotService} from "./uniprot.service";
import {DataService} from "./data.service";

@Injectable({
  providedIn: 'root'
})
export class DbStringService {
  proxyUrl: string = "http://10.205.101.46:8888/"
  baseUrl: string = "http://string-db.org/"
  stringMap: Map<string, any> = new Map<string, any>()
  reverseStringMap: Map<string, string> = new Map<string, string>()
  run: number = 0
  dbstringIDRunStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  interactionAnalysis: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  constructor(private http: HttpClient, private uniprot: UniprotService, private dataService: DataService) { }
  getStringIdentifiers(data: string[], species: string) {
    const maxLength = data.length;
    const sep = 10000
    if (maxLength >0) {
      this.run = Math.floor(maxLength/sep)
      if (maxLength%sep>0) {
        this.run = this.run + 1
      }
      let currentRun = 0
      for (let i = 0; i < maxLength; i += sep) {
        let l: string[];
        if (i + sep < maxLength) {
          l = data.slice(i, i + sep);
        } else {
          l = data.slice(i);
        }
        const options: Map<string, string> = new Map<string, string>([
          ["identifiers", l.join("%0d")],
          ["echo_query", "1"],
          ["species", species]
        ])
        const dbstringUrl = "http://10.205.101.46:8888/" + this.baseUrl + "api/tsv/get_string_ids"
        this.http.post(dbstringUrl, this.toParamString(options), {responseType: "text", observe: "response"}).subscribe((data) => {
          currentRun = currentRun + 1
          const df = fromCSV(<string>data.body);
          for (const r of df) {
            this.stringMap.set(r["queryItem"], r)
          }
          if (currentRun === this.run) {
            this.dbstringIDRunStatus.next(true)
          }
        });
      }
    } else {
      this.dbstringIDRunStatus.next(true)
    }
  }

  toParamString(options: Map<string, string>): string {
    const pArray: string[] = [];
    options.forEach((value, key) => {
      pArray.push(encodeURI(key + '=' + value));
    });

    return pArray.join('&');
  }

  getEnrichment(data_study: string[], data_background: string[], species: string) {
    const options: Map<string, string> = new Map<string, string>([
      ["identifiers", data_study.join("%0d")],
      ["background_string_identifiers", data_background.join("%0d")],
      ["species", species]
    ])
    const dbstringUrl = this.proxyUrl + this.baseUrl + "api/tsv/enrichment"
    this.http.post(dbstringUrl, this.toParamString(options), {responseType: "text", observe: "response"}).subscribe(data => {
      console.log(data)
    })
  }

  getInteractingPartners(data: string[], species: string) {
    const options: Map<string, string> = new Map<string, string>([
      ["identifiers", data.join("%0d")],
      ["species", species],
      ["network_type", "physical"],
    ])
    const dbstringUrl = this.proxyUrl + this.baseUrl + "api/tsv/interaction_partners"
    let physical = this.http.post(dbstringUrl, this.toParamString(options), {responseType: "text", observe: "response"})
    options.set("network_type", "functional")
    let functional =   this.http.post(dbstringUrl, this.toParamString(options), {responseType: "text", observe: "response"})
    forkJoin([physical, functional]).subscribe(res => {
      const phy = res[0]
      const fu = res[1]
      this.processInteraction(phy, data, "physical");
      this.processInteraction(fu, data, "functional");
      this.interactionAnalysis.next(true)
    })
  }

  private processInteraction(phy: HttpResponse<string>, data: string[], type: string) {
    const df = fromCSV(<string>phy.body);
    /*      for (const r of df) {
            if (!(r["stringId_A"] in this.interactionMap)) {
              this.interactionMap[r["stringId_A"]] = {}
            }
            this.interactionMap[r["stringId_A"]][r["stringId_B"]] = r
          }*/

    for (const a of this.dataService.allSelected) {
      if (this.uniprot.results.has(a)) {
        const p = this.uniprot.results.get(a)
        for (const e of p["Cross-reference (STRING)"].split(";")) {
          console.log(e)
          if (e) {
            let newDF = df.where(row => row.stringId_A === e).bake()
            newDF = newDF.where(row => data.includes(row.stringId_B)).bake()
            console.log(newDF)
            /*            const proteinB = []
                        for (const r of newDF) {
                          const a = this.reverseStringMap.get(r.stringId_B)
                          if (a) {
                            const c = this.uniprot.results.get(a)
                            proteinB.push(c["Entry"])
                          }

                        }
                        newDF = newDF.withSeries("Protein B", new Series(proteinB)).bake()*/
            if (newDF.count() > 0) {
              p[type] = newDF
              this.uniprot.results.set(a, p)
            }
          }
        }
      }
    }
  }

  getInteractingPartnersNoProxy(data: string[], species: string) {
    const options: Map<string, string> = new Map<string, string>([
      ["identifiers", data.join("%0d")],
      ["species", species],
      ["network_type", "physical"]
    ])
    const dbstringUrl = this.proxyUrl + this.baseUrl + "api/tsv/interaction_partners?" + this.toParamString(options)
    let physical = this.http.post(dbstringUrl, this.toParamString(options), {responseType: "text", observe: "response"})
    options.set("network_type", "functional")
    let functional =   this.http.post(dbstringUrl, this.toParamString(options), {responseType: "text", observe: "response"})
    forkJoin([physical, functional]).subscribe(res => {
      const phy = res[0]
      const fu = res[1]
      this.processInteraction(phy, data, "physical");
      this.processInteraction(fu, data, "functional");
      this.interactionAnalysis.next(true)
    })
  }
}
