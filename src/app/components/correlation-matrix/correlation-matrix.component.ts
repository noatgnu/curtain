import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from "../../data.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastService } from "../../toast.service";
import { WebService } from "../../web.service";
import { SettingsService } from "../../settings.service";
import { PlotlyThemeService } from "../../plotly-theme.service";
import { ThemeService } from "../../theme.service";
import { Subscription } from "rxjs";

interface CorrelationResult {
  column_x: string;
  column_y: string;
  correlation: number;
}

interface CorrelationCell {
  x: string;
  y: string;
  value: number;
}

type CorrelationMethod = 'pearson' | 'spearman';
type ColorScalePreset = 'default' | 'viridis' | 'plasma' | 'bluered' | 'rdylbu';

@Component({
  selector: 'app-correlation-matrix',
  templateUrl: './correlation-matrix.component.html',
  styleUrls: ['./correlation-matrix.component.scss'],
  standalone: false
})
export class CorrelationMatrixComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;
  revision = 0;
  graphData: any[] = [];
  graphLayout: any = {};

  allSamples: string[] = [];
  selectedSamples: string[] = [];
  sampleGroups: { [group: string]: string[] } = {};

  correlationMethod: CorrelationMethod = 'pearson';
  showAnnotations = false;
  annotationFontSize = 8;
  correlationThreshold = 0;
  enableThreshold = false;
  colorScalePreset: ColorScalePreset = 'default';

  loading = false;
  loadingMessage = '';

  zmin = 0;
  zmax = 1;

  correlationMatrix: number[][] = [];
  flatCorrelations: CorrelationCell[] = [];

  config: any = {
    toImageButtonOptions: {
      format: 'svg',
      filename: 'correlation-matrix',
      scale: 1
    },
    responsive: true
  };

  colorScales: { [key in ColorScalePreset]: [number, string][] } = {
    default: [
      [0, "rgb(255,138,174)"],
      [0.33, "rgb(255,178,166)"],
      [0.66, "rgb(255,248,154)"],
      [1, "rgb(154,220,255)"]
    ],
    viridis: [
      [0, "#440154"],
      [0.25, "#3b528b"],
      [0.5, "#21918c"],
      [0.75, "#5ec962"],
      [1, "#fde725"]
    ],
    plasma: [
      [0, "#0d0887"],
      [0.25, "#7e03a8"],
      [0.5, "#cc4778"],
      [0.75, "#f89540"],
      [1, "#f0f921"]
    ],
    bluered: [
      [0, "#0000ff"],
      [0.5, "#ffffff"],
      [1, "#ff0000"]
    ],
    rdylbu: [
      [0, "#313695"],
      [0.25, "#74add1"],
      [0.5, "#ffffbf"],
      [0.75, "#f46d43"],
      [1, "#a50026"]
    ]
  };

  constructor(
    private web: WebService,
    private settings: SettingsService,
    private toast: ToastService,
    public modal: NgbActiveModal,
    private data: DataService,
    private plotlyTheme: PlotlyThemeService,
    private themeService: ThemeService
  ) {
    this.initializeSamples();
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(() => {
      this.updateLayout();
      this.revision++;
    });

    this.calculateAndRender();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private initializeSamples(): void {
    this.allSamples = Object.keys(this.settings.settings.sampleMap);
    this.selectedSamples = [...this.allSamples];

    for (const sample of this.allSamples) {
      const condition = this.settings.settings.sampleMap[sample]?.condition || 'Ungrouped';
      if (!this.sampleGroups[condition]) {
        this.sampleGroups[condition] = [];
      }
      this.sampleGroups[condition].push(sample);
    }
  }

  private initializeLayout(): void {
    const size = Math.min(window.innerWidth * 0.7, window.innerHeight * 0.7, 900);
    const margin = Math.max(100, size * 0.15);

    this.graphLayout = {
      title: {
        text: `Correlation Matrix (${this.correlationMethod === 'pearson' ? 'Pearson' : 'Spearman'})`,
        font: { size: 16 }
      },
      xaxis: {
        tickvals: [],
        ticktext: [],
        tickangle: -45,
        side: 'bottom'
      },
      yaxis: {
        tickvals: [],
        ticktext: [],
        autorange: 'reversed'
      },
      height: size,
      width: size,
      margin: { r: 50, l: margin, b: margin, t: 80 },
      font: {
        family: this.settings.settings.plotFontFamily + ", serif",
      },
      annotations: []
    };

    this.config.toImageButtonOptions.height = size;
    this.config.toImageButtonOptions.width = size;
  }

  private updateLayout(): void {
    if (this.graphLayout) {
      this.graphLayout = this.plotlyTheme.applyThemeToLayout(this.graphLayout);
    }
  }

  async calculateAndRender(): Promise<void> {
    if (this.selectedSamples.length < 2) {
      this.toast.show("Correlation Matrix", "Please select at least 2 samples").then();
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Preparing data...';

    try {
      await this.delay(50);

      this.loadingMessage = `Calculating ${this.correlationMethod} correlation...`;
      await this.delay(50);

      this.correlationMatrix = this.calculateCorrelation();
      this.buildFlatCorrelations();

      this.loadingMessage = 'Rendering heatmap...';
      await this.delay(50);

      this.initializeLayout();
      this.renderHeatmap();
      this.updateLayout();

      this.toast.show("Correlation Matrix", "Calculation complete").then();
    } catch (error) {
      this.toast.show("Correlation Matrix", "Error calculating correlation: " + (error as Error).message).then();
    } finally {
      this.loading = false;
      this.loadingMessage = '';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateCorrelation(): number[][] {
    const data: { [col: string]: number[] } = {};

    for (const col of this.selectedSamples) {
      data[col] = [];
    }

    for (const row of this.data.raw.df) {
      for (const col of this.selectedSamples) {
        const value = isNaN(row[col]) ? 0 : row[col];
        data[col].push(value);
      }
    }

    const result: number[][] = [];
    let currentMin = 1;

    for (let i = 0; i < this.selectedSamples.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < this.selectedSamples.length; j++) {
        let corr: number;
        if (i === j) {
          corr = 1;
        } else if (j < i && result[j]) {
          corr = result[j][i];
        } else {
          corr = this.correlationMethod === 'pearson'
            ? this.pearsonCorrelation(data[this.selectedSamples[i]], data[this.selectedSamples[j]])
            : this.spearmanCorrelation(data[this.selectedSamples[i]], data[this.selectedSamples[j]]);
        }
        row.push(corr);
        if (corr < currentMin) {
          currentMin = corr;
        }
      }
      result.push(row);
    }

    this.zmin = currentMin - 0.1 > 0 ? currentMin - 0.1 : 0;
    this.zmax = 1;

    return result;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  private spearmanCorrelation(x: number[], y: number[]): number {
    const rankX = this.rank(x);
    const rankY = this.rank(y);
    return this.pearsonCorrelation(rankX, rankY);
  }

  private rank(arr: number[]): number[] {
    const sorted = arr.map((v, i) => ({ value: v, index: i }))
      .sort((a, b) => a.value - b.value);

    const ranks: number[] = new Array(arr.length);
    let i = 0;

    while (i < sorted.length) {
      let j = i;
      while (j < sorted.length - 1 && sorted[j].value === sorted[j + 1].value) {
        j++;
      }
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) {
        ranks[sorted[k].index] = avgRank;
      }
      i = j + 1;
    }

    return ranks;
  }

  private buildFlatCorrelations(): void {
    this.flatCorrelations = [];
    for (let i = 0; i < this.selectedSamples.length; i++) {
      for (let j = 0; j < this.selectedSamples.length; j++) {
        this.flatCorrelations.push({
          x: this.selectedSamples[i],
          y: this.selectedSamples[j],
          value: this.correlationMatrix[i][j]
        });
      }
    }
  }

  private renderHeatmap(): void {
    let displayMatrix = this.correlationMatrix;
    let displaySamples = this.selectedSamples;

    if (this.enableThreshold) {
      displayMatrix = this.correlationMatrix.map(row =>
        row.map(val => Math.abs(val) >= this.correlationThreshold ? val : NaN)
      );
    }

    this.graphData = [{
      z: displayMatrix,
      x: displaySamples,
      y: displaySamples,
      zmax: this.zmax,
      zmin: this.zmin,
      type: 'heatmap',
      colorscale: this.colorScales[this.colorScalePreset],
      hovertemplate: '%{x} vs %{y}<br>Correlation: %{z:.3f}<extra></extra>',
      showscale: true,
      colorbar: {
        title: 'Correlation',
        titleside: 'right'
      }
    }];

    this.graphLayout.xaxis.tickvals = displaySamples;
    this.graphLayout.xaxis.ticktext = displaySamples;
    this.graphLayout.yaxis.tickvals = displaySamples;
    this.graphLayout.yaxis.ticktext = displaySamples;

    if (this.showAnnotations) {
      this.addAnnotations(displayMatrix, displaySamples);
    } else {
      this.graphLayout.annotations = [];
    }

    this.revision++;
  }

  private addAnnotations(matrix: number[][], samples: string[]): void {
    const annotations: any[] = [];

    for (let i = 0; i < samples.length; i++) {
      for (let j = 0; j < samples.length; j++) {
        const value = matrix[i][j];
        if (!isNaN(value)) {
          const textColor = value > 0.5 ? 'white' : 'black';
          annotations.push({
            x: samples[j],
            y: samples[i],
            text: value.toFixed(2),
            font: {
              size: this.annotationFontSize,
              color: textColor
            },
            showarrow: false
          });
        }
      }
    }

    this.graphLayout.annotations = annotations;
  }

  onMethodChange(): void {
    this.calculateAndRender();
  }

  onSampleSelectionChange(): void {
    this.calculateAndRender();
  }

  onColorScaleChange(): void {
    this.renderHeatmap();
  }

  onAnnotationToggle(): void {
    this.renderHeatmap();
  }

  onThresholdChange(): void {
    this.renderHeatmap();
  }

  selectAllSamples(): void {
    this.selectedSamples = [...this.allSamples];
    this.calculateAndRender();
  }

  deselectAllSamples(): void {
    this.selectedSamples = [];
  }

  selectGroup(group: string): void {
    const groupSamples = this.sampleGroups[group] || [];
    for (const sample of groupSamples) {
      if (!this.selectedSamples.includes(sample)) {
        this.selectedSamples.push(sample);
      }
    }
    this.calculateAndRender();
  }

  deselectGroup(group: string): void {
    const groupSamples = this.sampleGroups[group] || [];
    this.selectedSamples = this.selectedSamples.filter(s => !groupSamples.includes(s));
    if (this.selectedSamples.length >= 2) {
      this.calculateAndRender();
    }
  }

  isSampleSelected(sample: string): boolean {
    return this.selectedSamples.includes(sample);
  }

  toggleSample(sample: string): void {
    const index = this.selectedSamples.indexOf(sample);
    if (index > -1) {
      this.selectedSamples.splice(index, 1);
    } else {
      this.selectedSamples.push(sample);
    }
  }

  downloadPlot(format: 'svg' | 'png' = 'svg'): void {
    this.config.toImageButtonOptions.format = format;
    this.web.downloadPlotlyImage(format, 'correlation-matrix', 'correlationMatrix');
  }

  exportCSV(): void {
    const headers = ['Sample', ...this.selectedSamples];
    const rows = this.selectedSamples.map((sample, i) => {
      return [sample, ...this.correlationMatrix[i].map(v => v.toFixed(4))];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `correlation-matrix-${this.correlationMethod}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.toast.show("Export", "Correlation matrix exported to CSV").then();
  }

  copyToClipboard(): void {
    const headers = ['Sample', ...this.selectedSamples];
    const rows = this.selectedSamples.map((sample, i) => {
      return [sample, ...this.correlationMatrix[i].map(v => v.toFixed(4))];
    });

    const text = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      this.toast.show("Clipboard", "Correlation matrix copied to clipboard").then();
    });
  }

  getGroupNames(): string[] {
    return Object.keys(this.sampleGroups);
  }

  getStatistics(): { min: number; max: number; mean: number; median: number } {
    const values: number[] = [];
    for (let i = 0; i < this.correlationMatrix.length; i++) {
      for (let j = i + 1; j < this.correlationMatrix[i].length; j++) {
        values.push(this.correlationMatrix[i][j]);
      }
    }

    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0 };
    }

    values.sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

    return { min, max, mean, median };
  }
}
