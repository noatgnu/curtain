import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {WebService} from "./web.service";

@Injectable({
  providedIn: 'root'
})
export class EbiService {

  constructor(private http: HttpClient, private web: WebService) { }

  getEBIAlpha(id: string) {
    return this.http.get(this.web.links.ebiAlphaFoldURL+"/api/prediction/"+id, {responseType: "json", observe:"response"})
  }
}
