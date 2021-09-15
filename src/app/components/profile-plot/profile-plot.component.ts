import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../service/data.service";
import {UniprotService} from "../../service/uniprot.service";

@Component({
  selector: 'app-profile-plot',
  templateUrl: './profile-plot.component.html',
  styleUrls: ['./profile-plot.component.css']
})
export class ProfilePlotComponent implements OnInit {
 _data: IDataFrame = new DataFrame()
  graphData: any[] = []
  graphLayout: any = {title: "profile"}
  @Input() set data(value: IDataFrame) {
    this._data = value
    //this.drawBoxPlot()
    console.log(value)
  }



  allSelected: string[] = []
  constructor(private dataService: DataService, private uniprot: UniprotService) {

  }
  box: any[] = []
  ngOnInit(): void {
    this.dataService.annotationSelect.subscribe(data => {
      console.log(this._data)
      this.allSelected = this.dataService.allSelected
      this.drawBoxPlot()
    })
  }
  boxFilled: boolean = false

  drawBoxPlot() {
    this.graphData = []
    if (this._data.count() >0){
      if (this.box.length === 0) {
        for (const s of this.dataService.sampleColumns) {
          const y: number[] = []
          console.log(s)
          for (const i of this._data.getSeries(s).bake().toArray()) {
            y.push(Math.log10(i))
          }
          const a = {
            y: y,
            type: "box",
            name: s,
            boxpoints: false,
            marker: {
              color: "black"
            },
            showlegend: false
          }
          this.graphData.push(a)
          //this.box.push(a)
        }
      } else {
        for (const b of this.box) {
          this.graphData.push(this.box)
        }
      }
      if (this.dataService.allSelected.length >0) {
        for (const r of this._data) {
          if (this.dataService.allSelected.includes(r.Proteins)) {
            const x: any[] = []
            const y: any[] = []
            for (const s of this.dataService.sampleColumns) {
              x.push(s)
              y.push(Math.log10(r[s]))
            }
            const g = {
              x: x,
              y: y,
              mode: "lines",
              name: r.Proteins
            }
            if (this.uniprot.results.has(r.Proteins)) {
              if (this.uniprot.results.get(r.Proteins)) {
                g.name = this.uniprot.results.get(r.Proteins)["Gene names"]
              }
            }
            this.graphData.push(g)
          }
        }
      }
    }

    console.log(this.graphData)
  }
}
