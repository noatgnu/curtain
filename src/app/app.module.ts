import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { DatatableViewerComponent } from './components/datatable-viewer/datatable-viewer.component';
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import { ComparisonViewerComponent } from './components/comparison-viewer/comparison-viewer.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { DistributionViewerComponent } from './components/distribution-viewer/distribution-viewer.component';
import { ProfilePlotComponent } from './components/profile-plot/profile-plot.component';
import { StringAnalysisComponent } from './components/string-analysis/string-analysis.component';
import { InteractionDatatableComponent } from './components/interaction-datatable/interaction-datatable.component';
import { HomeComponent } from './components/home/home.component';
import { NotificationComponent } from './components/notification/notification.component';
import { NotificationContainerComponent } from './components/notification-container/notification-container.component';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    AppComponent,
    FileUploaderComponent,
    ScatterPlotComponent,
    DatatableViewerComponent,
    ComparisonViewerComponent,
    BarChartComponent,
    DistributionViewerComponent,
    ProfilePlotComponent,
    StringAnalysisComponent,
    InteractionDatatableComponent,
    HomeComponent,
    NotificationComponent,
    NotificationContainerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PlotlyModule,
    NgbModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    NgxDatatableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
