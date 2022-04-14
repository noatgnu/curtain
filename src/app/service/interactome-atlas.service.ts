import { Injectable } from '@angular/core';
import {CurtainLink} from "../classes/curtain-link";
import {HttpClient} from "@angular/common/http";
import {WebService} from "./web.service";

@Injectable({
  providedIn: 'root'
})
export class InteractomeAtlasService {
  links: CurtainLink = new CurtainLink()
  constructor(private http: HttpClient, private web: WebService) { }

  getInteractions(data: string) {
    const options: any = {id: data}
    return this.http.post(this.links.proxyURL + "interactome/interact", JSON.stringify(options), {observe: "response", responseType: "json"})
  }

  async getInteractome(genes: string[], filter_parameter: string = "None") {
    const options: Map<string, string> = new Map<string, string>([
        ["query_interactor", "query"],
        ["query_id_array", genes.join("%2C")],
        ["search_term_parameter", genes.join("%2C")],
        ["filter_parameter", filter_parameter],
      ]
    )
    let search_term_array: string[] = []
    for (const g of genes) {
      search_term_array.push("search_term_array%5B%5D="+g)
    }

    const res = await this.http.get("http://www.interactome-atlas.org/search_results_interactions?"+ this.web.toParamString(options) + "&" + search_term_array.join("&"), {responseType:"json", observe: "body"}).toPromise()
    const a = JSON.parse(<string>res)
    return a
  }
}
