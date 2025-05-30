import { Injectable } from '@angular/core';
import {CurtainLink} from "./classes/curtain-link";
import {PlotlyService} from "angular-plotly.js";
import { HttpClient } from "@angular/common/http";
import {DataCiteMetadata} from "./data-cite-metadata";
import {OrcidPublicRecord} from "./orcid-public-record";
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  dataciteURL: string = environment.datacite
  siteProperties: any = {
    non_user_post: true
  }
  links = new CurtainLink()
  filters: any = {
    Kinases: {filename: "kinases.txt", name: "Kinases"},
    LRRK2: {filename: "lrrk2.txt", name: "LRRK2 Pathway"},
    Phosphatases: {filename: "phosphatases.txt", name: "Phosphatases"},
    PD: {filename: "pd.txt", name: "PD Genes (Mendelian)"},
    PINK1: {filename: "pink1.txt", name: "PINK1 Pathway"},
    PDGWAS: {filename: "pd.gwas.txt", name: "PD Genes (GWAS)"},
    DUBS: {filename: "dubs.txt", name: "Deubiquitylases (DUBs)"},
    E1_E2_E3Ligase: {filename: "e3ligase.txt", name: "E1, E2, E3 Ligases"},
    AD: {filename: "AD.txt", name: "AD Genes"},
    Mito: {filename: "Mito.txt", name: "Mitochondrial Proteins"},
    Golgi: {filename: "Golgi.txt", name: "Golgi Proteins"},
    Lysosome: {filename: "Lysosome.txt", name: "Lysosomal Proteins"},
    Glycosylation: {filename: "glyco.txt", name: "Glycosylation Proteins"},
    Metabolism: {filename: "metabolism.txt", name: "Metabolism Pathway"},
    Cathepsins: {filename: "cathepsins.txt", name: "Cathepsins"},
    MacrophageLRRK2Inhibition: {filename: "macrophages.lrrk2.inhibition.txt", name: "LRRK2 inhibition in iPSC-derived macrophages"},
    CiliaCore: {filename: "cilia.core.txt", name: "Core Cilia Proteins"},
    CiliaExpanded: {filename: "cilia.expanded.2.txt", name: "Expanded Cilia Proteins"},
    Hedgehog: {filename: "hedgehog.txt", name: "Hedgehog Genes"},
    Ciliopathy: {filename: "ciliopathy.txt", name: "Ciliopathy Genes"},
    mTOR: {filename: "mtor.txt", name: "mTOR Pathway"}
  }
  constructor(private plotly: PlotlyService, private http: HttpClient) { }


  toParamString(options: Map<string, string>): string {
    const pArray: string[] = [];
    options.forEach((value, key) => {
      pArray.push(encodeURI(key + '=' + value));
    });

    return pArray.join('&');
  }


  downloadFile(fileName: string, fileContent: string, type: string = 'text/csv') {
    const blob = new Blob([fileContent], {type: type})
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url)
  }

  async downloadPlotlyImage(format: string, filename: string, id: string) {
    const graph = this.plotly.getInstanceByDivId(id)
    const plot = await this.plotly.getPlotly()
    await plot.downloadImage(graph, {format: format, filename: filename})
  }
  getPRIDEConstants(constantType: string) {
    return this.http.get("https://raw.githubusercontent.com/PRIDE-Archive/px-submission-tool/master/src/main/resources/cv/"+constantType+".cv", {responseType: "text", observe: "body"})
  }

  getDataCiteMetaData(doi: string) {
    return this.http.get<DataCiteMetadata>(`${this.dataciteURL}/`+doi, {responseType: "json", observe: "body"})
  }

  getORCIDPublicRecord(orcid: string) {
    return this.http.get<OrcidPublicRecord>(`https://orcid.org/${orcid}/public-record.json`, {responseType: "json", observe: "body"})
  }

  getRandomORCID() {

  }

  getDataFromDataCiteAlternateID(alternateID: string) {
    return this.http.get(alternateID, {responseType: "json", observe: "events"})
  }

}
