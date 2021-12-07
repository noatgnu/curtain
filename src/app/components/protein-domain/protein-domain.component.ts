import {Component, Input, OnInit} from '@angular/core';
import {UniprotService} from "../../service/uniprot.service";
import {findLast} from "@angular/compiler/src/directive_resolver";

@Component({
  selector: 'app-protein-domain',
  templateUrl: './protein-domain.component.html',
  styleUrls: ['./protein-domain.component.css']
})
export class ProteinDomainComponent implements OnInit {
  get proteinID(): string {
    return this._proteinID;
  }



  private _proteinID: string = ""
  @Input() set proteinID(value: string) {
    this._proteinID = value;
    if (value) {
      if (value !== "") {
        let last = 1
        const waterfallPlot: any = {
          type: "waterfall",
          orientation: "h",
          measure: [],
          y: [],
          x: [],
          connector: {
            mode: "between"
          },
          text: [],
          hoverinfo: "text",
          base: 1
        }
        console.log(this.uniprot.results.get(value)["Domain [FT]"])
        for (const d of this.uniprot.results.get(value)["Domain [FT]"]) {
          if (d.start-1 > last) {
            waterfallPlot.measure.push("relative")
            waterfallPlot.y.push("Other")
            waterfallPlot.x.push(d.start-last)
            if (last !== 1) {
              waterfallPlot.text.push((last+1) + " - " + (d.start-1) + "; " + "Other")
            } else {
              waterfallPlot.text.push(1 + " - " + (d.start-1) + "; " + "Other")
            }

            last = d.start-1

          }
          waterfallPlot.measure.push("relative")
          waterfallPlot.y.push(d.name)
          waterfallPlot.x.push(d.end-last)
          waterfallPlot.text.push(d.start + " - " + (d.end) + "; " + d.name)
          last = d.end
        }
        if (parseInt(this.uniprot.results.get(value)["Length"]) - 1 > last) {
          waterfallPlot.measure.push("relative")
          waterfallPlot.y.push("Other")
          waterfallPlot.x.push(parseInt(this.uniprot.results.get(value)["Length"])-last)
          waterfallPlot.text.push(last + " - " + parseInt(this.uniprot.results.get(value)["Length"]) + "; " + "Other")
        }
        this.data = [waterfallPlot]

      }
    }
  }
  data: any[] = []
  layout: any = {
    title: {
      text: "Protein Domains"
    },
    yaxis: {
      type: "category"
    },
    xaxis: {
      type: "linear",
      showgrid: false,
      zeroline: false,
      showline: false,
      autotick: true,
      ticks: '',
      showticklabels: false
    }, margin: {l:200},
    showlegend: false
  }
  constructor(private uniprot: UniprotService) { }

  ngOnInit(): void {
  }

}
