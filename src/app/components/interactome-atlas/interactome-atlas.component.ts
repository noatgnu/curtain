import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {InteractomeAtlasService} from "../../interactome-atlas.service";
import {UniprotService} from "../../uniprot.service";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {ToastService} from "../../toast.service";
import {IDataFrame} from "data-forge";
import {CytoplotComponent} from "../cytoplot/cytoplot.component";
import {getInteractomeAtlas} from "curtain-web-api";
import {AccountsService} from "../../accounts/accounts.service";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-interactome-atlas',
  templateUrl: './interactome-atlas.component.html',
  styleUrls: ['./interactome-atlas.component.scss']
})
export class InteractomeAtlasComponent implements OnInit {
  @ViewChild("cytoplot") cytoplot: CytoplotComponent | undefined
  get data(): any {
    return this._data;
  }
  interactedMap: Map<string, any[]> = new Map<string, any[]>()
  private _data: any = {}
  cutoff: number = 0
  enableFilter: boolean = false
  selected: any[] = []
  @Input() set data(value: any) {
    this._data = value
    const uni = this.uniprot.getUniprotFromPrimary(value)
    if (uni !== null) {
      this.geneName = uni["Gene Names"]
    } else {
      this.geneName = ""
    }
    if (this.settings.settings.interactomeAtlasColorMap=== undefined) {
      this.settings.settings.interactomeAtlasColorMap = {}
      for (const i in this.colorMap) {
        this.settings.settings.interactomeAtlasColorMap[i] = this.colorMap[i].slice()
        this.form.controls[i].setValue(this.colorMap[i])
      }

    } else {
      for (const i in this.settings.settings.interactomeAtlasColorMap) {
        this.colorMap[i] = this.settings.settings.interactomeAtlasColorMap[i].slice()
        this.form.controls[i].setValue(this.colorMap[i])
      }
    }
    this.getInteractions().then()


  }
  geneName: string = ""
  interactions: any = {}
  drawData: any = {data: [], stylesheet: []}
  evidences: any = {}

  selection: string = ""
  hasError: boolean = false
  colorMap: any = {
    "Increase": "#a12323",
    "Decrease": "#16458c",
    "Not found": "rgba(25,128,128,0.96)",
    "No change": "rgba(47,39,40,0.96)",
    "HI-Union": "rgba(82,110,194,0.96)",
    "Literature": "rgba(181,151,222,0.96)",
    "HI-Union and Literature": "rgba(222,178,151,0.96)",
  }

  form: FormGroup = this.fb.group({
    "Increase": ["#a12323",],
    "Decrease": ["#16458c",],
    "No change": ["rgba(47,39,40,0.96)",],
    "Not found": ["rgba(25,128,128,0.96)",],
    "HI-Union": "rgba(82,110,194,0.96)",
    "Literature": "rgba(181,151,222,0.96)",
    "HI-Union and Literature": "rgba(222,178,151,0.96)",
  })
  constructor(private fb: FormBuilder, private toast: ToastService, private accounts: AccountsService, private uniprot: UniprotService, private dataService: DataService, private settings: SettingsService) {
    this.dataService.interactomeDBColorMapSubject.asObservable().subscribe(data => {
      if (data) {
        for (const i in this.settings.settings.interactomeAtlasColorMap) {
          this.colorMap[i] = this.settings.settings.interactomeAtlasColorMap[i].slice()
          this.form.controls[i].setValue(this.colorMap[i])
        }
        this.form.markAsPristine()
      }
    })
  }

  ngOnInit(): void {
  }

