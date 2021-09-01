import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class WebService {

  constructor(private http: HttpClient) { }

  getProcessedInput() {
    return this.http.get("assets/limma.divided.txt", {observe: "response", responseType: "text"})
  }

  getRawInput() {
    return this.http.get("assets/lysoip.wce.csv", {observe: "response", responseType: "text"})
  }
}
