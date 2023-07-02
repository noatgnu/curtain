import { Component } from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {WebsocketService} from "./websocket.service";

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
  }
}
