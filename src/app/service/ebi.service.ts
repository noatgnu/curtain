import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {CurtainLink} from "../classes/curtain-link";

@Injectable({
  providedIn: 'root'
})
export class EbiService {
  links = new CurtainLink()
  constructor(private http: HttpClient) { }

  getEBIAlpha(id: string) {
    return this.http.get(this.links.ebiAlphaFoldURL+"/api/prediction/"+id, {responseType: "json", observe:"response"})
  }
}
