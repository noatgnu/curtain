import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Curtain';

  constructor() {
    if (document.URL.includes("#access_token" )) {
      const l = document.URL.replace(window.location.origin+"/#", "")
      const data: any[] = []
      for (const i of l.split("&")) {
        for (const d of i.split("=")) {
          data.push(d)
        }
      }
    }

  }
}
