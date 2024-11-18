import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {DataciteComponent} from "./datacite.component";

const route: Routes = [
  {
    path: "",
    component: DataciteComponent
  }
]


@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(route)
  ]
})
export class DataciteModule { }
