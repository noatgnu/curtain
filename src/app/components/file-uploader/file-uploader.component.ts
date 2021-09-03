import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {WebService} from "../../service/web.service";
import {GraphData} from "../../classes/graph-data";
import {UniprotService} from "../../service/uniprot.service";
import {DataService} from "../../service/data.service";

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
  constructor(private http: WebService, private uniprot: UniprotService, private dataService: DataService) {
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
        if (this.graphData.processedIdentifierCol !== "Proteins") {
          renameProcessed[this.graphData.processedIdentifierCol] = "Proteins"
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
        if (this.graphData.rawIdentifierCol !== "Proteins") {
          rawRename[this.graphData.rawIdentifierCol] = "Proteins"
        }

        this.graphData.uniprotMap = this.uniprot.results
        this.graphData.processed = this.processed.dropSeries(processedIgnore).bake()
        if (Object.keys(renameProcessed).length > 0) {
          this.graphData.processed = this.graphData.processed.renameSeries(renameProcessed).bake()
        }
        for (const c of this.graphData.processed.getColumnNames()) {
          if (!(["Proteins", "comparison"].includes(c))) {
            this.graphData.processed = this.graphData.processed.withSeries(c, new Series(this.graphData.processed.getSeries(c).parseFloats().bake().toArray())).bake()
          }
        }
        this.graphData.raw = this.raw
        if (Object.keys(rawRename).length > 0) {
          this.graphData.raw = this.graphData.raw.renameSeries(rawRename).bake()
        }
        if (this.graphData.rawSamplesCol.length === 0) {
          for (const c of this.graphData.raw.getColumnNames()) {
            if (c !== "Proteins") {
              this.graphData.rawSamplesCol.push(c)
            }
          }
        }
        for (const c of this.graphData.rawSamplesCol) {
          this.graphData.raw = this.graphData.raw.withSeries(c, new Series(this.graphData.raw.getSeries(c).parseFloats().bake().toArray())).bake()
        }
        this.dataService.sampleColumns = this.graphData.rawSamplesCol
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
          this.fileName = target.files[0].name;
        } else {
          this.rawFileName = this.fileName = target.files[0].name;
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

  getUniprot(e: Event) {
    e.stopPropagation()
    for (const a of this.raw.getSeries(this.graphData.rawIdentifierCol).bake().toArray()) {
      const d = a.split(";")
      const accession = this.uniprot.Re.exec(d[0])
      if (accession !== null) {
        this.accessionList.push(accession[0])
      }
    }

    this.uniprot.uniprotParseStatus.next(false)
    try {
      this.uniprot.UniProtParseGet([...this.accessionList], false)
    } catch (e) {
      console.log(e);
    }
  }

  ngOnInit(): void {
  }

}
