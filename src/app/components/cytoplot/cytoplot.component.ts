import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as cytoscape from "cytoscape";
import * as fcose from "cytoscape-fcose";

// @ts-ignore
import * as cytoscapeSVG from "cytoscape-svg";
import {SettingsService} from "../../settings.service";

cytoscape.use(cytoscapeSVG);
cytoscape.use(fcose);
@Component({
  selector: 'app-cytoplot',
  templateUrl: './cytoplot.component.html',
  styleUrls: ['./cytoplot.component.scss']
})
export class CytoplotComponent implements OnInit, AfterViewInit {
  @Output() clickedID = new EventEmitter<string>()
  @Output() ready = new EventEmitter<boolean>()
  cy: any
  componentID: string = "cy"
  get drawData(): any {
    return this._drawData
  }

  _drawData: any = {}
  @Input() set drawData(value: any) {
    this._drawData = value
    if(this._drawData) {
      if (this._drawData.data.length > 2) {
        this.componentID = this._drawData.id
        setTimeout(() => {
          this.draw()
        }, 3000)
      }
    }
  }

  constructor(private settings: SettingsService) { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
  }

  draw() {
    console.log(this._drawData)
    const container = document.getElementById(this._drawData.id)
    console.log(container)
    if (!this.cy) {
      this.cy = cytoscape(
        {
          container: container,
          elements: this._drawData.data,
          style: this._drawData.stylesheet
        }
      )
      if (this.settings.settings.networkInteractionData.length > 0) {
        this.cy.layout({name: "preset"}).run()
      } else {
        //this.cy.layout({name: "cose", maxSimulationTime: 10000}).run()
        this.cy.layout({name: "fcose"}).run()
      }

    } else {
      this.cy.elements().remove()
      this.cy.add(this._drawData.data)
      this.cy.style(this._drawData.stylesheet)
      this.cy.layout({name: "fcose"}).run()
    }

    const ad = this
    this.cy.ready(() => {
      ad.ready.emit(true)
    })

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
    console.log(this.cy)
  }

  download() {
    const svgContent = this.cy.svg({full:true})
    console.log(svgContent)
    const blob = new Blob([svgContent], {type:"image/svg+xml;charset=utf-8"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a")
    a.href = url
    a.download = "cytoplot.svg"
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url)
  }

  saveJSON() {
    return this.cy.elements().jsons()
  }
}
