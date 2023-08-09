import {AfterViewInit, Component} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {Enrichr} from "enrichrjs";
import {SwUpdate} from "@angular/service-worker";
import {SettingsService} from "./settings.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'Curtain';

  constructor(private accounts: AccountsService, private swUpdate: SwUpdate, private settings: SettingsService) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      this.accounts.ORCIDLogin(code[1]).then((data: any) => {})
    }
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
}
