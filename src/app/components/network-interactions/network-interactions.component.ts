import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {DbStringService} from "../../db-string.service";
import {InteractomeAtlasService} from "../../interactome-atlas.service";
import {fromCSV} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {ScrollService} from "../../scroll.service";
import {getInteractomeAtlas, getStringDBInteractions} from "curtain-web-api";
import {AccountsService} from "../../accounts/accounts.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-network-interactions',
  templateUrl: './network-interactions.component.html',
  styleUrls: ['./network-interactions.component.scss']
})
export class NetworkInteractionsComponent implements OnInit {
  get requiredScore(): number {
    return this._requiredScore;
  }

  set requiredScore(value: number) {
    if (value > 1) {
      value = 1
    }
    this._requiredScore = value;
  }
  selection: string = ""
  otherScore: any = {
    ascore: 0,
    dscore: 0,
    escore: 0,
    fscore: 0,
    nscore: 0,
    pscore: 0,
    tscore: 0
  }

  get atlasScore(): number {
    return this._atlasScore;
  }

  set atlasScore(value: number) {
    if (value > 1) {
      value = 1
    }
    this._atlasScore = value;
  }

  edgeDataViewer: any = {}
  edgeDataSource: string = ""
  private _requiredScore: number = 0.4
  networkType: string = "functional"
  private _atlasScore: number = 0
  _genes: string[] = []
  nodes: any[] = []
  currentGenes: any = {}
  edgeDataMap: any = {}
  styles: any[] = this.createStyles()
  currentEdges: any = {}
  geneMap: any = {}
  @Input() set genes(value: string[]) {
    const genes: string[] = []
    if (this.settings.settings.networkInteractionSettings === undefined) {
      this.settings.settings.networkInteractionSettings = {}
      for (const i in this.form.value) {
        this.settings.settings.networkInteractionSettings[i] = this.form.value[i]
        if (i in this.colorMap) {
          this.colorMap[i] = this.form.value[i].slice()
        }
      }
    } else {
      for (const i in this.settings.settings.networkInteractionSettings) {
        if (i in this.colorMap) {
          this.colorMap[i] = this.settings.settings.networkInteractionSettings[i].slice()
        }
        this.form.controls[i].setValue(this.colorMap[i])
      }
    }
    this.getGenes(value, genes).then();
  }

  private async getGenes(value: string[], genes: string[]) {
    for (const v of value) {
      const uni: any = this.uniprot.getUniprotFromPrimary(v)
      if (uni) {
        if (uni["Gene Names"] !== "") {
          genes.push(uni["Gene Names"])
        }
      }
    }
    if (genes.length > 2) {
      const _genes: string[] = []
      for (const v of genes) {
        const g = v.split(";")[0]
        if (g !== "") {
          if (!_genes.includes(g)) {
            _genes.push(g)
            this.geneMap[g] = v
          }
        }

      }
      this._genes = _genes

      if (this._genes.length > 2) {
        await this.getInteractions()
      }
    }
  }

  form: FormGroup = this.fb.group({
    ascore: [0,],
    dscore: [0,],
    escore: [0,],
    fscore: [0,],
    nscore: [0,],
    pscore: [0,],
    tscore: [0,],
    atlasScore: [0,],
    requiredScore: [0.4],
    networkType: ["functional"],
    "Increase": ["rgb(25,128,128)",],
    "Decrease": ["rgb(220,0,59)",],
    "StringDB": ["rgb(206,128,128)",],
    "InteractomeAtlas": ["rgb(73,73,101)",],
  })

  colorMap: any = {
    "Increase": "rgb(25,128,128)",
    "Decrease": "rgb(220,0,59)",
    "StringDB": "rgb(206,128,128)",
    "InteractomeAtlas": "rgb(73,73,101)",
  }

  result: any = {data: this.nodes.slice(), stylesheet: this.styles.slice(), id:'networkInteractions'}

  constructor(private fb: FormBuilder, private settings: SettingsService, private accounts: AccountsService, private scroll: ScrollService, private data: DataService, private dbString: DbStringService, private interac: InteractomeAtlasService, private uniprot: UniprotService) { }

  ngOnInit(): void {
  }

