import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {InputFile} from "../../classes/input-file";
import {DataService} from "../../data.service";
import {IDataFrame, Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-file-form',
  templateUrl: './file-form.component.html',
  styleUrls: ['./file-form.component.scss']
})
export class FileFormComponent implements OnInit {
  progressBar: any = {value: 0, text: ""}
  transformedFC: boolean = false
  transformedP: boolean = false
  @Output() finished: EventEmitter<boolean> = new EventEmitter<boolean>()
  constructor(public data: DataService, private uniprot: UniprotService, public settings: SettingsService) {
    this.uniprot.uniprotProgressBar.subscribe(data => {
      this.progressBar.value = data.value
      this.progressBar.text = data.text
    })
    this.data.restoreTrigger.asObservable().subscribe(data => {
      if (data) {
        this.processFiles()
      }
    })
  }

  ngOnInit(): void {
  }

  handleFile(e: InputFile, raw: boolean) {
    if (raw) {
      this.data.raw = e
    } else {
      this.data.differential = e
    }
  }

  updateProgressBar(value: number, text: string) {
    this.progressBar.value = value
    this.progressBar.text = text
  }
  processFiles() {
    this.finished.emit(false)

    if (this.data.differentialForm.comparisonSelect === "" || this.data.differentialForm.comparisonSelect === undefined) {
      this.data.differentialForm.comparisonSelect = this.data.differential.df.first()[this.data.differentialForm.comparison]
    }
    const totalSampleNumber = this.data.rawForm.samples.length
    let sampleNumber = 0
    let samples: string[] = []
    const conditionOrder = this.settings.settings.conditionOrder.slice()
    if (conditionOrder.length > 0) {
      for (const c of conditionOrder) {
        for (const s of this.settings.settings.sampleOrder[c]) {
          samples.push(s)
        }
      }
    } else {
      samples = this.data.rawForm.samples.slice()
    }
    const conditions: string[] = []
    for (const s of samples) {
      const condition_replicate = s.split(".")
      const replicate = condition_replicate[condition_replicate.length-1]
      const condition = condition_replicate.slice(0, condition_replicate.length-1).join(".")
      if (!conditions.includes(condition)) {
        conditions.push(condition)
      }
      this.data.sampleMap[s] = {replicate: replicate, condition: condition}
      if (!this.settings.settings.sampleOrder[condition]) {
        this.settings.settings.sampleOrder[condition] = []
      }
      if (!this.settings.settings.sampleOrder[condition].includes(s)) {
        this.settings.settings.sampleOrder[condition].push(s)
      }

      if (!(s in this.settings.settings.sampleVisible)) {
        this.settings.settings.sampleVisible[s] = true
      }
      this.data.raw.df = this.data.raw.df.withSeries(s, new Series(this.convertToNumber(this.data.raw.df.getSeries(s).toArray()))).bake()
      sampleNumber ++
      this.updateProgressBar(sampleNumber*100/totalSampleNumber, "Processed "+s+" sample data")
    }
    if (this.settings.settings.conditionOrder.length === 0) {
      this.settings.settings.conditionOrder = conditions
    }
    let colorPosition = 0
    const colorMap: any = {}
    for (const c of conditions) {
      if (colorPosition >= this.data.defaultColorList.length) {
        colorPosition = 0
      }
      colorMap[c] = this.data.defaultColorList[colorPosition]
      colorPosition++
    }
    this.data.colorMap = colorMap
    this.data.conditions = conditions
    this.data.differential.df = this.toUpperCaseColumn(this.data.differentialForm.primaryIDs, this.data.differential.df)
    this.data.raw.df = this.toUpperCaseColumn(this.data.rawForm.primaryIDs, this.data.raw.df)
    this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.foldChange, new Series(this.convertToNumber(this.data.differential.df.getSeries(this.data.differentialForm.foldChange).toArray()))).bake()
    if (this.data.differentialForm.transformFC) {
      if (!this.transformedFC) {
        this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.foldChange, new Series(this.log2Convert(this.data.differential.df.getSeries(this.data.differentialForm.foldChange).toArray()))).bake()
        this.transformedFC = true
      }
    }

    this.updateProgressBar(50, "Processed fold change")
    this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.significant, new Series(this.convertToNumber(this.data.differential.df.getSeries(this.data.differentialForm.significant).toArray()))).bake()
    if (this.data.differentialForm.transformSignificant) {
      if (!this.transformedP) {
        this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.significant, new Series(this.log10Convert(this.data.differential.df.getSeries(this.data.differentialForm.significant).toArray()))).bake()
        this.transformedP = true
      }
    }
    this.updateProgressBar(100, "Processed significant")
    const currentDF = this.data.differential.df.where(r => r[this.data.differentialForm.comparison] === this.data.differentialForm.comparisonSelect)
    const fc = currentDF.getSeries(this.data.differentialForm.foldChange).where(i => !isNaN(i)).bake()
    const sign = currentDF.getSeries(this.data.differentialForm.significant).where(i => !isNaN(i)).bake()
    this.data.minMax = {
      fcMin: fc.min(),
      fcMax: fc.max(),
      pMin: sign.min(),
      pMax: sign.max()
    }

    this.data.currentDF = this.data.differential.df.where(r => r[this.data.differentialForm.comparison] === this.data.differentialForm.comparisonSelect)
    this.data.primaryIDsList = this.data.currentDF.getSeries(this.data.differentialForm.primaryIDs).distinct().toArray()
    for (const p of this.data.primaryIDsList) {
      if (!this.data.primaryIDsMap[p])  {
        this.data.primaryIDsMap[p] = {}
        this.data.primaryIDsMap[p][p] = true
      }
      for (const n of p.split(";")) {
        if (!this.data.primaryIDsMap[n]) {
          this.data.primaryIDsMap[n] = {}
        }
        this.data.primaryIDsMap[n][p] = true
      }
    }
    this.processUniProt()
  }

  toUpperCaseColumn(col: string, df: IDataFrame) {
    const d = df.getSeries(col).bake().toArray()
    return df.withSeries(col, new Series(d.map(v => v.toUpperCase()))).bake()
  }

  convertToNumber(arr: string[]) {
    const newCol = arr.map(Number)
    return newCol
  }

  log2Convert(arr: number[]) {
    const newCol = arr.map(a => this.log2Stuff(a))
    return newCol
  }

  log2Stuff(data: number) {
    if (data > 0) {
      return Math.log2(data)
    } else if (data < 0) {
      return Math.log2(Math.abs(data))
    } else {
      return 0
    }
  }

  log10Convert(arr: number[]) {
    const newCol = arr.map(a => -Math.log10(a))
    return newCol
  }

  processUniProt(){
    this.uniprot.geneNameToAcc = {}
    if (this.data.fetchUniprot) {
      const accList: string[] = []
      for (const r of this.data.raw.df) {
        const a = r[this.data.rawForm.primaryIDs]
        this.data.dataMap.set(a, r[this.data.rawForm.primaryIDs])
        this.data.dataMap.set(r[this.data.rawForm.primaryIDs], a)
        const d = a.split(";")
        const accession = this.uniprot.Re.exec(d[0])
        if (accession) {
          this.uniprot.accMap.set(a, accession[1])
          this.uniprot.accMap.set(accession[1], a)
          if (!this.uniprot.results.has(accession[1])) {
            accList.push(accession[1])
          }
        }
      }
      if (accList.length > 0) {
        this.uniprot.PrimeAPIUniProtParser(accList).then(r=> {
          this.uniprot.uniprotParseStatus.subscribe(d => {
            if (d) {
              const allGenes: string[] = []
              for (const p of this.data.primaryIDsList) {
                const uni = this.uniprot.getUniprotFromPrimary(p)
                if (uni) {
                  if (uni["Gene Names"]) {
                    if (uni["Gene Names"] !== "") {
                      if (!allGenes.includes(uni["Gene Names"])) {
                        allGenes.push(uni["Gene Names"])
                        if (!this.data.genesMap[uni["Gene Names"]])  {
                          this.data.genesMap[uni["Gene Names"]] = {}
                          this.data.genesMap[uni["Gene Names"]][uni["Gene Names"]] = true
                        }
                        for (const n of uni["Gene Names"].split(";")) {
                          if (!this.data.genesMap[n]) {
                            this.data.genesMap[n] = {}
                          }
                          this.data.genesMap[n][uni["Gene Names"]] = true
                        }
                      }
                    }
                  }
                }
              }
              this.data.allGenes = allGenes
              console.log(this.data.genesMap)
              console.log(this.uniprot.geneNameToAcc["MAPT;MTAPT;TAU"])
              this.finished.emit(true)
              this.updateProgressBar(100, "Finished")
            }
          })
        })
      } else {
        this.finished.emit(true)
        this.updateProgressBar(100, "Finished")
      }
    } else {
      if (this.data.differentialForm.geneNames !== "") {
        for (const r of this.data.differential.df) {
          if (r[this.data.differentialForm.geneNames] !== "") {
            const g = r[this.data.differentialForm.geneNames]
            if (!this.data.genesMap[g])  {
              this.data.genesMap[g] = {}
              this.data.genesMap[g][g] = true
            }
            for (const n of g.split(";")) {
              if (!this.data.genesMap[n]) {
                this.data.genesMap[n] = {}
              }
              this.data.genesMap[n][g] = true
            }
            if (!this.data.allGenes.includes(g)) {
              this.data.allGenes.push(g)
            }
            if (!this.uniprot.geneNameToAcc[g]) {
              this.uniprot.geneNameToAcc[g] = {}
            }
            this.uniprot.geneNameToAcc[g][r[this.data.differentialForm.primaryIDs]] = true
          }
        }
        this.data.allGenes = this.data.differential.df.getSeries(this.data.differentialForm.geneNames).toArray().filter(v => v !== "")
      }
      this.finished.emit(true)
      this.updateProgressBar(100, "Finished")
    }

  }
}
