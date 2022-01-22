
import {AfterViewInit, Component, Input, OnInit} from '@angular/core';

import * as cytoscape from "cytoscape";

@Component({
  selector: 'app-cytoplot',
  templateUrl: './cytoplot.component.html',
  styleUrls: ['./cytoplot.component.css']
})
export class CytoplotComponent implements OnInit, AfterViewInit {
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

    this.cy.layout({name: "cose", maxSimulationTime: 10000}).run()
  }
}
