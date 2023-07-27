import { Component } from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {Enrichr} from "enrichrjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Curtain';

  constructor(private accounts: AccountsService) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      this.accounts.ORCIDLogin(code[1]).then((data: any) => {})
    }
    this.testEnrichr().then()
  }

  async testEnrichr() {
  }
}
