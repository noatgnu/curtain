import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class LipidmapsService {
  baseURL = 'https://www.lipidmaps.org/rest/compound/';

  constructor(private http: HttpClient) { }

  fetchLipidData(inputType: "smiles"|"formula"|"abbrev", inputValue: string, outputType: string = "all", outputFormat: "json"|"txt"= "json") {
    const url = `${this.baseURL}${inputType}/${inputValue}/${outputType}/${outputFormat}`;
    if (outputFormat == "json") {
      return this.http.get<any>(url, { responseType: 'json', observe: 'body' });
    }
    return this.http.get<any>(url, { observe: 'body' });
  }

}
