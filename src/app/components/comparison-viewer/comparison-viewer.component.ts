import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {GraphData} from "../../classes/graph-data";
import {DrawPack} from "../../classes/draw-pack";
import {DataService} from "../../service/data.service";

@Component({
  selector: 'app-comparison-viewer',
  templateUrl: './comparison-viewer.component.html',
  styleUrls: ['./comparison-viewer.component.css']
})
export class ComparisonViewerComponent implements OnInit {
  pCutOff: number = 0.00001
  logFCCutoff: number = 2
  upRegulated: IDataFrame = new DataFrame()
  downRegulated: IDataFrame = new DataFrame()

  _data: IDataFrame = new DataFrame()

  drawPack: DrawPack = new DrawPack()

  @Input() set data(value: IDataFrame) {
    this.downRegulated = value.where(row => row["logFC"] < 0).bake()
    this.upRegulated = value.where(row => row["logFC"] > 0).bake()
    this._data = value
    this.drawPack = new DrawPack()
    this.drawPack.df = this._data
    this.drawPack.pCutOff = this.pCutOff
  }

  get data(): IDataFrame {
    return this._data
  }
  constructor() {

  }

  ngOnInit(): void {
  }

  changeInput(e: Event) {
    e.stopPropagation()

    this.drawPack = new DrawPack()
    this.drawPack.df = this._data
    this.drawPack.pCutOff = this.pCutOff
    this.drawPack.logFCCutoff = this.logFCCutoff
  }
}
