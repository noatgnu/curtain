import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import { InputFile } from 'src/app/classes/input-file';
import { Raw } from 'src/app/classes/raw';
import {Differential} from "../../../classes/differential";
import {Settings} from "../../../classes/settings";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DataFrame, fromCSV, fromJSON, IDataFrame, Series} from "data-forge";
import {UniprotService} from "../../../uniprot.service";
import {DataService} from "../../../data.service";
import {SettingsService} from "../../../settings.service";
import {BatchUploadServiceService} from "../batch-upload-service.service";
import {NgbAlert, NgbCollapse, NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import {CurtainEncryption} from "curtain-web-api";
import {AccountsService} from "../../../accounts/accounts.service";
import {ToastService} from "../../../toast.service";
import {QuillEditorComponent} from "ngx-quill";
import {NgClass} from "@angular/common";
import {ColorPickerDirective} from "ngx-color-picker";

@Component({
  selector: 'app-individual-session',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgbProgressbar,
    QuillEditorComponent,
    NgClass,
    NgbCollapse,
    ColorPickerDirective,
    NgbAlert
  ],
  templateUrl: './individual-session.component.html',
  styleUrl: './individual-session.component.scss',
  providers: [
    UniprotService,
    DataService,
    SettingsService
  ]
})
export class IndividualSessionComponent implements OnChanges, AfterViewInit {
  @Input() sessionId: number = -1;
  private _session: {data: {
    raw: InputFile,
    rawForm: Raw,
    differentialForm: Differential,
    processed: InputFile,
    password: string,
    selections: [],
    selectionsMap: any,
    selectionsName: [],
    settings: Settings,
    fetchUniprot: boolean,
    annotatedData: any,
    extraData: any,
    permanent: boolean,
    uniqueComparisons: string[]
  },
  form: FormGroup,
  peptideFileForm: FormGroup,
  rawColumns: string[],
  differentialColumns: string[],
  peptideFileColumns: string[],
  rawFile: null|File,
  differentialFile: null|File,
  peptideFile: null|File,
  uniqueComparisons: string[],
  linkId: string|undefined|null,
  extraFiles: {file: File, type: string}[],
  colorCategoryForms: FormGroup[],
  colorCategoryColumn: string,
  colorCategoryPrimaryIdColumn: string,
  private: boolean,
  volcanoColors: any,
    colorPalette: string,
  }|undefined = undefined;
  colorPalletes: string[] = []
  @Input() set session(value: {data: {
      raw: InputFile,
      rawForm: Raw,
      differentialForm: Differential,
      processed: InputFile,
      password: string,
      selections: [],
      selectionsMap: any,
      selectionsName: [],
      settings: Settings,
      fetchUniprot: boolean,
      annotatedData: any,
      extraData: any,
      permanent: boolean,
      uniqueComparisons: string[]
    },
    form: FormGroup,
    peptideFileForm: FormGroup,
    rawColumns: string[],
    differentialColumns: string[],
    peptideFileColumns: string[],
    rawFile: null|File,
    differentialFile: null|File,
    peptideFile: null|File,
    uniqueComparisons: string[],
    linkId: string|undefined|null,
    extraFiles: {file: File, type: string}[],
    colorCategoryForms: FormGroup[],
    colorCategoryColumn: string,
    colorCategoryPrimaryIdColumn: string,
    private: boolean,
    volcanoColors: any,
    colorPalette: string,
  }|undefined) {
    this._session = value
    this.defaultVolcanoColors()
  }

  get session() {
    return this._session
  }

