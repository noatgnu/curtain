import {Component, OnInit} from '@angular/core';
import {GraphData} from "./classes/graph-data";
import {DataFrame, IDataFrame} from "data-forge";
import {parse} from "@angular/compiler/src/render3/view/style_parser";
import {WebService} from "./service/web.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DbStringService} from "./service/db-string.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'curtain';

  constructor() {

  }

  ngOnInit() {
  }
}
