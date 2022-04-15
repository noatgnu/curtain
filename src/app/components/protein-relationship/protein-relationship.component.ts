import {Component, Input, OnInit} from '@angular/core';
import {DbStringService} from "../../service/db-string.service";
import {InteractomeAtlasService} from "../../service/interactome-atlas.service";
import {DataService} from "../../service/data.service";
import {fromCSV} from "data-forge";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-protein-relationship',
  templateUrl: './protein-relationship.component.html',
  styleUrls: ['./protein-relationship.component.css']
})
export class ProteinRelationshipComponent implements OnInit {
  _genes: string[] = []
  nodes: any[] = []
  currentGenes: any = {}
  styles: any[] = [
    {
      selector: "node", style: {
        label: "data(label)",
        "background-color": "rgba(25,128,128,0.96)",
        "color": "#fffffe",
        "text-valign": "center",
        "text-halign": "center",
        "text-outline-width": "1px",
        "text-outline-color": "rgb(16,10,10)",
        "height": 100,
        "width": 100,
      }
    },
    {
      selector: ".genes", style: {
        label: "data(label)",
        "background-color": "rgba(139,0,220,0.96)",
        "color": "#fffffe",
        "text-valign": "center",
        "text-halign": "center",
        "text-outline-width": "1px",
        "text-outline-color": "rgb(16,10,10)",
        "height": 50,
        "width": 50,
      }
    },
    {
      selector: "edge",
      style: {
        "line-color": "rgba(25,128,128,0.66)",
        width: 6,
        'curve-style': 'bezier',
        'control-point-distance':50,
        //'line-style': 'dashed'
      }
    },
    {
      selector: ".stringdb",
      style: {"line-color": "rgb(206,128,128)", width: 2}
    },
    {
      selector: ".interactome",
      style: {"line-color": "rgb(73,73,101)", width: 2}
    },
    {
      selector: ".lrrk2",
      style: {"line-color": "rgb(73,73,101)", width: 2, "line-style": "solid"}
    },
  ]
  currentEdges: any = {}
  geneMap: any = {}
  @Input() set genes(value: string[]) {
    if (value.length > 2) {
      const _genes: string[] = []
      for (const v of value) {
        const g = v.split(";")[0]
        if (g!=="") {
          if (!_genes.includes(g)) {
            _genes.push(g)
            this.geneMap[g] = v
          }
        }

      }
      this._genes = _genes

      if (this._genes.length > 2) {
        this.getInteractions().then()
      }
    }

  }
  constructor(public activeModal: NgbActiveModal, private data: DataService, private dbString: DbStringService, private interac: InteractomeAtlasService) { }

  ngOnInit(): void {
  }

  async getInteractions() {
    const nodes: any[] = this.nodes.slice()
    let result: any = {}
    let resultInteractome: any = {}
    try {
      result = await this.dbString.getStringDBInteractions(this._genes).toPromise()
      const tempDF = fromCSV(<string>result)
      if (tempDF.count() > 0) {
        for (const r of tempDF) {
          const nodeName = "edge-stringdb-"+r["preferredName_A"]+r["preferredName_B"]
          if (!this.currentEdges[nodeName]) {
            let classes = "edge stringdb"
            if (this._genes.includes(r["preferredName_A"])&&this._genes.includes(r["preferredName_B"])) {
              this.currentEdges[nodeName] = true
              nodes.push(
                {data:
                    {
                      id: nodeName,
                      source: "gene-"+ r["preferredName_A"],
                      target: "gene-"+ r["preferredName_B"],
                      score: r["score"]
                    }, classes: classes
                }
              )
            }
          }
          if (this.geneMap[r["preferredName_A"]]) {
            this.currentGenes[r["preferredName_A"]] = true
          }
          if (this.geneMap[r["preferredName_B"]]) {
            this.currentGenes[r["preferredName_B"]] = true
          }
        }
      }
    } catch (e) {
      console.log("Can't get StringDB data")
    }
    try {
      resultInteractome = await this.interac.getInteractome(this._genes, "query_query")
      if (resultInteractome["all_interactions"]) {
        if (resultInteractome["all_interactions"].length > 0) {
          for (const r of resultInteractome["all_interactions"]) {
            const nodeName = "edge-interactome-"+r["interactor_A"]["protein_gene_name"]+r["interactor_B"]["protein_gene_name"]
            if (!this.currentEdges[nodeName]) {
              let classes = "edge interactome"
              if (this._genes.includes(r["interactor_A"]["protein_gene_name"])&&this._genes.includes(r["interactor_B"]["protein_gene_name"])){

                this.currentEdges[nodeName] = true
                nodes.push(
                  {data:
                      {
                        id: nodeName,
                        source: "gene-"+r["interactor_A"]["protein_gene_name"],
                        target: "gene-"+r["interactor_B"]["protein_gene_name"],
                        score: r["score"]
                      }, classes: classes
                  }
                )
              }
            }
            if (this.geneMap[r["interactor_A"]["protein_gene_name"]]) {
              this.currentGenes[r["interactor_A"]["protein_gene_name"]] = true
            }
            if (this.geneMap[r["interactor_B"]["protein_gene_name"]]) {
              this.currentGenes[r["interactor_B"]["protein_gene_name"]] = true
            }
          }
        }
      }
    } catch (e) {
      console.log("Can't get Interactome Atlas")
    }


    console.log(this.currentGenes)
    for (const n in this.currentGenes) {
      nodes.push({data: {id: "gene-"+n, label: this.geneMap[n], size: 2}, classes: "genes"})
    }
    this.nodes = nodes
  }
}
