import { Component } from '@angular/core';
import {AccountsService} from "../../accounts/accounts.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-curtain-stats-summary',
  templateUrl: './curtain-stats-summary.component.html',
  styleUrls: ['./curtain-stats-summary.component.scss']
})
export class CurtainStatsSummaryComponent {
  graphDataDownload: any[] = []
  graphDataCreated: any[] = []
  graphLayoutDownload: any = {
    title: 'Session download counts',
    xaxis: {
      title: 'Date',
      type: 'date',
    },
    yaxis: {
      title: 'Number of download',
      type: 'linear',
    }
  }
  graphLayoutCreated: any = {
    title: 'Curtain session created',
    xaxis: {
      title: 'Date',
      type: 'date',
    },
    yaxis: {
      title: 'Number of session',
      type: 'linear',
    }
  }
  constructor(private accounts: AccountsService, public modal: NgbActiveModal) {
    this.accounts.curtainAPI.getStatsSummary(30).then((data: any) => {
      const weekDownload: any[] = data.data["session_download_per_week"]
      const weekCreated: any[] = data.data["session_created_per_week"]
      const weekDownloadData: any = {
        x: [],
        y: [],
        marker: {
          "color": "rgba(229,176,63,0.96)"
        },
        line: {
          color: "black"
        },
        type: "bar",
        showlegend: false
      }
      const weekCreatedData: any = {
        x: [],
        y: [],
        marker: {
          "color": "rgb(236,96,99)"
        },
        line: {
          color: "black"
        },
        type: "bar",
        showlegend: false
      }

      weekDownload.forEach((x: any) => {
        weekDownloadData.x.push(x["date"])
        weekDownloadData.y.push(x["downloads"])
      })
      weekCreated.forEach((x: any) => {
        weekCreatedData.x.push(x["date"])
        weekCreatedData.y.push(x["count"])
      })
      this.graphDataCreated.push(weekCreatedData)
      this.graphDataDownload.push(weekDownloadData)
    })
  }
}
