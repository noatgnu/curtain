import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AccountsService} from "../../accounts/accounts.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {PlotlyThemeService} from "../../plotly-theme.service";
import {ThemeService} from "../../theme.service";
import {Subject, takeUntil} from "rxjs";

@Component({
    selector: 'app-curtain-stats-summary',
    templateUrl: './curtain-stats-summary.component.html',
    styleUrls: ['./curtain-stats-summary.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurtainStatsSummaryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  revisionDownload = 0;
  revisionCreated = 0;
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
  constructor(private accounts: AccountsService, public modal: NgbActiveModal, private plotlyTheme: PlotlyThemeService, private themeService: ThemeService, private cdr: ChangeDetectorRef) {
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
      this.graphLayoutDownload = this.plotlyTheme.applyThemeToLayout(this.graphLayoutDownload);
      this.graphLayoutCreated = this.plotlyTheme.applyThemeToLayout(this.graphLayoutCreated);
      this.cdr.markForCheck();
    })
  }

  ngOnInit(): void {
    this.themeService.theme$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.graphLayoutDownload = this.plotlyTheme.applyThemeToLayout(this.graphLayoutDownload);
      this.graphLayoutCreated = this.plotlyTheme.applyThemeToLayout(this.graphLayoutCreated);
      this.revisionDownload++;
      this.revisionCreated++;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
