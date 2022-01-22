import { Injectable } from '@angular/core';
import {CurtainLink} from "../classes/curtain-link";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class InteractomeAtlasService {
  links: CurtainLink = new CurtainLink()
  constructor(private http: HttpClient) { }

  getInteractions(data: string) {
    const options: any = {id: data}
    return this.http.post(this.links.proxyURL + "interactome/interact", JSON.stringify(options), {observe: "response", responseType: "json"})
  }
}
