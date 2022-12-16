import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './components/home/home.component';
import { FileInputWidgetComponent } from './components/file-input-widget/file-input-widget.component';
import { FileFormComponent } from './components/file-form/file-form.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from "@angular/common/http";
import { VolcanoPlotComponent } from './components/volcano-plot/volcano-plot.component';
import { VolcanoAndCytoComponent } from './components/volcano-and-cyto/volcano-and-cyto.component';
import { CytoplotComponent } from './components/cytoplot/cytoplot.component';
import { ProteinSelectionsComponent } from './components/protein-selections/protein-selections.component';
import { BatchSearchComponent } from './components/batch-search/batch-search.component';
import { NetworkInteractionsComponent } from './components/network-interactions/network-interactions.component';
import { RawDataViewerComponent } from './components/raw-data-viewer/raw-data-viewer.component';
import { RawDataBlockComponent } from './components/raw-data-block/raw-data-block.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { ProteinDomainPlotComponent } from './components/protein-domain-plot/protein-domain-plot.component';
import { ProteinInformationComponent } from './components/protein-information/protein-information.component';
import { ProteomicsDbComponent } from './components/proteomics-db/proteomics-db.component';
import { StringDbComponent } from './components/string-db/string-db.component';
import { InteractomeAtlasComponent } from './components/interactome-atlas/interactome-atlas.component';
import { PdbViewerComponent } from './components/pdb-viewer/pdb-viewer.component';
import { FdrCurveComponent } from './components/fdr-curve/fdr-curve.component';
import { VolcanoColorsComponent } from './components/volcano-colors/volcano-colors.component';
import {ColorPickerModule} from "ngx-color-picker";
import { QuickNavigationComponent } from './components/quick-navigation/quick-navigation.component';
import { ProfilePlotComponent } from './components/profile-plot/profile-plot.component';
import { ProfileCompareComponent } from './components/profile-compare/profile-compare.component';
import { ExperimentalArtComponent } from './components/experimental-art/experimental-art.component';
import { CorrelationMatrixComponent } from './components/correlation-matrix/correlation-matrix.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { CitationComponent } from './components/citation/citation.component';
import { SampleAnnotationComponent } from './components/sample-annotation/sample-annotation.component';
import { PrideComponent } from './components/pride/pride.component';
import {QuillModule} from "ngx-quill";
import {NgxPrintModule} from "ngx-print";
import { SampleOrderAndHideComponent } from './components/sample-order-and-hide/sample-order-and-hide.component';
import { ComparisonSelectionsComponent } from './components/comparison-selections/comparison-selections.component';
import { RankPlotComponent } from './components/rank-plot/rank-plot.component';
import { VolcanoPlotTextAnnotationComponent } from './components/volcano-plot-text-annotation/volcano-plot-text-annotation.component';
import {TokenInterceptor} from "./token.interceptor";
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { SessionSettingsComponent } from './components/session-settings/session-settings.component';
import { AccountsComponent } from './components/accounts/accounts.component';
PlotlyModule.plotlyjs = PlotlyJS;
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FileInputWidgetComponent,
    FileFormComponent,
    VolcanoPlotComponent,
    VolcanoAndCytoComponent,
    CytoplotComponent,
    ProteinSelectionsComponent,
    BatchSearchComponent,
    NetworkInteractionsComponent,
    RawDataViewerComponent,
    RawDataBlockComponent,
    BarChartComponent,
    ProteinDomainPlotComponent,
    ProteinInformationComponent,
    ProteomicsDbComponent,
    StringDbComponent,
    InteractomeAtlasComponent,
    PdbViewerComponent,
    FdrCurveComponent,
    VolcanoColorsComponent,
    QuickNavigationComponent,
    ProfilePlotComponent,
    ProfileCompareComponent,
    ExperimentalArtComponent,
    CorrelationMatrixComponent,
    ToastContainerComponent,
    CitationComponent,
    SampleAnnotationComponent,
    PrideComponent,
    SampleOrderAndHideComponent,
    ComparisonSelectionsComponent,
    RankPlotComponent,
    VolcanoPlotTextAnnotationComponent,
    LoginModalComponent,
    SessionSettingsComponent,
    AccountsComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgbModule,
        FormsModule,
        HttpClientModule,
        PlotlyModule,
        ReactiveFormsModule,
        ColorPickerModule,
        QuillModule.forRoot(),
      NgxPrintModule
    ],
  providers: [HttpClient,
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
