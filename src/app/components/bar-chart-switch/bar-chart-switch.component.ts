import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";

@Component({
  selector: 'app-bar-chart-switch',
  templateUrl: './bar-chart-switch.component.html',
  styleUrls: ['./bar-chart-switch.component.css']
})
export class BarChartSwitchComponent implements OnInit {
  @Input() data: IDataFrame = new DataFrame();
  average: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
