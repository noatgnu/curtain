import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WebService } from "../../web.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { getProteomicsData } from "curtain-web-api";
import { SettingsService } from "../../settings.service";
import { PlotlyThemeService } from "../../plotly-theme.service";
import { ThemeService } from "../../theme.service";
import { Subscription } from "rxjs";
import { ToastService } from "../../toast.service";

type DataCategory = 'tissue' | 'cell line';
type SortOrder = 'value-asc' | 'value-desc' | 'name-asc' | 'name-desc';

interface ExpressionData {
  name: string;
  value: number;
}

interface Statistics {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
}

@Component({
  selector: 'app-proteomics-db',
  templateUrl: './proteomics-db.component.html',
  styleUrls: ['./proteomics-db.component.scss'],
  standalone: false
})
export class ProteomicsDbComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;
  revision = 0;

  _uniprotID = "";
  @Input() set uniprotID(value: string) {
    this._uniprotID = value;
    if (this.settings.settings.proteomicsDBColor === undefined) {
      this.settings.settings.proteomicsDBColor = "#1f77b4";
    } else {
      this.form.controls["color"].setValue(this.settings.settings.proteomicsDBColor);
      this.color = this.settings.settings.proteomicsDBColor.slice();
    }
    if (this._uniprotID !== "") {
      this.fetchData();
    }
  }

  graphData: any[] = [];
  graphLayout: any = {};
  config: any = {
    toImageButtonOptions: {
      format: 'svg',
      filename: 'proteomicsdb',
      height: 400,
      width: 800,
      scale: 1
    },
    responsive: true
  };

  form: FormGroup = this.fb.group({
    color: "#8033a9",
    selected: "tissue"
  });

  color = "#8033a9";

  loading = false;
  error = "";
  rawData: ExpressionData[] = [];
  filteredData: ExpressionData[] = [];
  searchTerm = "";
  sortOrder: SortOrder = 'value-desc';
  showTopN = 0;
  statistics: Statistics | null = null;
  showSettings = true;

  constructor(
    public web: WebService,
    private fb: FormBuilder,
    public settings: SettingsService,
    private plotlyTheme: PlotlyThemeService,
    private themeService: ThemeService,
    private toast: ToastService
  ) {
    this.form.valueChanges.subscribe(() => {
      this.fetchData();
    });
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(() => {
      this.updateLayout();
      this.revision++;
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private async fetchData(): Promise<void> {
    if (!this._uniprotID) return;

    this.loading = true;
    this.error = "";

    try {
      const response: any = await getProteomicsData(this._uniprotID, this.form.value["selected"]);
      if (response?.data?.d?.results) {
        this.rawData = response.data.d.results.map((r: any) => ({
          name: r["TISSUE_NAME"],
          value: parseFloat(r["NORMALIZED_INTENSITY"])
        }));
        this.applyFiltersAndSort();
        this.calculateStatistics();
      } else {
        this.rawData = [];
        this.filteredData = [];
        this.graphData = [];
        this.statistics = null;
      }
    } catch (err) {
      this.error = "Failed to fetch data from ProteomicsDB";
      this.rawData = [];
      this.filteredData = [];
      this.graphData = [];
      this.statistics = null;
    } finally {
      this.loading = false;
    }
  }

  private applyFiltersAndSort(): void {
    let data = [...this.rawData];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      data = data.filter(d => d.name.toLowerCase().includes(term));
    }

    switch (this.sortOrder) {
      case 'value-asc':
        data.sort((a, b) => a.value - b.value);
        break;
      case 'value-desc':
        data.sort((a, b) => b.value - a.value);
        break;
      case 'name-asc':
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        data.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    if (this.showTopN > 0 && this.showTopN < data.length) {
      data = data.slice(0, this.showTopN);
    }

    this.filteredData = data;
    this.drawBarChart();
  }

  private calculateStatistics(): void {
    if (this.rawData.length === 0) {
      this.statistics = null;
      return;
    }

    const values = this.rawData.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = values.reduce((a, b) => a + b, 0);

    this.statistics = {
      count: n,
      min: sorted[0],
      max: sorted[n - 1],
      mean: sum / n,
      median: n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]
    };
  }

  private drawBarChart(): void {
    if (this.filteredData.length === 0) {
      this.graphData = [];
      return;
    }

    if (this.form.dirty) {
      this.settings.settings.proteomicsDBColor = this.form.value["color"];
    }

    const x = this.filteredData.map(d => d.value);
    const y = this.filteredData.map(d => d.name);

    const trace = {
      type: "bar",
      x: x,
      y: y,
      marker: {
        color: this.form.value["color"],
        line: {
          color: this.adjustColor(this.form.value["color"], -30),
          width: 1
        }
      },
      orientation: "h",
      hovertemplate: '<b>%{y}</b><br>Intensity: %{x:.2f}<extra></extra>'
    };

    const height = Math.max(300, 50 + 25 * y.length);

    this.graphLayout = {
      title: {
        text: `ProteomicsDB Expression - ${this._uniprotID}`,
        font: { size: 16 }
      },
      margin: { l: 250, r: 50, t: 60, b: 50 },
      height: height,
      xaxis: {
        title: "<b>Normalized Intensity</b>",
        tickfont: { size: 12 }
      },
      yaxis: {
        title: "",
        type: "category",
        tickmode: "array",
        tickvals: y,
        tickfont: { size: 11 },
        automargin: true
      },
      font: {
        family: this.settings.settings.plotFontFamily + ", serif"
      },
      hoverlabel: {
        bgcolor: 'white',
        font: { size: 12 }
      }
    };

    this.graphLayout = this.plotlyTheme.applyThemeToLayout(this.graphLayout);
    this.graphData = [trace];

    this.config = {
      toImageButtonOptions: {
        format: 'svg',
        filename: `proteomicsdb-${this._uniprotID}`,
        height: height,
        width: 800,
        scale: 1
      },
      responsive: true
    };

    this.revision++;
  }

  private updateLayout(): void {
    if (this.graphLayout && Object.keys(this.graphLayout).length > 0) {
      this.graphLayout = this.plotlyTheme.applyThemeToLayout(this.graphLayout);
    }
  }

  private adjustColor(hex: string, amount: number): string {
    if (!hex.startsWith('#')) {
      return hex;
    }
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  onSearchChange(): void {
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  onTopNChange(): void {
    this.applyFiltersAndSort();
  }

  updateColor(color: string): void {
    this.form.controls["color"].setValue(color);
    this.form.markAsDirty();
  }

  downloadPlot(format: 'svg' | 'png'): void {
    this.web.downloadPlotlyImage(format, "proteomicsDB", this._uniprotID + "bar").then();
  }

  exportCSV(): void {
    const dataToExport = this.filteredData.length > 0 ? this.filteredData : this.rawData;
    if (dataToExport.length === 0) {
      this.toast.show("Export", "No data to export").then();
      return;
    }

    const headers = ['Category', 'Normalized Intensity'];
    const rows = dataToExport.map(d => [d.name, d.value.toString()]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `proteomicsdb-${this._uniprotID}-${this.form.value["selected"]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.toast.show("Export", "Data exported to CSV").then();
  }

  copyToClipboard(): void {
    const dataToExport = this.filteredData.length > 0 ? this.filteredData : this.rawData;
    if (dataToExport.length === 0) {
      this.toast.show("Clipboard", "No data to copy").then();
      return;
    }

    const headers = ['Category', 'Normalized Intensity'];
    const rows = dataToExport.map(d => [d.name, d.value.toFixed(4)]);

    const text = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      this.toast.show("Clipboard", "Data copied to clipboard").then();
    });
  }

  getDataCategory(): string {
    return this.form.value["selected"] === 'tissue' ? 'Tissue' : 'Cell Line';
  }

  clearSearch(): void {
    this.searchTerm = "";
    this.applyFiltersAndSort();
  }

  resetFilters(): void {
    this.searchTerm = "";
    this.sortOrder = 'value-desc';
    this.showTopN = 0;
    this.applyFiltersAndSort();
  }
}