  async getInteractions() {
    if (this.geneName !== "") {
      if (this.form.dirty) {
        for (const i in this.form.value) {
          this.settings.settings.interactomeAtlasColorMap[i] = this.form.value[i]
        }
        this.dataService.interactomeDBColorMapSubject.next(true)
      }
      this.hasError = false
      try {
        const interactions = await this.accounts.curtainAPI.postInteractomeAtlasProxy([this.geneName.split(";")[0]], "None")
        //const interactions = await getInteractomeAtlas([this.geneName.split(";")[0]])
        console.log(interactions)
        if (interactions) {
          this.interactions = JSON.parse(interactions.data)
          this.reformatInteraction()
        }
      } catch (e) {
        this.hasError = true
      }


      /*this.interac.getInteractions(this.geneName.split(";")[0]).subscribe(data => {
        if (data.body) {
          if (typeof data.body === "string") {
            this.interactions = JSON.parse(data.body)
            this.reformatInteraction()
          }
        }
      })*/
    }
  }

  reformatInteraction() {
    this.processInteractionData().then();
  }

  private async processInteractionData() {
    const increased: string[] = []
    const decreased: string[] = []
    const allGenes: string[] = []
    if (this.selection !== "") {
      const df = this.dataService.currentDF.where(r => r[this.dataService.differentialForm.comparison] === this.selection).bake()
      await this.updateIncreasedDecreased(increased, decreased, allGenes, df);
    } else {
      await this.updateIncreasedDecreased(increased, decreased, allGenes, this.dataService.currentDF);
    }

    const styles: any[] = []
    const nodes: any[] = []
    const interacted: string[] = []
    const interactedMap: Map<string, any[]> = new Map<string, any[]>()
    if (this.interactions["all_interactions"].length > 0) {
      for (const i of this.interactions["all_interactions"]) {
        let oScore = parseFloat(i["score"])
        this.evidences[i["interaction_id"]] = []
        for (const d of i["dataset_array"]) {
          this.evidences[i["interaction_id"]].push(d)
        }
        interactedMap.set("edge" + i["interaction_id"], this.evidences[i["interaction_id"]].slice())
        let classes: string[] = []
        const interactions: string[] = []
        for (const interaction of i["interaction_category_array"]["interaction_category_array"]) {
          interactions.push(interaction["category_name"])
        }
        classes.push(interactions.join(""))
        classes.push(i["interaction_id"] + i["interactor_A"]["protein_id"])
        let score = oScore
        if (isNaN(oScore)) {
          score = 2
          classes.push("noscore")
        } else {
          score = 2 + 3 * oScore
        }
        if (!interactedMap.has("node" + i["interactor_A"]["protein_id"])) {
          interactedMap.set("node" + i["interactor_A"]["protein_id"], this.evidences[i["interaction_id"]].slice())
        } else {
          for (const i2 of this.evidences[i["interaction_id"]]) {
            // @ts-ignore
            interactedMap.get("node" + i["interactor_A"]["protein_id"]).push(i2)
          }
        }
        if (!interactedMap.has("node" + i["interactor_B"]["protein_id"])) {
          interactedMap.set("node" + i["interactor_B"]["protein_id"], this.evidences[i["interaction_id"]].slice())
        } else {
          for (const i2 of this.evidences[i["interaction_id"]]) {
            // @ts-ignore
            interactedMap.get("node" + i["interactor_B"]["protein_id"]).push(i2)
          }
        }
        if (this.enableFilter) {
          if (!isNaN(oScore)) {
            if (oScore > this.cutoff) {
              interacted.push(i["interactor_A"]["protein_id"])
              interacted.push(i["interactor_B"]["protein_id"])
              nodes.push({
                data: {
                  id: "edge" + i["interaction_id"],
                  source: "node" + i["interactor_A"]["protein_id"],
                  target: "node" + i["interactor_B"]["protein_id"],
                  score: score
                },
                classes: classes.join(" ")
              })

            }
          }
        } else {
          nodes.push({
            data: {
              id: "edge" + i["interaction_id"],
              source: "node" + i["interactor_A"]["protein_id"],
              target: "node" + i["interactor_B"]["protein_id"],
              score: score
            },
            classes: classes.join(" ")
          })
        }
      }
    } else {
      this.toast.show('Interactome Atlas', "No interactions data could be found for " + this.geneName).then(r => {
      })
    }

    this.interactedMap = interactedMap

    for (const i of this.interactions["all_proteins"]) {
      let classes: string[] = []
      if (i["protein_gene_name"] === this.data) {
        classes.push("root")
      }
      if (increased.includes(i["protein_gene_name"])) {
        classes.push("increase")
      } else if (decreased.includes(i["protein_gene_name"])) {
        classes.push("decrease")
      } else if (allGenes.includes(i["protein_gene_name"])) {
        classes.push("noChange")
      }
      if (this.enableFilter) {
        if (interacted.includes(i["protein_id"])) {
          nodes.push({
            data:
              {
                id: "node" + i["protein_id"],
                label: i["protein_gene_name"],
                size: 5
              }, classes: classes.join(" ")
          })
        }
      } else {
        nodes.push({
          data:
            {
              id: "node" + i["protein_id"],
              label: i["protein_gene_name"],
              size: 5
            }, classes: classes.join(" ")
        })
      }

    }

    styles.push(
      {
        selector: "node", style:
          {
            label: "data(label)",
            "background-color": "rgba(25,128,128,0.96)",
            "color": "#fffffe",
            "text-valign": "center",
            "text-halign": "center",
            "text-outline-width": "1px",
            "text-outline-color": "rgb(16,10,10)"
          }
      }
    )
    styles.push(
      {selector: "edge", style: {"line-color": "rgba(25,128,128,0.96)", width: "data(score)"}}
    )
    styles.push(
      {selector: ".noscore", style: {"line-color": "rgba(47,39,40,0.96)", width: "data(score)"}}
    )
    styles.push(
      {selector: ".HI-Union", style: {"line-color": this.form.value["HI-Union"], width: "data(score)"}}
    )
    styles.push(
      {selector: ".Literature", style: {"line-color": this.form.value["Literature"], width: "data(score)"}}
    )
    styles.push(
      {selector: ".HI-UnionLiterature", style: {"line-color":this.form.value["HI-Union and Literature"], width: "data(score)"}}
    )
    styles.push(
      {selector: ".root", style: {label: "data(label)", "background-color": "#765cd0"}}
    )
    styles.push(
      {selector: ".increase", style: {label: "data(label)", "background-color": this.form.value["Increase"], "color": "#ce8080",}}
    )
    styles.push(
      {selector: ".decrease", style: {label: "data(label)", "background-color": this.form.value["Decrease"], "color": "#6f94bb",}}
    )
    styles.push(
      {
        selector: ".noChange",
        style: {label: "data(label)", "background-color": this.form.value["No change"], "color": "rgba(229,176,63,0.96)",}
      }
    )
    this.drawData = {data: nodes, stylesheet: styles, id: "interactome" + this._data}
  }

