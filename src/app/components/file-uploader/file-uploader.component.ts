import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {WebService} from "../../service/web.service";
import {GraphData} from "../../classes/graph-data";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import {forkJoin} from "rxjs";
import {NotificationService} from "../../service/notification.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent implements OnInit {
  fileName: string = "";
  file: File|undefined;
  @Output() data = new EventEmitter<GraphData>();
  raw: IDataFrame = new DataFrame()
  processed: IDataFrame = new DataFrame()
  graphData: GraphData = new GraphData()
  accessionList: string[] = []
  rawFileName: string = "";
  log10pvalue: boolean = false;
  enableFetch: boolean = true;
  saveInputFile: boolean = false;
  loadSavedInput: boolean = false;

  get description(): string {
    return this._description
  }

  set description(value: string) {
    if (value) {
      this._description = value
    }
  }
  private _description: string = "";
  downloadSettingsFile: boolean = false
  constructor(private http: WebService, private modalService: NgbModal, private uniprot: UniprotService, private dataService: DataService, private notification: NotificationService) {
    this.dataService.updateSettings.subscribe(data => {
      if (data) {
        this.log10pvalue = this.dataService.settings.antilogP
        this.enableFetch = this.dataService.settings.uniprot
        this.description = this.dataService.settings.description
        if (this.dataService.settings.fileIsLink) {
          forkJoin([this.http.getProcessedInput(this.dataService.settings.processedFile), this.http.getRawInput(this.dataService.settings.rawFile)]).subscribe(res => {
            this.processed = fromCSV(<string>res[0].body)
            this.raw = fromCSV(<string>res[1].body)
            this.graphData = this.dataService.settings.dataColumns
            this.getUniprot()
          })
        } else {
          if (this.dataService.rawFile !== "") {
            this.raw = fromCSV(<string>this.dataService.rawFile)
          }
          if (this.dataService.processedFile !== "") {
            this.processed = fromCSV(<string>this.dataService.processedFile)
          }
          this.graphData = this.dataService.settings.dataColumns
          if (this.dataService.rawFile !== "" && this.dataService.processedFile !== "") {
            this.getUniprot()
          }
        }

      }
    })

    this.uniprot.uniprotParseStatusObserver.subscribe(status => {
      if (status) {

        const processedNotIgnore = [
          this.graphData.processedIdentifierCol,
          this.graphData.processedLog2FC,
          this.graphData.processedPValue
        ]
        const renameProcessed: any = {}
        //this.notification.show("Renaming columns from input files")
        if (this.graphData.processedLog2FC !== "logFC") {
          renameProcessed[this.graphData.processedLog2FC] = "logFC"
        }
        if (this.graphData.processedIdentifierCol !== "Primary IDs") {
          renameProcessed[this.graphData.processedIdentifierCol] = "Primary IDs"
        }

        if (this.graphData.processedPValue !== "pvalue") {
          renameProcessed[this.graphData.processedPValue] = "pvalue"
        }
        if (this.graphData.processedCompLabel !== "") {
          if (this.graphData.processedCompLabel !== "comparison") {
            renameProcessed[this.graphData.processedCompLabel] = "comparison"
          }
          processedNotIgnore.push(this.graphData.processedCompLabel)
        }

        const processedIgnore: any[] = []
        for (const c of this.processed.getColumnNames()) {
          if (!(processedNotIgnore.includes(c))) {
            processedIgnore.push(c)
          }
        }
        const rawRename: any = {}

        if (this.graphData.rawIdentifierCol !== "Primary IDs") {
          rawRename[this.graphData.rawIdentifierCol] = "Primary IDs"
        }

        if (this.uniprot.fetched) {
          this.graphData.uniprotMap = this.uniprot.results
        }

        this.graphData.processed = this.processed.dropSeries(processedIgnore).bake()
        if (Object.keys(renameProcessed).length > 0) {
          this.graphData.processed = this.graphData.processed.renameSeries(renameProcessed).bake()
        }

        for (const c of this.graphData.processed.getColumnNames()) {
          if (!(["Primary IDs", "comparison"].includes(c))) {
            //this.notification.show("Converting " + c + " to numbers.", {delay: 1000})
            const d: any = []
            for (const a of this.graphData.processed.getSeries(c).toArray()) {
              const v = parseFloat(a)
              d.push(v)
            }
            this.graphData.processed = this.graphData.processed.withSeries(c, new Series(d)).bake()
          }
        }
        const decrease: string[] = []
        const increase: string[] = []
        const noChange: string[] = []
        if (this.uniprot.fetched) {
          for (const r of this.graphData.processed) {
            if (this.uniprot.results.has(r["Primary IDs"])) {
              if (r["logFC"] > 0.6) {
                for (const gene of this.uniprot.results.get(r["Primary IDs"])["Gene names"].split(";")) {
                  if (gene !== "") {
                    increase.push(gene.toUpperCase())
                    this.dataService.geneToPrimaryMap.set(gene.toUpperCase(), r["Primary IDs"])
                  }
                }
              } else if (r["logFC"] < -0.6) {
                for (const gene of this.uniprot.results.get(r["Primary IDs"])["Gene names"].split(";")) {
                  if (gene !== "") {
                    decrease.push(gene.toUpperCase())
                    this.dataService.geneToPrimaryMap.set(gene.toUpperCase(), r["Primary IDs"])
                  }
                }
              } else {
                for (const gene of this.uniprot.results.get(r["Primary IDs"])["Gene names"].split(";")) {
                  if (gene !== "") {
                    noChange.push(gene.toUpperCase())
                    this.dataService.geneToPrimaryMap.set(gene.toUpperCase(), r["Primary IDs"])
                  }
                }
              }
            }
          }
        }
        this.dataService.noChange = noChange
        this.dataService.increase = increase
        this.dataService.decrease = decrease

        if (this.log10pvalue) {
          const temp = []
          //this.notification.show("Perform anti-log10 transform of log10 p-value", {delay: 1000})
          for (const l of this.graphData.processed.getSeries("pvalue").bake().toArray()) {
            temp.push(10**(-l))
          }
          this.graphData.processed = this.graphData.processed.withSeries("pvalue", new Series(temp)).bake()
        }
        this.graphData.raw = this.raw
        if (Object.keys(rawRename).length > 0) {
          this.graphData.raw = this.graphData.raw.renameSeries(rawRename).bake()
        }
        if (this.graphData.rawSamplesCol.length === 0) {
          for (const c of this.graphData.raw.getColumnNames()) {
            if (c !== "Primary IDs") {
              this.graphData.rawSamplesCol.push(c)
            }
          }
        }

        for (const c of this.graphData.rawSamplesCol) {
          //this.notification.show("Converting " + c + " to numbers.", {delay: 1000})
          const d: any = []
          for (const a of this.graphData.raw.getSeries(c).toArray()) {
            d.push(parseFloat(a))
          }
          this.graphData.raw = this.graphData.raw.withSeries(c, new Series(d)).bake()
        }
        this.dataService.sampleColumns = this.graphData.rawSamplesCol
        this.dataService.processedIdentifier = this.graphData.processedIdentifierCol
        this.dataService.rawIdentifier = this.graphData.rawIdentifierCol
        this.dataService.settings.dataColumns = this.graphData

        this.data.emit(this.graphData)
        console.log(this.dataService.settings)
        if (Object.keys(this.dataService.initialSearch).length >0) {
          this.dataService.initialBatchSelection.next(true)
        } else {
          if (this.dataService.settings.selectedIDs) {
            if (this.dataService.settings.selectionTitles === undefined) {
              this.dataService.settings.selectionTitles = []
              if (Object.keys(this.dataService.settings.selectedIDs).length > 0) {
                this.dataService.batchSelection("Selected", "Primary IDs", Object.keys(this.dataService.settings.selectedIDs))
              }

            }
          }
        }
      }
    })
  }

  loadSettings(e: Event) {
    if (e.target) {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.file = target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {

          const loadedFile = reader.result;
          this.dataService.settings = JSON.parse(<string>loadedFile)
          this.log10pvalue = this.dataService.settings.antilogP
          this.description = this.dataService.settings.description
          if (this.dataService.settings.fileIsLink) {
            forkJoin([this.http.getProcessedInput(this.dataService.settings.processedFile), this.http.getRawInput(this.dataService.settings.rawFile)]).subscribe(res => {
              this.processed = fromCSV(<string>res[0].body)
              this.raw = fromCSV(<string>res[1].body)
              this.graphData = this.dataService.settings.dataColumns
            })
          } else {
            this.graphData = this.dataService.settings.dataColumns
          }
        };
        reader.readAsText(this.file);
      }
    }
  }

  handleFile(e: Event, raw: boolean) {
    if (e.target) {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.file = target.files[0];
        if (!raw) {
          this.fileName = target.files[0].name + "";
          this.dataService.settings.processedFile =this.fileName

        } else {
          this.rawFileName = target.files[0].name + "";
          this.dataService.settings.rawFile = this.rawFileName
        }

        const reader = new FileReader();

        reader.onload = (event) => {
          const loadedFile = reader.result;
          if (raw) {
            this.raw = fromCSV(<string>loadedFile)

          } else {
            this.processed = fromCSV(<string>loadedFile)

          }
        };
        reader.readAsText(this.file);
      }
    }
  }
  password: string = ""
  modalViewer(content: any) {
    this.modalService.open(content, {ariaLabelledBy: "saveSettings"}).result.then((result) => {
      this.dataService.settings.antilogP = this.log10pvalue
      this.dataService.settings.fileSavedOnSever = this.saveInputFile
      this.dataService.settings.description = this.description
      const settings = JSON.stringify(this.dataService.settings, (key, value) => {
        if (!this.saveInputFile) {
          if (key=="rawFile") {
            return ""
          }
          if (key=="processedFile") {
            return ""
          }
        }
        if (key=="raw") return undefined;
        else if (key=="processed") return undefined;
        else return value;
      })
      const selections: any = {}
      for (const i of this.dataService.allSelected) {
        // @ts-ignore
        for (const m of this.dataService.selectionMap.get(i)) {
          if (!(m in selections)) {
            selections[m] = []
          }
          selections[m].push(i)
        }
      }
      if (this.saveInputFile) {
        const data: any = {raw: this.raw.toCSV(), processed: this.processed.toCSV(), settings: settings, password: this.password, selections: selections}
        this.http.putSettings(data).subscribe(data => {
          if (data.body) {
            this.unique_id = location.origin +"/#/"+ data.body
            this.dataService.unique_id = data.body
          }

        })
      } else {
        const data: any = {raw: "", processed: "", settings: settings, password: this.password, selections: selections}
        this.http.putSettings(data).subscribe(data => {
          if (data.body) {
            this.unique_id = location.origin +"/#/"+ data.body
            this.dataService.unique_id = data.body
          }
        })
      }
      this.password = ""
      if (this.downloadSettingsFile) {
        this.saveSettings()
      }
    }, (reason) => {
      this.password =""
    })
  }
  unique_id: string = ""
  loadTest() {
    this.http.getProcessedInput().subscribe(data => {
      this.processed = fromCSV(<string>data.body)
      this.graphData.processedCompLabel = "comparison"
      this.graphData.processedIdentifierCol = "Proteins"
      this.graphData.processedPValue = "adj.P.Val"
      this.graphData.processedLog2FC = "logFC"
    })
    this.http.getRawInput().subscribe(data => {
      this.raw = fromCSV(<string>data.body)
      this.graphData.rawIdentifierCol = "uniprot"
      this.graphData.rawSamplesCol = this.graphData.raw.getColumnNames().slice(1)
    })
  }

  saveSettings() {
    this.dataService.settings.antilogP = this.log10pvalue
    this.dataService.settings.fileSavedOnSever = this.saveInputFile
    const blob = new Blob([JSON.stringify(this.dataService.settings, (key, value) => {
      if (!this.saveInputFile) {
        if (key=="rawFile") {
          return ""
        }
        if (key=="processedFile") {
          return ""
        }
      }
      if (key=="raw") return undefined;
      else if (key=="processed") return undefined;
      else return value;
    })], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob);

    if (typeof(navigator.msSaveOrOpenBlob)==="function") {
      navigator.msSaveBlob(blob, "viewer.json")
    } else {
      const a = document.createElement("a")
      a.href = url
      a.download = "viewer.json"
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url)
  }

  getUniprot(e?: Event) {
    if (e) {
      e.stopPropagation()
    }
    this.uniprot.fetched = false
    this.dataService.settings.uniprot = this.enableFetch
    this.uniprot.accMap = new Map<string, string>()
    if (this.enableFetch) {
      this.uniprot.fetched = true
      this.accessionList = []
      const accList: string[] = []
      for (const a of this.raw.getSeries(this.graphData.rawIdentifierCol).bake().toArray()) {
        const d = a.split(";")
        for (const acc of d) {
          const accession = this.uniprot.Re.exec(acc)
          if (accession !== null) {
            this.uniprot.accMap.set(accession[0], a)
            this.uniprot.accMap.set(a, accession[0])
            this.accessionList.push(accession[0])
            if (!this.uniprot.results.has(a)) {
              accList.push(accession[0])
            }
            break
          }
        }

      }

      this.uniprot.uniprotParseStatus.next(false)
      try {
        this.notification.show(`Getting UniProt data for ${this.accessionList.length} accession ids`, { delay: 10000 })
        this.uniprot.UniProtParseGet([...accList], false)
      } catch (e) {
        this.notification.show("Error occurs while processing UniProt data", {classname: 'bg-danger text-light', delay: 10000 })
        console.log(e);
      }
    } else {
      this.uniprot.uniprotParseStatus.next(true)
    }

  }

  ngOnInit(): void {

  }

  downloadData(filename: string) {
    let fileContent = ""
    switch (filename) {
      case "differential":
        fileContent = this.processed.toCSV()
        break
      case "raw":
        fileContent = this.raw.toCSV()
        break
      default:
        break
    }

    const blob = new Blob([fileContent], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob);
    if (typeof(navigator.msSaveOrOpenBlob)==="function") {
      navigator.msSaveBlob(blob, filename + ".csv")
    } else {
      const a = document.createElement("a")
      a.href = url
      a.download = filename + ".csv"
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url)
  }
}
