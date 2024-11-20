import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {RORQuery} from "./rorquery";

@Injectable({
  providedIn: 'root'
})
export class DataciteService {

  constructor(private http: HttpClient) { }

  getROR(identifier: string) {
    return this.http.get<RORQuery>("https://api.ror.org/organizations?query="+identifier, {responseType: "json", observe: "body"})
  }
}
