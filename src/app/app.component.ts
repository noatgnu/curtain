import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {SwUpdate} from "@angular/service-worker";
import {SettingsService} from "./settings.service";

import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CurtainStatsSummaryComponent} from "./components/curtain-stats-summary/curtain-stats-summary.component";
import {DataService} from "./data.service";
import {environment} from "../environments/environment";
import {CitationComponent} from "./components/citation/citation.component";
import {AnalyticsService} from "./analytics.service";
import {Subject} from "rxjs";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'Curtain';
  baseURL = environment.apiURL
  private destroy$ = new Subject<void>();
  private updateCheckIntervalId: number | null = null;

  constructor(private accounts: AccountsService, private swUpdate: SwUpdate, private data: DataService, private settings: SettingsService, private modal: NgbModal, private analytics: AnalyticsService) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      const rememberMe = localStorage.getItem("orcidRememberMe") === "true"
      this.accounts.ORCIDLogin(code[1], rememberMe).then(() => {
        localStorage.removeItem("orcidRememberMe")
      })
    }
    this.analytics.initialize()
  }

  ngAfterViewInit() {
    if (this.swUpdate.isEnabled) {
      this.updateCheckIntervalId = window.setInterval(() => {
        this.swUpdate.checkForUpdate().then((available) => {
          if (available) {
            this.settings.newVersionAvailable = true;
          }
        })
      }, 1000*10)
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.updateCheckIntervalId !== null) {
      window.clearInterval(this.updateCheckIntervalId);
    }
  }

  openStatsSummary() {
    this.modal.open(CurtainStatsSummaryComponent, {size: "xl"})
  }

  openResourceCitation() {
    this.modal.open(CitationComponent)
  }


}
