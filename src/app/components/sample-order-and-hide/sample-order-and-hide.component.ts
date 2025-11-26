import { Component, OnInit } from '@angular/core';
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";

@Component({
    selector: 'app-sample-order-and-hide',
    templateUrl: './sample-order-and-hide.component.html',
    styleUrls: ['./sample-order-and-hide.component.scss'],
    standalone: false
})
export class SampleOrderAndHideComponent implements OnInit {
  samples: any = {}
  samplesVisible: any = {}
  condition: string[] = []
  enableImputation: boolean = false

  colorMap: any = {}

  columnSize: any = {
    barChart: 0,
    averageBarChart: 0,
    violinPlot: 0,
  }
  chartYAxisLimits: any = {
    barChart: { min: null, max: null },
    averageBarChart: { min: null, max: null },
    violinPlot: { min: null, max: null },
  }
  violinPointPos: number = -2

  batchToggle: any = {}
  enablePeptideCount: boolean = false
  enableMetabolomics: boolean = false
  activeTab: number = 1
  collapseState: {[key: string]: boolean} = {}

  metabolomicsColumnMap: any = {
    "polarity": null,
    "formula": null,
    "abbreviation": null,
    "smiles": null,
  }

  constructor(public dataService: DataService, public modal: NgbActiveModal, public settings: SettingsService) {
    this.enableImputation = this.settings.settings.enableImputation
    this.enableMetabolomics = this.settings.settings.enableMetabolomics || false
    if (this.enableMetabolomics) {
      for (const c in this.metabolomicsColumnMap) {
        if (this.settings.settings.metabolomicsColumnMap[c]) {
          this.metabolomicsColumnMap[c] = Object.assign({}, this.settings.settings.metabolomicsColumnMap[c])
        } else {
          this.metabolomicsColumnMap[c] = null
        }
      }
    }
    if (this.settings.settings.viewPeptideCount) {
      this.enablePeptideCount = true
    }
    for (const c in this.settings.settings.columnSize) {
      if (c in this.columnSize) {
        this.columnSize[c] = this.settings.settings.columnSize[c]
      }
    }
    if (this.settings.settings.chartYAxisLimits) {
      for (const c in this.settings.settings.chartYAxisLimits) {
        if (c in this.chartYAxisLimits) {
          this.chartYAxisLimits[c] = { ...this.settings.settings.chartYAxisLimits[c] }
        }
      }
    }
    this.violinPointPos = this.settings.settings.violinPointPos
    for (const s in settings.settings.sampleMap) {
      const condition = settings.settings.sampleMap[s].condition
      this.samplesVisible[s] = true
      if (s in this.settings.settings.sampleVisible) {
        this.samplesVisible[s] = this.settings.settings.sampleVisible[s]
      }
      if (!this.samples[condition]) {
        this.samples[condition] = []
      }
      this.samples[condition].push(s)
    }
    if (this.settings.settings.conditionOrder.length === 0) {
      for (const s in settings.settings.sampleMap) {
        const condition = settings.settings.sampleMap[s].condition
        if (!this.condition.includes(condition)) {
          this.condition.push(condition)
        }
      }
    } else {
      this.condition = this.settings.settings.conditionOrder.slice()
    }
    console.log(this.condition)
    for (const c of this.condition) {
      this.batchToggle[c] = !this.samples[c].some((s: string) => this.samplesVisible[s] === false);
      this.collapseState[c] = true

      if (this.settings.settings.barchartColorMap[c]) {
        this.colorMap[c] = this.settings.settings.barchartColorMap[c].slice()
      } else {
        this.colorMap[c] = this.settings.settings.colorMap[c].slice()
      }
    }
  }

  toggleCollapse(condition: string) {
    this.collapseState[condition] = !this.collapseState[condition]
  }

  ngOnInit(): void {
  }

  moveUp(sample: string, condition: string) {
    const ind = this.samples[condition].indexOf(sample)
    const sampleA = this.samples[condition][ind].slice()
    if (ind !== 0) {
      const sampleB = this.samples[condition][ind-1].slice()
      this.samples[condition][ind-1] = sampleA
      this.samples[condition][ind] = sampleB
    }
  }

  moveDown(sample: string, condition: string) {
    const ind = this.samples[condition].indexOf(sample)
    const sampleA = this.samples[condition][ind].slice()
    if (ind !== (this.samples[condition].length - 1)) {
      const sampleB = this.samples[condition][ind+1].slice()
      this.samples[condition][ind+1] = sampleA
      this.samples[condition][ind] = sampleB
    }
  }

  submit() {
    this.settings.settings.viewPeptideCount = this.enablePeptideCount
    this.settings.settings.sampleVisible = this.samplesVisible
    this.settings.settings.sampleOrder = this.samples
    this.settings.settings.conditionOrder = this.condition
    this.settings.settings.violinPointPos = this.violinPointPos
    this.settings.settings.enableImputation = this.enableImputation
    this.settings.settings.enableMetabolomics = this.enableMetabolomics
    for (const c in this.columnSize) {
      this.settings.settings.columnSize[c] = this.columnSize[c]
    }
    for (const c in this.chartYAxisLimits) {
      this.settings.settings.chartYAxisLimits[c] = { ...this.chartYAxisLimits[c] }
    }
    for (const c in this.metabolomicsColumnMap) {
      this.settings.settings.metabolomicsColumnMap[c] = this.metabolomicsColumnMap[c]
    }
    const sampleMap: any = {}
    for (const c of this.condition) {
      for (const s of this.settings.settings.sampleOrder[c]) {
        sampleMap[s] = this.settings.settings.sampleMap[s]
      }
      if (this.colorMap[c] !== this.settings.settings.colorMap[c]) {
        this.settings.settings.barchartColorMap[c] = this.colorMap[c].slice()
      }
    }
    this.settings.settings.sampleMap = sampleMap
    this.dataService.redrawTrigger.next(true)
    this.modal.close()
  }

  moveUpCondition(condition: string){
    const ind = this.condition.indexOf(condition)
    const sampleA = this.condition[ind].slice()
    if (ind !== 0) {
      const sampleB = this.condition[ind-1].slice()
      this.condition[ind-1] = sampleA
      this.condition[ind] = sampleB
    }
  }

  moveDownCondition(condition: string){
    const ind = this.condition.indexOf(condition)
    const sampleA = this.condition[ind].slice()
    if (ind !== (this.condition.length - 1)) {
      const sampleB = this.condition[ind+1].slice()
      this.condition[ind+1] = sampleA
      this.condition[ind] = sampleB
    }
  }

  check(cond: boolean) {
    for (const s in this.samplesVisible) {
      this.samplesVisible[s] = cond
    }
  }

  batchToggleSamples(condition: string) {
    for (const s of this.samples[condition]) {
      this.samplesVisible[s] = this.batchToggle[condition]
    }
  }

  hasPeptideCountData(): boolean {
    return this.settings.settings.peptideCountData && Object.keys(this.settings.settings.peptideCountData).length > 0;
  }

  clearPeptideCountData() {
    if (confirm('Are you sure you want to clear all peptide count data? This action cannot be undone.')) {
      this.settings.settings.peptideCountData = {};
      // Also disable the peptide count view if data is cleared
      this.settings.settings.viewPeptideCount = false;
      this.enablePeptideCount = false;
      // Trigger a redraw to update the UI
      this.dataService.redrawTrigger.next(true);
    }
  }

  getContrastColor(hexColor: string): string {
    if (!hexColor) return '#000000'
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return brightness > 155 ? '#000000' : '#ffffff'
  }

}
