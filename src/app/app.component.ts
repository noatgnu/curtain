import {AfterViewInit, Component} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {Enrichr} from "enrichrjs";
import {SwUpdate} from "@angular/service-worker";
import {SettingsService} from "./settings.service";
import {WebsocketService} from "./websocket.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CurtainStatsSummaryComponent} from "./components/curtain-stats-summary/curtain-stats-summary.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'Curtain';

  constructor(private accounts: AccountsService, private swUpdate: SwUpdate, private settings: SettingsService, private ws: WebsocketService, private modal: NgbModal) {
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
          }
        })
      }, 1000*60)
    }
  }

  openStatsSummary() {
    this.modal.open(CurtainStatsSummaryComponent, {size: "xl"})
  }
}
