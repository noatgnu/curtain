import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {max} from "rxjs/operators";
import {NotificationService} from "./notification.service";
import {stringify} from "@angular/compiler/src/util";
import {parse} from "@angular/compiler/src/render3/view/style_parser";
import {CurtainLink} from "../classes/curtain-link";

@Injectable({
  providedIn: 'root'
})
export class UniprotService {

  links = new CurtainLink()
  private baseURL = this.links.uniprotBASE;
  public Re = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/;
  accMap: Map<any, any> = new Map<string, string>()
  results: Map<string, any> = new Map<string, any>()
  organism: string = ""
  fetched: boolean = false
  constructor(private http: HttpClient, private notification: NotificationService) { }

  uniprotParseStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  uniprotParseStatusObserver: Observable<boolean> = this.uniprotParseStatus.asObservable()
  uniprotData: Subject<IDataFrame> = new Subject<IDataFrame>()
  run: number = 0
  getUniprot(uniprotUrl: string) {
    return this.http.get(uniprotUrl, {responseType: 'text', observe: 'response'});
  }

  postUniprot(data: Map<string, string>) {
    return this.http.post("https://www.uniprot.org/uploadlists/", this.toParamString(data), {
      //headers: {"User-Agent": "Curtain, JavaScript", "Content-Type": "form-data"},
      responseType: 'text', observe: 'response'})
  }

  toParamString(options: Map<string, string>): string {
    const pArray: string[] = [];
    options.forEach((value, key) => {
      pArray.push(encodeURI(key + '=' + value));
    });

    return pArray.join('&');
  }

  UniProtParseGet(accList: string[], goStats: boolean) {
    this.run = 0
    const maxLength = accList.length;
    if (maxLength >0) {
      this.run = Math.floor(maxLength/400)
      if (this.run%400>0) {
        this.run = this.run + 1
      }
      let currentRun = 0
      for (let i = 0; i < maxLength; i += 400) {
        let l: string[];
        if (i + 400 < maxLength) {
          l = accList.slice(i, i + 400);
        } else {
          l = accList.slice(i);
        }
        const options: Map<string, string> = new Map<string, string>([
          ['from', 'ACC,ID'],
          ['to', 'ACC'],
          ['query', l.join(' ')],
          ['format', 'tab'],
          ['columns', 'id,entry name,reviewed,protein names,genes,organism,length,database(RefSeq),organism-id,go-id,go(cellular component),comment(SUBCELLULAR LOCATION),feature(TOPOLOGICAL_DOMAIN),feature(GLYCOSYLATION),comment(MASS SPECTROMETRY),mass,sequence,database(STRING),feature(DOMAIN EXTENT),comment(FUNCTION)'],
          ['compress', 'no'],
          ['force', 'no'],
          ['sort', 'score'],
          ['desc', ''],
          ['fil', '']
        ]);
        const uniprotUrl = this.baseURL + this.toParamString(options);
        this.getUniprot(uniprotUrl).subscribe((data) => {
          currentRun = currentRun + 1
          const df = fromCSV(<string>data.body);
          const columns = df.getColumnNames()
          const lastColumn = columns[columns.length -1]
          let new_df = df.withSeries("query", df.getSeries(lastColumn).bake()).bake()
          new_df = new_df.dropSeries(lastColumn).bake()
          this.notification.progress ++

          for (const r of new_df) {
            if (r["Gene names"]) {
              r["Gene names"] = r["Gene names"].replaceAll(" ", ";").toUpperCase()
            }
            if (r["Subcellular location [CC]"]) {
              const ind = r["Subcellular location [CC]"].indexOf("Note=")
              if (ind > -1) {
                r["Subcellular location [CC]"] = r["Subcellular location [CC]"].slice(0, ind)
              }

              const subLoc = []
              for (const s of r["Subcellular location [CC]"].split(/[.;]/g)) {
                if (s !== "") {
                  let su = s.replace(/\s*\{.*?\}\s*/g, "")
                  su = su.split(": ")
                  const a = su[su.length-1].trim()
                  if (a !== "") {
                    subLoc.push(a.slice())
                  }

                }
              }
              r["Subcellular location [CC]"] = subLoc

            }
            if (r["Domain [FT]"]) {
              let domains: any[] = []
              let l: number = 0;
              for (const s of r["Domain [FT]"].split(/;/g)) {
                if (s !== "") {
                  if (s.indexOf("DOMAIN") > -1) {
                    domains.push({})
                    l = domains.length
                    for (const match of s.matchAll(/(\d+)/g)) {
                      if (!("start" in domains[l-1])) {
                        domains[l-1].start = parseInt(match[0])
                      } else {
                        domains[l-1].end = parseInt(match[0])
                      }
                    }
                  } else if (s.indexOf("/note=") > -1) {
                    const match = /"(.+)"/.exec(s)
                    if (match !== null) {
                      domains[l-1].name = match[1]
                    }
                  }
                }
              }
              r["Domain [FT]"] = domains
            }
            if (r["query"]) {
              if (r["query"]) {
                this.results.set(this.accMap.get(r["query"]), r)
              }
            }
          }
          this.notification.show("Processed job " + this.notification.progress + "/" + this.run, {delay: 1000})
          if (currentRun === this.run) {
            this.organism = new_df.first()["Organism ID"]
            this.notification.show("Finished acquiring UniProt data", {classname: 'bg-success text-light', delay: 10000})
            this.uniprotParseStatus.next(true)
            this.fetched = true
          }
        });
      }
    } else {
      this.uniprotParseStatus.next(true)
    }

  }

  UniProtParsePost(accList: string[], goStats: boolean) {

    const maxLength = accList.length;
    if (maxLength >0) {
      this.http.post(this.links.proxyURL + "/uniprot", {acc: accList}, {responseType: "text", observe: "response"}).subscribe(data => {
        const df = fromCSV(<string>data.body);
        console.log(df)
        const columns = df.getColumnNames()
        const lastColumn = columns[columns.length -1]
        let new_df = df.withSeries("query", df.getSeries(lastColumn).bake()).bake()
        new_df = new_df.dropSeries(lastColumn).bake()

        for (const r of new_df) {
          r["Gene names"] = r["Gene names"].replaceAll(" ", ";").toUpperCase()
          const ind = r["Subcellular location [CC]"].indexOf("Note=")
          if (ind > -1) {
            r["Subcellular location [CC]"] = r["Subcellular location [CC]"].slice(0, ind)
          }

          const subLoc = []
          for (const s of r["Subcellular location [CC]"].split(/[.;]/g)) {
            if (s !== "") {
              let su = s.replace(/\s*\{.*?\}\s*/g, "")
              su = su.split(": ")
              const a = su[su.length-1].trim()
              if (a !== "") {
                subLoc.push(a.slice())
              }

            }
          }

          r["Subcellular location [CC]"] = subLoc

          this.results.set(r["query"], r)
        }

        this.organism = new_df.first()["Organism ID"]
        this.notification.show("Finished acquiring UniProt data", {classname: 'bg-success text-light', delay: 10000})
        this.uniprotParseStatus.next(true)
        this.fetched = true
      })
    }

  }
}
