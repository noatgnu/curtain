import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {CurtainLink} from "../classes/curtain-link";
import {forkJoin} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ProteomicsDbService {
  links = new CurtainLink()
  constructor(private http: HttpClient) { }

  getExpression(data: string) {
    const options: any = {id: data}
    const proteomicsDBUrl = this.links.proxyURL + "proteomics/expression"
    return this.http.post(proteomicsDBUrl, JSON.stringify(options), {responseType: "json", observe: "response"})
  }
}