  async getInteractions() {
    if (this.form.dirty) {
      for (const i in this.form.value) {
        this.settings.settings.networkInteractionSettings[i] = this.form.value[i]
      }
      console.log(this.settings.settings.networkInteractionSettings)
      this.styles = [...this.createStyles()]
      this.form.markAsPristine()
    }
    console.log(this.styles)
    const nodes: any[] = []
    this.currentEdges = {}
    this.currentGenes = {}
    let result: any = {}
    let resultInteractome: any = {}
    try {
      result = await getStringDBInteractions(this._genes, this.uniprot.organism, this.form.value.requiredScore*1000, this.form.value.networkType)
      const tempDF = fromCSV(<string>result.data)
      if (tempDF.count() > 0) {
        for (const r of tempDF) {
          let checked = true
          for (const i in this.otherScore) {
            if (parseFloat(r[i]) < this.form.value[i]) {
              checked = false
            }
          }
          if (checked) {
            r["preferredName_A"] = r["preferredName_A"].toUpperCase()
            r["preferredName_B"] = r["preferredName_B"].toUpperCase()
            const nodeName = "edge-stringdb-"+r["preferredName_A"]+r["preferredName_B"]
            if (!this.currentEdges[nodeName]) {
              this.edgeDataMap[nodeName] = r
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
      }
    } catch (e) {
      console.log("Can't get StringDB data")
    }
    try {
      //const resultInteractome = await getInteractomeAtlas(this._genes, "query_query")
      let resultInteractome = await this.accounts.curtainAPI.postInteractomeAtlasProxy(this._genes, "query_query")
      resultInteractome.data = JSON.parse(resultInteractome.data)
      if (resultInteractome.data["all_interactions"]) {
        if (resultInteractome.data["all_interactions"].length > 0) {
          for (const r of resultInteractome.data["all_interactions"]) {
            const score = parseFloat(r["score"])
            let checked = false
            if (score !== 0) {
              checked = true
            } else if (score >= this.form.value.atlasScore) {
              checked = true
            }
            if (checked) {
              r["interactor_A"]["protein_gene_name"] = r["interactor_A"]["protein_gene_name"].toUpperCase()
              r["interactor_B"]["protein_gene_name"] = r["interactor_B"]["protein_gene_name"].toUpperCase()
              const nodeName = "edge-interactome-"+r["interactor_A"]["protein_gene_name"]+r["interactor_B"]["protein_gene_name"]
              if (!this.currentEdges[nodeName]) {
                this.edgeDataMap[nodeName] = r
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
      }
    } catch (e) {
      console.log("Can't get Interactome Atlas")
    }

    for (const n in this.currentGenes) {
      const primaryIDs = this.data.getPrimaryIDsFromGeneNames(this.geneMap[n])
      let df = this.data.currentDF.where(r => primaryIDs.includes(r[this.data.differentialForm.primaryIDs])).bake()
      if (this.selection !== "") {
        df = df.where(r => r[this.data.differentialForm.comparison] === this.selection).bake()
      }
      const fc = df.getSeries(this.data.differentialForm.foldChange).bake().sum()
      let classes = "genes"
      if (fc > 0) {
        classes = classes + " increase"
      } else if (fc < 0) {
        classes = classes + " decrease"
      }
      nodes.push({data: {id: "gene-"+n, label: this.geneMap[n], size: 2}, classes: classes})
    }
    this.nodes = nodes
    this.result = {data: this.nodes.slice(), stylesheet: this.styles.slice(), id:'networkInteractions'}
  }

  handleSelect(e: string) {
    if (e.startsWith("gene-")) {
      const gene = e.split("-")
      const primaryIDs = this.data.getPrimaryIDsFromGeneNames(this.geneMap[gene[gene.length-1]])

      if (primaryIDs.length > 0) {
        const ind = this.data.selected.sort().indexOf(primaryIDs[0])
        const newPage = Math.floor((ind + 1)/ this.data.pageSize) + 1
        console.log(this.data.page)
        console.log(newPage)

        if (this.data.page !== newPage) {
          this.data.page = newPage
        }
        this.scroll.scrollToID(primaryIDs[0]+"scrollID")
      }
    } else if (e.startsWith("edge-")) {
      const edge = e.split("-")
      this.edgeDataViewer[edge[1]] = this.edgeDataMap[e]
      this.edgeDataSource = edge[1]

    }
  }

  handleSelection(e: string) {
    this.selection = e
    this.getInteractions().then()
  }

  updateColor(color: string, key: string) {
    this.form.controls[key].setValue(color)
    this.form.markAsDirty()
  }

  createStyles() {
    return [
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
        selector: ".increase", style: {
          "background-color": this.settings.settings.networkInteractionSettings["Increase"]
        }
      },
      {
        selector: ".decrease", style: {
          "background-color": this.settings.settings.networkInteractionSettings["Decrease"]
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
        style: {"line-color": this.settings.settings.networkInteractionSettings["StringDB"], width: 2}
      },
      {
        selector: ".interactome",
        style: {"line-color": this.settings.settings.networkInteractionSettings["InteractomeAtlas"], width: 2}
      },
      {
        selector: ".lrrk2",
        style: {"line-color": "rgb(73,73,101)", width: 2, "line-style": "solid"}
      },
    ]
  }
}
