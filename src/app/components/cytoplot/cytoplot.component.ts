
import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import * as cytoscape from "cytoscape";

@Component({
  selector: 'app-cytoplot',
  templateUrl: './cytoplot.component.html',
  styleUrls: ['./cytoplot.component.css']
})
export class CytoplotComponent implements OnInit, AfterViewInit {
  @Output() clickedID = new EventEmitter<string>()
  cy: any
  get drawData(): any {
    return this._drawData
  }

  _drawData: any = {}
  @Input() set drawData(value: any) {
    this._drawData = value
    console.log(value)
    this.draw()
  }
  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
  }

  draw() {
    this.cy = cytoscape(
      {
        container: document.getElementById("cy"),
        elements: this.drawData.data,
        style: this.drawData.stylesheet
      }
      )

    const ad = this

    this.cy.layout({name: "cose", maxSimulationTime: 10000}).run()
    for (const n of this.cy.nodes()) {
      n.bind("click", function (event:any) {
        ad.clickedID.emit(event.target.id())
      })
    }
    for (const n of this.cy.edges()) {
      n.bind("click", function (event:any) {
        ad.clickedID.emit(event.target.id())
      })
    }
  }
}