  private async updateIncreasedDecreased(increased: string[], decreased: string[], allGenes: string[], df: IDataFrame) {
    for (const r of df) {
      const uni: any = this.uniprot.getUniprotFromPrimary(r[this.dataService.differentialForm.primaryIDs])
      if (uni) {
        if (r[this.dataService.differentialForm.foldChange] >= this.settings.settings.log2FCCutoff) {
          for (const u of uni["Gene Names"].split(";")) {
            if (u !== "") {
              increased.push(u)
            }
          }
        } else if (r[this.dataService.differentialForm.foldChange] <= -this.settings.settings.log2FCCutoff) {
          for (const u of uni["Gene Names"].split(";")) {
            if (u !== "") {
              decreased.push(u)
            }
          }
        }
        for (const u of uni["Gene Names"].split(";")) {
          if (u !== "") {
            allGenes.push(u)
          }
        }
      }
    }
  }

  viewEvidences(event: any) {
    // @ts-ignore
    this.selected = this.interactedMap.get(event)
    console.log(this.interactedMap.get(event))
  }

  handleSelection(e: string) {
    this.selection = e
    this.getInteractions().then()
  }

  download() {
    if (this.cytoplot) {
      this.cytoplot.download()
    }
  }

  updateColor(color: string, key: string) {
    this.form.controls[key].setValue(color)
    this.form.markAsDirty()
  }
}