  @Input() differentialFiles: File[] = [];
  @Input() rawFiles: File[] = [];
  @Input() extraFiles: File[] = [];
  @Input() peptideFiles: File[] = [];
  @Output() changed: EventEmitter<any> = new EventEmitter<any>();
  @Output() finished: EventEmitter<string> = new EventEmitter<string>();
  progressBar: any = {value: 0, text: ""}
  payload: any = {}
  isVolcanoPlotSettingsClosed = true
  isVolcanoPlotCategoryColorClosed = true
  isColorPaletteClosed = true
  constructor(private fb: FormBuilder, private toast: ToastService, private accounts: AccountsService, private batchService: BatchUploadServiceService, private data: DataService, private uniprot: UniprotService, private cd: ChangeDetectorRef, private settings: SettingsService) {
    this.batchService.taskStartAnnouncer.subscribe((taskId: number) => {
      if (taskId === this.sessionId) {
        this.startWork().then()
      }
    })
    this.batchService.resetAnnouncer.subscribe((taskId: number) => {
      if (taskId === this.sessionId) {
        this.data.reset()
        this.uniprot.reset()
      }
    })
    this.colorPalletes = Object.keys(this.data.palette)
  }

  ngAfterViewInit() {
    // Set up peptide file change handler
    if (this.session?.peptideFileForm) {
      this.session.peptideFileForm.get('peptideFile')?.valueChanges.subscribe((file: File) => {
        if (file) {
          this.loadPeptideFileColumns(file);
        }
      });
    }
  }

