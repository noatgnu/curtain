import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from "../../data.service";
import { SettingsService } from "../../settings.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { PlotlyThemeService } from "../../plotly-theme.service";
import { ThemeService } from "../../theme.service";
import { WebService } from "../../web.service";
import { ToastService } from "../../toast.service";
import { Subscription } from "rxjs";

type PlotType = 'violin' | 'box' | 'histogram';
type Orientation = 'vertical' | 'horizontal';

interface SelectionStats {
  name: string;
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  color: string;
}

@Component({
  selector: 'app-selected-data-distribution-plot',
  templateUrl: './selected-data-distribution-plot.component.html',
  styleUrls: ['./selected-data-distribution-plot.component.scss'],
  standalone: false
})
export class SelectedDataDistributionPlotComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;
  revision = 0;
  graphData: any[] = [];
  graphLayout: any = {};

  loading = false;
  loadingMessage = '';

  plotType: PlotType = 'violin';
  orientation: Orientation = 'vertical';
  showPoints = true;
  showBox = true;
  showMeanLine = true;
  pointSize = 4;
  bandwidth = 0;

  selectedGroups: string[] = [];
  allGroups: string[] = [];

  statistics: SelectionStats[] = [];
  showStatistics = false;

  config: any = {
    toImageButtonOptions: {
      format: 'svg',
      filename: 'fold-change-distribution',
      scale: 1
    },
    responsive: true
  };

  constructor(
    private data: DataService,
    public settings: SettingsService,
    public modal: NgbActiveModal,
    private plotlyTheme: PlotlyThemeService,
    private themeService: ThemeService,
    private web: WebService,
    private toast: ToastService
  ) {
    this.initializeGroups();
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(() => {
      this.updateLayout();
      this.revision++;
    });

    this.drawPlot();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private initializeGroups(): void {
    this.allGroups = [...this.data.selectOperationNames];
    this.selectedGroups = [...this.allGroups];
  }

  private initializeLayout(): void {
    const isHorizontal = this.orientation === 'horizontal';
    const size = Math.min(window.innerWidth * 0.6, 800);

    this.graphLayout = {
      title: {
        text: 'Fold Change Distribution',
        font: { size: 16 }
      },
      xaxis: {
        tickfont: { size: 12 },
        tickvals: [],
        ticktext: [],
        title: isHorizontal ? '<b>Log2 Fold Change</b>' : '<b>Selection Groups</b>',
        tickangle: isHorizontal ? 0 : -45
      },
      yaxis: {
        tickfont: { size: 12 },
        title: isHorizontal ? '<b>Selection Groups</b>' : '<b>Log2 Fold Change</b>',
      },
      margin: { r: 50, l: 80, b: 100, t: 80 },
      height: isHorizontal ? Math.max(400, this.selectedGroups.length * 80) : 500,
      width: size,
      showlegend: this.selectedGroups.length > 1,
      legend: {
        orientation: 'h',
        y: -0.2,
        x: 0.5,
        xanchor: 'center'
      },
      font: {
        family: this.settings.settings.plotFontFamily + ", serif",
      }
    };

    this.config.toImageButtonOptions.height = this.graphLayout.height;
    this.config.toImageButtonOptions.width = this.graphLayout.width;
  }

  private updateLayout(): void {
    if (this.graphLayout) {
      this.graphLayout = this.plotlyTheme.applyThemeToLayout(this.graphLayout);
    }
  }

  async drawPlot(): Promise<void> {
    if (this.selectedGroups.length === 0) {
      this.toast.show("Distribution Plot", "Please select at least one group").then();
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Processing data...';

    try {
      await this.delay(50);
      const dataByGroup = this.collectData();

      this.loadingMessage = 'Calculating statistics...';
      await this.delay(50);
      this.calculateStatistics(dataByGroup);

      this.loadingMessage = 'Rendering plot...';
      await this.delay(50);

      this.initializeLayout();
      this.renderPlot(dataByGroup);
      this.updateLayout();
    } catch (error) {
      this.toast.show("Distribution Plot", "Error: " + (error as Error).message).then();
    } finally {
      this.loading = false;
      this.loadingMessage = '';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private collectData(): { [group: string]: number[] } {
    const dataByGroup: { [group: string]: number[] } = {};

    for (const group of this.selectedGroups) {
      dataByGroup[group] = [];
    }

    for (const row of this.data.differential.df) {
      const primaryId = row[this.data.differentialForm.primaryIDs];
      if (primaryId in this.data.selectedMap) {
        for (const group of this.selectedGroups) {
          if (this.data.selectedMap[primaryId][group]) {
            const foldChange = row[this.data.differentialForm.foldChange];
            if (!isNaN(foldChange)) {
              dataByGroup[group].push(foldChange);
            }
          }
        }
      }
    }

    return dataByGroup;
  }

  private calculateStatistics(dataByGroup: { [group: string]: number[] }): void {
    this.statistics = [];

    for (const group of this.selectedGroups) {
      const values = dataByGroup[group];
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / n;

      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
      const stdDev = Math.sqrt(variance);

      const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

      const q1Index = Math.floor(n * 0.25);
      const q3Index = Math.floor(n * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];

      this.statistics.push({
        name: group,
        count: n,
        mean,
        median,
        stdDev,
        min: sorted[0],
        max: sorted[n - 1],
        q1,
        q3,
        color: this.settings.settings.colorMap[group] || '#666666'
      });
    }
  }

  private renderPlot(dataByGroup: { [group: string]: number[] }): void {
    const traces: any[] = [];
    const tickVals: string[] = [];
    const tickText: string[] = [];
    const isHorizontal = this.orientation === 'horizontal';

    for (const group of this.selectedGroups) {
      const values = dataByGroup[group];
      if (values.length === 0) continue;

      const color = this.settings.settings.colorMap[group] || '#666666';
      tickVals.push(group);
      tickText.push(`${group} (n=${values.length})`);

      if (this.plotType === 'histogram') {
        traces.push({
          type: 'histogram',
          x: isHorizontal ? values : undefined,
          y: isHorizontal ? undefined : values,
          name: group,
          marker: {
            color: color,
            line: { color: 'white', width: 1 }
          },
          opacity: 0.7,
          nbinsx: 20
        });
      } else if (this.plotType === 'box') {
        traces.push({
          type: 'box',
          x: isHorizontal ? values : values.map(() => group),
          y: isHorizontal ? values.map(() => group) : values,
          name: group,
          marker: { color: color },
          fillcolor: color,
          line: { color: this.adjustColor(color, -30) },
          boxpoints: this.showPoints ? 'all' : false,
          jitter: 0.3,
          pointpos: 0,
          boxmean: this.showMeanLine ? 'sd' : false,
          orientation: isHorizontal ? 'h' : 'v'
        });
      } else {
        traces.push({
          type: 'violin',
          x: isHorizontal ? values : values.map(() => group),
          y: isHorizontal ? values.map(() => group) : values,
          name: group,
          points: this.showPoints ? 'all' : false,
          box: { visible: this.showBox },
          meanline: { visible: this.showMeanLine },
          line: { color: this.adjustColor(color, -30) },
          marker: {
            color: color,
            size: this.pointSize
          },
          fillcolor: color,
          spanmode: 'soft',
          bandwidth: this.bandwidth > 0 ? this.bandwidth : undefined,
          orientation: isHorizontal ? 'h' : 'v',
          side: 'both',
          scalemode: 'count'
        });
      }
    }

    this.graphData = traces;

    if (this.plotType !== 'histogram') {
      if (isHorizontal) {
        this.graphLayout.yaxis.tickvals = tickVals;
        this.graphLayout.yaxis.ticktext = tickText;
      } else {
        this.graphLayout.xaxis.tickvals = tickVals;
        this.graphLayout.xaxis.ticktext = tickText;
      }
    }

    this.revision++;
  }

  private adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  onPlotTypeChange(): void {
    this.drawPlot();
  }

  onOrientationChange(): void {
    this.drawPlot();
  }

  onDisplayOptionChange(): void {
    this.drawPlot();
  }

  toggleGroup(group: string): void {
    const index = this.selectedGroups.indexOf(group);
    if (index > -1) {
      this.selectedGroups.splice(index, 1);
    } else {
      this.selectedGroups.push(group);
    }
  }

  isGroupSelected(group: string): boolean {
    return this.selectedGroups.includes(group);
  }

  selectAllGroups(): void {
    this.selectedGroups = [...this.allGroups];
    this.drawPlot();
  }

  deselectAllGroups(): void {
    this.selectedGroups = [];
  }

  downloadPlot(format: 'svg' | 'png' = 'svg'): void {
    this.config.toImageButtonOptions.format = format;
    this.web.downloadPlotlyImage(format, 'fold-change-distribution', 'foldChangeDistribution');
  }

  exportCSV(): void {
    const headers = ['Group', 'Primary ID', 'Fold Change'];
    const rows: string[][] = [];

    for (const row of this.data.differential.df) {
      const primaryId = row[this.data.differentialForm.primaryIDs];
      if (primaryId in this.data.selectedMap) {
        for (const group of this.selectedGroups) {
          if (this.data.selectedMap[primaryId][group]) {
            const foldChange = row[this.data.differentialForm.foldChange];
            rows.push([group, primaryId, foldChange.toString()]);
          }
        }
      }
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fold-change-distribution.csv';
    link.click();
    URL.revokeObjectURL(link.href);

    this.toast.show("Export", "Data exported to CSV").then();
  }

  exportStatistics(): void {
    const headers = ['Group', 'Count', 'Mean', 'Median', 'Std Dev', 'Min', 'Max', 'Q1', 'Q3'];
    const rows = this.statistics.map(s => [
      s.name,
      s.count.toString(),
      s.mean.toFixed(4),
      s.median.toFixed(4),
      s.stdDev.toFixed(4),
      s.min.toFixed(4),
      s.max.toFixed(4),
      s.q1.toFixed(4),
      s.q3.toFixed(4)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fold-change-statistics.csv';
    link.click();
    URL.revokeObjectURL(link.href);

    this.toast.show("Export", "Statistics exported to CSV").then();
  }

  copyStatistics(): void {
    const headers = ['Group', 'Count', 'Mean', 'Median', 'Std Dev', 'Min', 'Max', 'Q1', 'Q3'];
    const rows = this.statistics.map(s => [
      s.name,
      s.count.toString(),
      s.mean.toFixed(4),
      s.median.toFixed(4),
      s.stdDev.toFixed(4),
      s.min.toFixed(4),
      s.max.toFixed(4),
      s.q1.toFixed(4),
      s.q3.toFixed(4)
    ]);

    const text = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      this.toast.show("Clipboard", "Statistics copied to clipboard").then();
    });
  }

  getTotalCount(): number {
    return this.statistics.reduce((sum, s) => sum + s.count, 0);
  }

  getOverallMean(): number {
    if (this.statistics.length === 0) return 0;
    const total = this.statistics.reduce((sum, s) => sum + s.mean * s.count, 0);
    const count = this.getTotalCount();
    return count > 0 ? total / count : 0;
  }
}
