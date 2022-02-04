import {Component, Input, OnInit} from '@angular/core';
import {InteractomeAtlasService} from "../../service/interactome-atlas.service";
import {DataService} from "../../service/data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {UniprotService} from "../../service/uniprot.service";

@Component({
  selector: 'app-interactome',
  templateUrl: './interactome.component.html',
  styleUrls: ['./interactome.component.css']
})
export class InteractomeComponent implements OnInit {
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
      this.geneName = uni["Gene names"]
    } else {
      this.geneName = ""
    }
    this.getInteractions()
  }
  geneName: string = ""
  interactions: any = {}
  drawData: any = {data: [], stylesheet: []}
  evidences: any = {}
  constructor(public activeModal: NgbActiveModal, private uniprot: UniprotService, private interac: InteractomeAtlasService, private dataService: DataService) { }

  ngOnInit(): void {
  }

  getInteractions() {
    if (this.geneName !== "") {
      this.interac.getInteractions(this.geneName.split(";")[0]).subscribe(data => {
        if (data.body) {
          if (typeof data.body === "string") {
            this.interactions = JSON.parse(data.body)
            this.reformatInteraction()
          }
        }
      })
    }
  }

  reformatInteraction() {
    const styles: any[] = []
    const nodes: any[] = []
    const interacted: string[] = []
    const interactedMap: Map<string, any[]> = new Map<string, any[]>()
    for (const i of this.interactions["all_interactions"]) {
      let oScore = parseFloat(i["score"])
      this.evidences[i["interaction_id"]] = []
      for (const d of i["dataset_array"]) {
        this.evidences[i["interaction_id"]].push(d)
      }
      interactedMap.set("edge"+i["interaction_id"], this.evidences[i["interaction_id"]].slice())
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
        score = 2 + 3*oScore
      }
      if (!interactedMap.has("node"+i["interactor_A"]["protein_id"])) {
        interactedMap.set("node"+i["interactor_A"]["protein_id"], this.evidences[i["interaction_id"]].slice())
      } else {
        for (const i2 of this.evidences[i["interaction_id"]]) {
          // @ts-ignore
          interactedMap.get("node"+i["interactor_A"]["protein_id"]).push(i2)
        }
      }
      if (!interactedMap.has("node"+i["interactor_B"]["protein_id"])) {
        interactedMap.set("node"+i["interactor_B"]["protein_id"], this.evidences[i["interaction_id"]].slice())
      } else {
        for (const i2 of this.evidences[i["interaction_id"]]) {
          // @ts-ignore
          interactedMap.get("node"+i["interactor_B"]["protein_id"]).push(i2)
        }
      }
      if (this.enableFilter) {
        if (!isNaN(oScore)) {
          if (oScore > this.cutoff) {
            interacted.push(i["interactor_A"]["protein_id"])
            interacted.push(i["interactor_B"]["protein_id"])
            nodes.push({
              data: {id: "edge"+i["interaction_id"], source: "node"+i["interactor_A"]["protein_id"], target: "node"+i["interactor_B"]["protein_id"], score: score},
              classes: classes.join(" ")
            })

          }
        }
      } else {
        nodes.push({
          data: {id: "edge"+i["interaction_id"], source: "node"+i["interactor_A"]["protein_id"], target: "node"+i["interactor_B"]["protein_id"], score: score},
          classes: classes.join(" ")
        })
      }
    }

    this.interactedMap = interactedMap

    for (const i of this.interactions["all_proteins"]) {
      let classes: string[] = []
      if (i["protein_gene_name"] === this.data) {
        classes.push("root")
      }
      if (this.dataService.increase.includes(i["protein_gene_name"])) {
        classes.push("increase")
      } else if (this.dataService.decrease.includes(i["protein_gene_name"])) {
        classes.push("decrease")
      } else if (this.dataService.noChange.includes(i["protein_gene_name"])) {
        classes.push("noChange")
      }
      if (this.enableFilter) {
        if (interacted.includes(i["protein_id"])) {
          nodes.push({data:
              {
                id: "node" + i["protein_id"],
                label: i["protein_gene_name"],
                size: 5
              }, classes: classes.join(" ")
          })
        }
      } else {
        nodes.push({data:
            {
              id: "node" + i["protein_id"],
              label: i["protein_gene_name"],
              size: 5
            }, classes: classes.join(" ")
        })
      }

    }

    styles.push(
      {selector: "node", style:
          {label: "data(label)",
            "background-color": "rgba(25,128,128,0.96)",
            "color": "#fffffe",
            "text-valign": "center",
            "text-halign": "center",
            "text-outline-width": "1px",
            "text-outline-color": "rgb(16,10,10)"
          }}
    )
    styles.push(
      {selector: "edge", style: {"line-color": "rgba(25,128,128,0.96)", width: "data(score)"}}
    )
    styles.push(
      {selector: ".noscore", style: {"line-color": "rgba(47,39,40,0.96)", width: "data(score)"}}
    )
    styles.push(
      {selector: ".HI-Union", style: {"line-color": "rgba(82,110,194,0.96)", width: "data(score)"}}
    )
    styles.push(
      {selector: ".Literature", style: {"line-color": "rgba(181,151,222,0.96)", width: "data(score)"}}
    )
    styles.push(
      {selector: ".HI-UnionLiterature", style: {"line-color": "rgba(222,178,151,0.96)", width: "data(score)"}}
    )
    styles.push(
      {selector: ".root", style: {label: "data(label)", "background-color": "#765cd0"}}
    )
    styles.push(
      {selector: ".increase", style: {label: "data(label)", "background-color": "#a12323", "color": "#ce8080",}}
    )
    styles.push(
      {selector: ".decrease", style: {label: "data(label)", "background-color": "#16458c", "color": "#6f94bb",}}
    )
    styles.push(
      {selector: ".noChange", style: {label: "data(label)", "background-color": "rgba(25,128,128,0.96)", "color": "rgba(47,39,40,0.96)",}}
    )
    this.drawData = {data: nodes, stylesheet: styles}
  }

  viewEvidences(event: any) {
    // @ts-ignore
    this.selected = this.interactedMap.get(event)
    console.log(this.interactedMap.get(event))
  }
}