  private loadPeptideFileColumns(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && this.session) {
        try {
          const df = fromCSV(e.target.result as string);
          this.session.peptideFileColumns = df.getColumnNames();
          this.session.peptideFile = file;
        } catch (error) {
          console.error('Error reading peptide count file:', error);
          this.toast.show('Error', 'Failed to read peptide count file. Please check the file format.');
        }
      }
    };
    reader.readAsText(file);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.changed.emit(this.session)
  }

  getComparisonColumnUnique(session: any, columnComp: string) {
    if (session.differentialFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const loadedFile = e.target.result;
          const df = fromCSV(<string>loadedFile)
          // @ts-ignore
          const column = df.getSeries(columnComp)
          // @ts-ignore
          session.uniqueComparisons = column.distinct().toArray()
          session.data.differentialForm.comparisonSelect = [session.uniqueComparisons[0]]
        } else {
          session.uniqueComparisons = []
        }
      }
      reader.readAsText(session.differentialFile)
    }
  }

  async readRawFile() {
    if (this.session && this.session.rawFile) {
      // @ts-ignore
      const file = await this.readFileAsync(this.session.rawFile)
      const df = fromCSV(file)
      this.data.raw.df = df
      this.data.raw.originalFile = file
    }
  }

  async readDifferentialFile() {
    if (this.session && this.session.differentialFile) {
      // @ts-ignore
      const file = await this.readFileAsync(this.session.differentialFile)
      const df = fromCSV(file)
      this.data.differential.df = df
      this.data.differential.originalFile = file
    }
  }

  async startWork() {
    if (!this.session) {
      return
    }

    this.data.fetchUniprot = this.session.data.fetchUniprot
    await this.readDifferentialFile()
    await this.readRawFile()
    for (const d in this.session.data.differentialForm) {
      if (this.session.data.differentialForm.hasOwnProperty(d)) {
        // @ts-ignore
        this.data.differentialForm[d] = this.session.data.differentialForm[d]
      }
    }
    this.data.rawForm = this.session.data.rawForm


    if (typeof Worker !== 'undefined') {
      // Create a new
      const worker = new Worker(new URL('./data.worker', import.meta.url));
      worker.onmessage = (data: MessageEvent<any>) => {
        if (data.data) {
          if (data.data.type === "progress") {
            this.updateProgressBar(data.data.value, data.data.text)
          } else {
            if (data.data.type === "resultDifferential") {
              this.data.differential.df = fromJSON(data.data.differential)
              for (const i in this.data.differentialForm) {
                if (this.data.differentialForm.hasOwnProperty(i)) {
                  if (i in data.data.differentialForm) {
                    // @ts-ignore
                    this.data.differentialForm[i] = data.data.differentialForm[i]
                  }
                }
              }
              let currentDF = this.data.differential.df.where(r => this.data.differentialForm.comparisonSelect.includes(r[this.data.differentialForm.comparison])).bake()

              const d: string[] = []
              for (const r of currentDF) {
                d.push(r[this.data.differentialForm.primaryIDs] + "("+r[this.data.differentialForm.comparison]+")")
              }

              currentDF = currentDF.withSeries("UniquePrimaryIDs", new Series(d)).bake()
              const fc = currentDF.getSeries(this.data.differentialForm.foldChange).where(i => !isNaN(i)).bake()
              const sign = currentDF.getSeries(this.data.differentialForm.significant).where(i => !isNaN(i)).bake()

              this.data.minMax = {
                fcMin: fc.min(),
                fcMax: fc.max(),
                pMin: sign.min(),
                pMax: sign.max()
              }
              this.data.currentDF = currentDF
              this.data.primaryIDsList = this.data.currentDF.getSeries(this.data.differentialForm.primaryIDs).bake().distinct().toArray()
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

              worker.postMessage({
                task: 'processRawFile',
                rawForm: this.data.rawForm,
                raw: this.data.raw.originalFile,
                settings: Object.assign({}, this.settings.settings)
              })
              this.data.raw.df = new DataFrame()
            } else if (data.data.type === "resultRaw") {

              this.data.raw.df = fromJSON(data.data.raw)
              for (const s in this.settings.settings) {

                if (this.settings.settings.hasOwnProperty(s)) {
                  // @ts-ignore
                  this.settings.settings[s] = data.data.settings[s]
                }
              }
              this.data.conditions = data.data.conditions


              this.copySessionSettings()

              console.log(this.settings.settings)
              this.loadPeptideData().then(() => {
                  this.loadLogFiles().then(() => {
                    this.addColorCategoryToSettings().then(() => {
                      this.addDefaultColors();
                      this.processUniProt()
                      worker.terminate()
                    })
                  })
                }
                )
            } else if (data.data.type === "resultDifferentialCompleted") {

            }
          }
        } else {
          worker.terminate()
        }

      };
      worker.postMessage({
        task: 'processDifferentialFile',
        differential: this.data.differential.originalFile,
        differentialForm: this.data.differentialForm
      });
      this.data.differential.df = new DataFrame()
    } else {
      await this.processFiles()
    }
  }

  private addDefaultColors() {
    if (this.session) {
      for (const c in this.session.volcanoColors) {
        for (const s of this.data.differentialForm.comparisonSelect) {
          const colorName = `${this.session.volcanoColors[c].p}${this.settings.settings.pCutoff};${this.session.volcanoColors[c].fc}${this.settings.settings.log2FCCutoff} (${s})`
          this.settings.settings.colorMap[colorName] = this.session.volcanoColors[c].color

        }
      }
      console.log(this.settings.settings.colorMap)
    }
  }

  processUniProt(){
    if (!this.session) {
      return
    }
    if (this.data.fetchUniprot) {

      if (!this.data.bypassUniProt) {
        this.uniprot.geneNameToAcc = {}
        this.uniprot.uniprotParseStatus.next(false)
        const accList: string[] = []
        this.data.dataMap = new Map<string, string>()
        this.data.genesMap = {}
        this.uniprot.accMap = new Map<string, string[]>()
        this.uniprot.dataMap = new Map<string, any>()
        for (const r of this.data.raw.df) {
          const a = r[this.data.rawForm.primaryIDs]

          this.data.dataMap.set(a, r[this.data.rawForm.primaryIDs])
          this.data.dataMap.set(r[this.data.rawForm.primaryIDs], a)
          const d = a.split(";")
          const accession = this.uniprot.Re.exec(d[0])
          if (accession) {
            if (this.uniprot.accMap.has(a)) {
              const al = this.uniprot.accMap.get(a)
              if (al) {
                if (!al.includes(accession[1])) {
                  al.push(accession[1])
                  this.uniprot.accMap.set(a, al)
                }
              }
            } else {
              this.uniprot.accMap.set(a, [accession[1]])
            }
            if (this.uniprot.accMap.has(accession[1])) {
              const al = this.uniprot.accMap.get(accession[1])
              if (al) {
                if (!al.includes(a)) {
                  al.push(a)
                  this.uniprot.accMap.set(accession[1], al)
                }
              }
            } else {
              this.uniprot.accMap.set(accession[1], [a])
            }

            if (!this.uniprot.dataMap.has(accession[1])) {
              accList.push(accession[1])
            }
          }
        }
        console.log(accList)
        if (accList.length > 0) {
          this.uniprot.db = new Map<string, any>()
          this.createUniprotDatabase(accList).then((allGenes: any) => {
            this.data.allGenes = allGenes
            this.uniprot.uniprotParseStatus.next(false)
            this.updateProgressBar(100, "Finished")
            // @ts-ignore
            this.payload = this.createPayload(this.session.data.permanent)
            this.saveSession()
          });
        } else {

          this.updateProgressBar(100, "Finished")
          // @ts-ignore
          this.payload = this.createPayload(this.session.data.permanent)
          this.saveSession()
        }
      } else {
        this.data.bypassUniProt = false
        this.updateProgressBar(100, "Finished")
        // @ts-ignore
        this.payload = this.createPayload(this.session.data.permanent)
        this.saveSession()
      }

    } else {
      this.uniprot.geneNameToAcc = {}
      if (this.data.differentialForm.geneNames !== "") {
        for (const r of this.data.currentDF) {
          if (r[this.data.differentialForm.geneNames]) {
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
        this.data.allGenes = this.data.currentDF.getSeries(this.data.differentialForm.geneNames).distinct().toArray().filter(v => v !== "")
      }
      this.updateProgressBar(100, "Finished")
      // @ts-ignore
      this.payload = this.createPayload(this.session.data.permanent)
      this.saveSession()
    }
  }

  private async createUniprotDatabase(accList: string[]) {
    await this.uniprot.UniprotParserJS(accList)
    const allGenes: string[] = []
    for (const p of this.data.primaryIDsList) {
      try {
        const uni: any = this.uniprot.getUniprotFromPrimary(p)
        if (uni) {
          if (uni["Gene Names"]) {
            if (uni["Gene Names"] !== "") {
              if (!allGenes.includes(uni["Gene Names"])) {
                allGenes.push(uni["Gene Names"])
                if (!this.data.genesMap[uni["Gene Names"]]) {
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
      } catch (e) {
        console.log(e)
      }
    }
    return allGenes
  }

  async processFiles(e: any = null) {
    if (!this.session) {
      return
    }
    if (e) {
      e.preventDefault()
    }

    if (!this.data.differentialForm.comparison || this.data.differentialForm.comparison === "" || this.data.differentialForm.comparison === "CurtainSetComparison") {
      this.data.differentialForm.comparison = "CurtainSetComparison"
      this.data.differentialForm.comparisonSelect = ["1"]

      this.data.differential.df = this.data.differential.df.withSeries("CurtainSetComparison", new Series(Array(this.data.differential.df.count()).fill("1"))).bake()
    }
    if (!this.data.differentialForm.comparisonSelect) {
      this.data.differentialForm.comparisonSelect = [this.data.differential.df.first()[this.data.differentialForm.comparison]]
    } else if (this.data.differentialForm.comparisonSelect.length === 0) {
      this.data.differentialForm.comparisonSelect = [this.data.differential.df.first()[this.data.differentialForm.comparison]]
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
      this.settings.settings.sampleMap[s] = {replicate: replicate, condition: condition, name: s}
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
      if (colorPosition >= this.settings.settings.defaultColorList.length) {
        colorPosition = 0
      }
      colorMap[c] = this.settings.settings.defaultColorList[colorPosition]
      //this.settings.settings.barchartColorMap[c] = null
      colorPosition++
    }
    this.settings.settings.colorMap = colorMap
    this.data.conditions = conditions
    this.data.differential.df = this.toUpperCaseColumn(this.data.differentialForm.primaryIDs, this.data.differential.df)
    this.data.raw.df = this.toUpperCaseColumn(this.data.rawForm.primaryIDs, this.data.raw.df)
    this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.foldChange, new Series(this.convertToNumber(this.data.differential.df.getSeries(this.data.differentialForm.foldChange).toArray()))).bake()
    if (this.data.differentialForm.transformFC) {
      this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.foldChange, new Series(this.log2Convert(this.data.differential.df.getSeries(this.data.differentialForm.foldChange).toArray()))).bake()
    }

    this.updateProgressBar(50, "Processed fold change")
    this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.significant, new Series(this.convertToNumber(this.data.differential.df.getSeries(this.data.differentialForm.significant).toArray()))).bake()
    if (this.data.differentialForm.transformSignificant) {
      this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.significant, new Series(this.log10Convert(this.data.differential.df.getSeries(this.data.differentialForm.significant).toArray()))).bake()
    }
    this.updateProgressBar(100, "Processed significant")
    const currentDF = this.data.differential.df.where(r => this.data.differentialForm.comparisonSelect.includes(r[this.data.differentialForm.comparison]))
    const fc = currentDF.getSeries(this.data.differentialForm.foldChange).where(i => !isNaN(i)).bake()
    const sign = currentDF.getSeries(this.data.differentialForm.significant).where(i => !isNaN(i)).bake()
    this.data.minMax = {
      fcMin: fc.min(),
      fcMax: fc.max(),
      pMin: sign.min(),
      pMax: sign.max()
    }

    this.data.currentDF = this.data.differential.df.where(r => this.data.differentialForm.comparisonSelect.includes(r[this.data.differentialForm.comparison]))
    const d: string[] = []
    for (const r of this.data.currentDF) {
      d.push(r[this.data.differentialForm.primaryIDs] + "("+r[this.data.differentialForm.comparison]+")")
    }

    this.data.currentDF = this.data.currentDF.withSeries("UniquePrimaryIDs", new Series(d)).bake()
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
    this.copySessionSettings()
    await this.addColorCategoryToSettings()
    this.addDefaultColors();
    await this.loadPeptideData()
    await this.loadLogFiles()
    this.processUniProt()
  }

  updateProgressBar(value: number, text: string) {
    this.progressBar.value = value
    this.progressBar.text = text
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

  private createPayload(permanent: boolean = false) {
    const extraData: any = {
      uniprot: {
        results: this.uniprot.results,
        dataMap: this.uniprot.dataMap,
        db: this.uniprot.db,
        organism: this.uniprot.organism,
        accMap: this.uniprot.accMap,
        geneNameToAcc: this.uniprot.geneNameToAcc
      },
      data: {
        dataMap: this.data.dataMap,
        genesMap: this.data.genesMap,
        primaryIDsmap: this.data.primaryIDsMap,
        allGenes: this.data.allGenes,
      }
    }
    const data: any = {
      raw: this.data.raw.originalFile,
      rawForm: this.data.rawForm,
      differentialForm: this.data.differentialForm,
      processed: this.data.differential.originalFile,
      password: "",
      selections: this.data.selected,
      selectionsMap: this.data.selectedMap,
      selectionsName: this.data.selectOperationNames,
      settings: this.settings.settings,
      fetchUniprot: this.data.fetchUniprot,
      annotatedData: this.data.annotatedData,
      extraData: extraData,
      permanent: permanent,
    }
    console.log(data.settings.conditionOrder)

    return data
  }

  saveSession() {
    if (!this.session) {
      return
    }
    console.log(this.data.currentDF)
    console.log(this.payload)
    const encryption: CurtainEncryption = {
      encrypted: this.settings.settings.encrypted,
      e2e: this.settings.settings.encrypted,
      publicKey: this.data.public_key,
    }
    this.toast.show("User information", `Curtain link #${this.sessionId+1} is being submitted`).then()
    this.accounts.curtainAPI.putSettings(this.payload, !this.session.private, this.payload.settings.description, "TP", encryption, this.session.data.permanent, this.onUploadProgress).then((data: any) => {
      console.log(data.data)
      if (data.data) {
        this.finished.emit(data.data.link_id)
        this.data.reset()
        this.uniprot.reset()
        this.settings.settings = new Settings()
        this.updateProgressBar(100, "Finished")
        this.toast.show("User information", `Curtain link ${this.sessionId+1} saved with unique id ${data.data.link_id}`).then()
      }
    }).catch(err => {
      console.log(err)
      this.updateProgressBar(100, "Error on upload")
      this.toast.show("User information", `Curtain link #${this.sessionId+1} cannot be saved`).then()

    })
  }

  onUploadProgress = (progressEvent: any) => {
   this.updateProgressBar(progressEvent.progress * 100, "Uploading session data at " + Math.round(progressEvent.progress *100) + "%")
  }

  async loadPeptideData() {
    if (!this.session) {
      return
    }
    if (this.session.peptideFileForm) {
      if (this.session.peptideFile && this.session.peptideFileForm.value.primaryIdColumn && this.session.peptideFileForm.value.sampleColumns) {
        const loadedFile = await this.readFileAsync(this.session.peptideFile);
        const peptideDF = fromCSV(<string>loadedFile)
        const peptideCountData: any = {}
        const primaryId = this.session.peptideFileForm.value.primaryIdColumn
        peptideDF.forEach((row: any) => {
          if (this.session) {

            this.session.peptideFileForm.value.sampleColumns.forEach((sampleColumn: string) => {
              const primaryIDValue = row[primaryId]
              if (!peptideCountData[primaryIDValue]) {
                peptideCountData[primaryIDValue] = {}
              }
              peptideCountData[primaryIDValue][sampleColumn] = row[sampleColumn];
            });
          }
        })
        this.settings.settings.peptideCountData = peptideCountData;
      }
    }
  }

  readFileAsync(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("File reading failed"));
        }
      };
      reader.onerror = () => {
        reject(new Error("File reading failed"));
      };
      reader.readAsText(file);
    });
  }

  async loadLogFiles() {
    if (this.session) {
      for (const f of this.session.extraFiles) {
        const loadedFile = await this.readFileAsync(f.file);
        this.settings.settings.extraData.push({type: f.type, content: loadedFile, name: f.file.name});
      }
    }

  }

  addLogFile() {
    if (!this.session) {
      return
    }
    // @ts-ignore
    this.session.extraFiles.push({file: null, type: "log"})
    this.session.extraFiles = [...this.session.extraFiles]
  }

  removeLogFile(index: number) {
    if (!this.session) {
      return
    }
    // @ts-ignore
    this.session.extraFiles.splice(index, 1)
    this.session.extraFiles = [...this.session.extraFiles]
  }

  copySessionSettings() {
    if (this.session) {
      this.settings.settings.description = this.session.data.settings.description
      this.settings.settings.dataAnalysisContact = this.session.data.settings.dataAnalysisContact
      this.settings.settings.fetchUniprot = this.session.data.fetchUniprot
      this.settings.settings.volcanoAxis = this.session.data.settings.volcanoAxis
      this.settings.settings.volcanoPlotGrid = this.session.data.settings.volcanoPlotGrid
      this.settings.settings.volcanoPlotDimension = this.session.data.settings.volcanoPlotDimension
      this.settings.settings.volcanoAdditionalShapes = this.session.data.settings.volcanoAdditionalShapes
      this.settings.settings.volcanoPlotTitle = this.session.data.settings.volcanoPlotTitle
      this.settings.settings.volcanoPlotLegendX = this.session.data.settings.volcanoPlotLegendX
      this.settings.settings.volcanoPlotLegendY = this.session.data.settings.volcanoPlotLegendY
      this.settings.settings.volcanoPlotYaxisPosition = this.session.data.settings.volcanoPlotYaxisPosition
      this.settings.settings.customVolcanoTextCol = this.session.data.settings.customVolcanoTextCol
      this.settings.settings.defaultColorList = this.session.data.settings.defaultColorList
      this.settings.settings.pCutoff = this.session.data.settings.pCutoff
      this.settings.settings.log2FCCutoff = this.session.data.settings.log2FCCutoff
      this.settings.settings.viewPeptideCount = this.session.data.settings.viewPeptideCount
    }
  }

  async updateColorCategories(column: string) {
    let categories: string[] = []
    const categoryMap: any = {}
    if (this.session && this.session.differentialFile && this.session.data && this.session.colorCategoryPrimaryIdColumn !== "") {
      const file = this.readFileAsync(this.session.differentialFile)
      const df = fromCSV(await file)

      df.forEach((row) => {
        if (this.session && this.session.data) {
          const primaryID = row[this.session.colorCategoryPrimaryIdColumn]
          let comparison = "1"
          if (row[this.session.data.differentialForm.comparison]) {
            comparison = row[this.session.data.differentialForm.comparison]
          }
          const category = row[column]
          const title = `${column} ${category} (${comparison})`
          if (!categoryMap[title]) {
            categoryMap[title] = {
              count: 1,
              color: "#a4a2a2",
              comparison: comparison,
              primaryIDs: [primaryID],
              value: category
            }
          } else {
            categoryMap[title].count++
            categoryMap[title].primaryIDs.push(primaryID)
          }
        }
      })
      categories = Object.keys(categoryMap)
      const forms: FormGroup[] = []
      for (const c of categories) {
        const form = this.fb.group({
          color: [categoryMap[c].color],
          category: [column],
          value: [categoryMap[c].value],
          comparison: [categoryMap[c].comparison],
          label: ['']
        })
        forms.push(form)
      }
      this.session.colorCategoryForms = forms
    }
  }

  removeFromColorCategories(index: number) {
    if (this.session) {
      this.session.colorCategoryForms.splice(index, 1)
    }
  }

  async addColorCategoryToSettings() {
    if (this.session && this.session.colorCategoryForms.length>0 && this.session.differentialFile && this.data.currentDF.count() > 0) {
      console.log(this.data.currentDF.count())
      const df = this.data.currentDF
      console.log(df.toArray())
      for (const c of this.session.colorCategoryForms) {
        if (this.session) {
          let comparison = this.session.data.differentialForm.comparison
          let filtered: IDataFrame = new DataFrame()
          if (comparison === ""|| comparison === null) {
            filtered = df.where(r => r[c.value.category] === c.value.value).bake()
          } else {
            filtered = df.where(r => r[c.value.category] === c.value.value && r[comparison] === c.value.comparison
            ).bake()
          }
          console.log(df)
          const primaryIds = filtered.getSeries(this.session.colorCategoryPrimaryIdColumn).distinct().toArray()
          console.log(primaryIds)
          if (primaryIds.length > 0) {
            let operationName = `${c.value.value} [${c.value.category}] (${c.value.comparison})`
            if (c.value.label) {
              operationName = `${c.value.label} (${c.value.comparison})`
            }
            if (!this.data.selectOperationNames.includes(operationName)) {
              this.data.selectOperationNames.push(operationName)
            }
            this.settings.settings.colorMap[operationName] = c.value.color
            for (const p of primaryIds) {
              if (!this.data.selectedMap[p]) {
                this.data.selectedMap[p] = {}
              }
              this.data.selectedMap[p][operationName] = true
            }
          }
        }
      }
    }
  }

  defaultVolcanoColors() {
    if (this.session) {
      let currentPosition = 0
      const pConditions = ["P-value > ", "P-value <= "]
      const fcConditions = ["FC > ", "FC <= "]

      const groups = []
      for (const p of pConditions) {
        for (const f of fcConditions) {
          if (currentPosition >= this.settings.settings.defaultColorList.length) {
            currentPosition = 0
          }
          if (!this.session.volcanoColors[p+f]) {
            this.session.volcanoColors[p+f] = {
              p: p,
              fc: f,
              color: this.settings.settings.defaultColorList[currentPosition]
            }
          }
          currentPosition ++
        }
      }
    }
  }

  updateDefaultPalette(palette: string) {
    if (this.session) {
      this.session.data.settings.defaultColorList = [...this.data.palette[palette]]
    }
  }

  outputTest(s: string) {
    console.log(s)
  }

  updateDefaultVolcanoColorP(value:number) {
    if (this.session) {
      for (const c in this.session.volcanoColors) {
        this.settings.settings.pCutoff = value
      }
    }
  }

  updateDefaultVolcanoColorFC(value:number) {
    if (this.session) {
      for (const c in this.session.volcanoColors) {
        this.settings.settings.log2FCCutoff = value
      }
    }
  }


}
