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

  private _data: any = {}
  cutoff: number = 0
  enableFilter: boolean = false
  @Input() set data(value: any) {
    this._data = value
    if (this.uniprot.results.has(value)) {
      this.geneName = this.uniprot.results.get(value)["Gene names"]
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
      this.interac.getInteractions(this.geneName).subscribe(data => {
        console.log(this.geneName)
        console.log(this.data)
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
    console.log(this.interactions)
    console.log(this.dataService.noChange)

    for (const i of this.interactions["all_proteins"]) {
      let classes: string[] = []
      /**/
      if (i["protein_gene_name"] === this.data) {
        classes.push("root")
      }
      console.log(i["protein_gene_name"])
      if (this.dataService.increase.includes(i["protein_gene_name"])) {
        classes.push("increase")
      } else if (this.dataService.decrease.includes(i["protein_gene_name"])) {
        classes.push("decrease")
      } else if (this.dataService.noChange.includes(i["protein_gene_name"])) {
        classes.push("noChange")
      }

      nodes.push({data:
          {
            id: "node" + i["protein_id"],
            label: i["protein_gene_name"],
            size: 5
          }, classes: classes.join(" ")
      })
    }
    for (const i of this.interactions["all_interactions"]) {
      let score = parseFloat(i["score"])
      this.evidences[i["interaction_id"]] = []
      for (const d of i["dataset_array"]) {
        this.evidences[i["interaction_id"]].push({status: d["interaction_status"], reference: d["dataset_reference"], name: d["year"]})
      }
      let classes: string[] = []
      const interactions: string[] = []
      for (const interaction of i["interaction_category_array"]["interaction_category_array"]) {
        interactions.push(interaction["category_name"])
      }
      classes.push(interactions.join(""))
      classes.push(i["interaction_id"] + i["interactor_A"]["protein_id"])
      if (isNaN(score)) {
        score = 2
        classes.push("noscore")
      } else {
        score = 2 + 3*score
      }
      if (this.enableFilter) {
        if (!isNaN(score)) {
          if (score > this.cutoff) {
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
      {selector: ".increase", style: {label: "data(label)", "background-color": "#a12323", "color": "#a12323",}}
    )
    styles.push(
      {selector: ".decrease", style: {label: "data(label)", "background-color": "#16458c", "color": "#16458c",}}
    )
    styles.push(
      {selector: ".noChange", style: {label: "data(label)", "background-color": "rgba(25,128,128,0.96)", "color": "rgba(47,39,40,0.96)",}}
    )
    this.drawData = {data: nodes, stylesheet: styles}
  }

  viewEvidences(event: any) {

  }
}
