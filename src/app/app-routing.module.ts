import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {DataciteComponent} from "./components/datacite/datacite.component";

const routes: Routes = [
  {
    path: 'datacite', component: DataciteComponent
  },
  {
    path: 'datacite/:linkID', component: DataciteComponent
  },
  {
    path: '', component: HomeComponent,
    children: [
      {
        path: 'home', component: HomeComponent
      },
      {
        path: "home/:settings", component: HomeComponent
      },
    ],

  },
  {path: ':settings', component: HomeComponent},
  {path: "**", redirectTo:"home"}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
