import {AfterViewInit, Component} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {Enrichr} from "enrichrjs";
import {SwUpdate} from "@angular/service-worker";
import {SettingsService} from "./settings.service";
import {WebsocketService} from "./websocket.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CurtainStatsSummaryComponent} from "./components/curtain-stats-summary/curtain-stats-summary.component";
import {loadFromLocalStorage} from "curtain-web-api";
import {DataService} from "./data.service";
import {environment} from "../environments/environment";
import {CitationComponent} from "./components/citation/citation.component";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements AfterViewInit {
  title = 'Curtain';
  baseURL = environment.apiURL
  constructor(private accounts: AccountsService, private swUpdate: SwUpdate, private data: DataService,  private settings: SettingsService, private ws: WebsocketService, private modal: NgbModal) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      this.accounts.ORCIDLogin(code[1]).then((data: any) => {
        console.log(data)
      })
    }
    this.ws.connectJob()
    this.ws.getJobMessages()?.subscribe((data: any) => {
      console.log(data)
    })
  }

  ngAfterViewInit() {
    if (this.swUpdate.isEnabled) {
      setInterval(() => {
        this.swUpdate.checkForUpdate().then((available) => {
          if (available) {
            this.settings.newVersionAvailable = true;
            console.log("New version available")
          } else {
            console.log("No new version available")
          }
        })
      }, 1000*10)
    } else {
      console.log("Service worker not enabled")
    }
  }

  openStatsSummary() {
    this.modal.open(CurtainStatsSummaryComponent, {size: "xl"})
  }

  openResourceCitation() {
    this.modal.open(CitationComponent)
  }


}
