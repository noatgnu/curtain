import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {WebService} from "../../service/web.service";
import {GraphData} from "../../classes/graph-data";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {forkJoin} from "rxjs";

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
  constructor(private http: WebService, private uniprot: UniprotService, private dataService: DataService, private route: ActivatedRoute) {
    this.dataService.updateSettings.subscribe(data => {
      if (data) {
        forkJoin([this.http.getProcessedInput(this.dataService.settings.processedFile), this.http.getRawInput(this.dataService.settings.rawFile)]).subscribe(res => {
          this.processed = fromCSV(<string>res[0].body)
          this.raw = fromCSV(<string>res[1].body)
          this.graphData = this.dataService.settings.dataColumns
          if (this.dataService.settings.uniprot) {
            this.getUniprot()
          }

        })
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
            this.graphData.processed = this.graphData.processed.withSeries(c, new Series(this.graphData.processed.getSeries(c).parseFloats().bake().toArray())).bake()
          }
        }
        if (this.log10pvalue) {
          const temp = []
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
          this.graphData.raw = this.graphData.raw.withSeries(c, new Series(this.graphData.raw.getSeries(c).parseFloats().bake().toArray())).bake()
        }
        this.dataService.sampleColumns = this.graphData.rawSamplesCol
        this.dataService.processedIdentifier = this.graphData.processedIdentifierCol
        this.dataService.rawIdentifier = this.graphData.rawIdentifierCol
        this.dataService.settings.dataColumns = this.graphData

        this.data.emit(this.graphData)

      }
    })
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
    console.log(this.dataService.settings)
    const blob = new Blob([JSON.stringify(this.dataService.settings, (key, value) => {
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
    if (this.enableFetch) {

      this.accessionList = []
      const accList: string[] = []
      for (const a of this.raw.getSeries(this.graphData.rawIdentifierCol).bake().toArray()) {
        const d = a.split(";")
        const accession = this.uniprot.Re.exec(d[0])
        if (accession !== null) {
          this.accessionList.push(accession[0])
          if (!this.uniprot.results.has(accession[0])) {
            accList.push(accession[0])
          }
        }
      }

      this.uniprot.uniprotParseStatus.next(false)
      try {
        this.uniprot.UniProtParseGet([...accList], false)
      } catch (e) {
        console.log(e);
      }
    } else {
      this.uniprot.uniprotParseStatus.next(true)
    }

  }

  ngOnInit(): void {

  }

}
