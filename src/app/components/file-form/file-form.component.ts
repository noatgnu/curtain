import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { InputFile } from "../../classes/input-file";
import { DataService } from "../../data.service";
import { DataFrame, fromJSON, IDataFrame, Series } from "data-forge";
import { UniprotService } from "../../uniprot.service";
import { SettingsService } from "../../settings.service";
import { ToastService } from "../../toast.service";

interface ProgressBarState {
  value: number;
  text: string;
}

@Component({
  selector: 'app-file-form',
  templateUrl: './file-form.component.html',
  styleUrls: ['./file-form.component.scss'],
  standalone: false
})
export class FileFormComponent implements OnInit {
  iscollapse = false;
  progressBar: ProgressBarState = { value: 0, text: "" };
  transformedFC = false;
  transformedP = false;
  clicked = false;
  autoMatchSampleColumnsPattern= "\\.s"

  @Output() finished: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    public data: DataService,
    private uniprot: UniprotService,
    public settings: SettingsService,
    private toast: ToastService
  ) {
    this.uniprot.uniprotProgressBar.subscribe(data => {
      this.progressBar.value = data.value;
      this.progressBar.text = data.text;
    });

    this.data.restoreTrigger.asObservable().subscribe(data => {
      if (data) {
        this.updateProgressBar(100, "Restoring session...");
        if (!this.clicked) {
          this.clicked = true;
          this.finished.emit(false);
        }
        this.startWork();
      }
    });
  }

  ngOnInit(): void {
    // Component initialization logic
  }

  /**
   * Starts the data processing workflow, either using a Worker or direct processing
   */
  startWork(): void {
    this.finished.emit(false);

    if (typeof Worker !== 'undefined') {
      // Use Web Worker for better performance
      const worker = new Worker(new URL('./data.worker', import.meta.url));

      worker.onmessage = (event: MessageEvent<any>) => {
        const data = event.data;
        if (!data) {
          worker.terminate();
          return;
        }

        switch (data.type) {
          case "progress":
            this.updateProgressBar(data.value, data.text);
            break;

          case "resultDifferential":
            this.processDifferentialResult(data, worker);
            break;

          case "resultRaw":
            this.processRawResult(data);
            worker.terminate();
            break;

          case "resultDifferentialCompleted":
            // Handle completion if needed
            break;
        }
      };

      // Start differential file processing
      worker.postMessage({
        task: 'processDifferentialFile',
        differential: this.data.differential.originalFile,
        differentialForm: this.data.differentialForm
      });

      this.data.differential.df = new DataFrame();
    } else {
      // Fallback to direct processing when Workers aren't available
      this.processFiles().catch(error => {
        console.error("Error processing files:", error);
        this.toast.show("Error", "Failed to process files. See console for details.");
      });
    }
  }

  autoMatchSampleColumns(): void {
    // Automatically match sample columns based on the pattern
    const regex = new RegExp(this.autoMatchSampleColumnsPattern);
    const matchedColumns = this.data.raw.df.getColumnNames().filter(name => regex.test(name));
    console.log(matchedColumns);
    if (matchedColumns.length > 0) {
      this.data.rawForm.samples = matchedColumns;
      this.toast.show("Success", `Matched ${matchedColumns.length} sample columns.`);
    } else {
      this.toast.show("Info", "No sample columns matched the pattern.");
    }
  }

  /**
   * Process differential result data from worker
   */
  private processDifferentialResult(data: any, worker: Worker): void {
    this.data.differential.df = fromJSON(data.differential);

    // Update differential form with values from worker
    for (const key in this.data.differentialForm) {
      if (this.data.differentialForm.hasOwnProperty(key) && key in data.differentialForm) {
        // @ts-ignore - property access is dynamic
        this.data.differentialForm[key] = data.differentialForm[key];
      }
    }

    // Filter dataframe by selected comparisons
    let currentDF = this.data.differential.df
      .where(r => this.data.differentialForm.comparisonSelect.includes(r[this.data.differentialForm.comparison]))
      .bake();

    // Create unique IDs for each entry
    const uniqueIds: string[] = [];
    for (const row of currentDF) {
      uniqueIds.push(`${row[this.data.differentialForm.primaryIDs]}(${row[this.data.differentialForm.comparison]})`);
    }

    // Add unique IDs to dataframe
    currentDF = currentDF.withSeries("UniquePrimaryIDs", new Series(uniqueIds)).bake();

    // Calculate min/max values for fc and significance
    const fc = currentDF.getSeries(this.data.differentialForm.foldChange).where(i => !isNaN(i)).bake();
    const sign = currentDF.getSeries(this.data.differentialForm.significant).where(i => !isNaN(i)).bake();

    this.data.minMax = {
      fcMin: fc.min(),
      fcMax: fc.max(),
      pMin: sign.min(),
      pMax: sign.max()
    };

    this.data.currentDF = currentDF;
    this.data.primaryIDsList = this.data.currentDF.getSeries(this.data.differentialForm.primaryIDs).bake().distinct().toArray();

    // Build primary IDs mapping
    this.buildPrimaryIdsMap();

    // Start raw file processing
    worker.postMessage({
      task: 'processRawFile',
      rawForm: this.data.rawForm,
      raw: this.data.raw.originalFile,
      settings: Object.assign({}, this.settings.settings)
    });

    this.data.raw.df = new DataFrame();
  }

  /**
   * Process raw result data from worker
   */
  private processRawResult(data: any): void {
    console.log(data.settings.currentID);
    console.log(data.raw);

    this.data.raw.df = fromJSON(data.raw);

    // Update settings from worker result
    for (const settingKey in this.settings.settings) {
      if (this.settings.settings.hasOwnProperty(settingKey)) {
        // @ts-ignore - property access is dynamic
        this.settings.settings[settingKey] = data.settings[settingKey];
      }
    }

    this.data.conditions = data.conditions;
    console.log(this.settings.settings);

    this.processUniProt();
  }

  /**
   * Builds mapping of primary IDs for faster lookup
   */
  private buildPrimaryIdsMap(): void {
    for (const primaryId of this.data.primaryIDsList) {
      if (!this.data.primaryIDsMap[primaryId]) {
        this.data.primaryIDsMap[primaryId] = {};
        this.data.primaryIDsMap[primaryId][primaryId] = true;
      }

      for (const splitId of primaryId.split(";")) {
        if (!this.data.primaryIDsMap[splitId]) {
          this.data.primaryIDsMap[splitId] = {};
        }
        this.data.primaryIDsMap[splitId][primaryId] = true;
      }
    }
  }

  /**
   * Handle file import events
   */
  handleFile(e: InputFile, isRawFile: boolean): void {
    if (isRawFile) {
      this.data.raw = e;
    } else {
      this.data.differential = e;
      // Auto-populate description with filename if description is empty
      if (!this.settings.settings.description || this.settings.settings.description.trim() === '') {
        this.settings.settings.description = e.filename;
      }
    }
  }

  /**
   * Update the progress bar state
   */
  updateProgressBar(value: number, text: string): void {
    this.progressBar.value = value;
    this.progressBar.text = text;
  }

  /**
   * Process input files directly (fallback when Web Workers aren't available)
   */
  async processFiles(e: Event | null = null): Promise<void> {
    if (e) {
      e.preventDefault();
    }

    if (this.clicked) {
      return; // Prevent duplicate processing
    }

    this.clicked = true;
    this.finished.emit(false);

    try {
      // Set default comparison if not specified
      if (!this.data.differentialForm.comparison || this.data.differentialForm.comparison === "" || this.data.differentialForm.comparison === "CurtainSetComparison") {
        this.data.differentialForm.comparison = "CurtainSetComparison";
        this.data.differentialForm.comparisonSelect = ["1"];
        this.data.differential.df = this.data.differential.df
          .withSeries("CurtainSetComparison", new Series(Array(this.data.differential.df.count()).fill("1")))
          .bake();
      }

      // Set default comparison selection if not specified
      if (!this.data.differentialForm.comparisonSelect || this.data.differentialForm.comparisonSelect.length === 0) {
        this.data.differentialForm.comparisonSelect = [this.data.differential.df.first()[this.data.differentialForm.comparison]];
      }

      await this.processSamples();
      await this.processDataFrames();

      // Process current differential dataframe
      const currentDF = this.data.differential.df.where(r =>
        this.data.differentialForm.comparisonSelect.includes(r[this.data.differentialForm.comparison])
      );

      this.calculateMinMax(currentDF);
      this.createUniqueIds(currentDF);
      this.buildPrimaryIdsMap();

      await this.processUniProt();

    } catch (error) {
      console.error("Error in processFiles:", error);
      this.toast.show("Error", "Failed to process files. See console for details.");
    }
  }

  /**
   * Process samples and build sample mapping
   */
  private async processSamples(): Promise<void> {
    const totalSampleNumber = this.data.rawForm.samples.length;
    let sampleNumber = 0;

    // Determine sample order
    let samples: string[] = [];
    const conditionOrder = this.settings.settings.conditionOrder.slice();

    if (conditionOrder.length > 0) {
      for (const condition of conditionOrder) {
        for (const sample of this.settings.settings.sampleOrder[condition]) {
          samples.push(sample);
        }
      }
    } else {
      samples = this.data.rawForm.samples.slice();
    }

    // Process samples and build condition list
    const conditions: string[] = [];
    for (const sample of samples) {
      const condition_replicate = sample.split(".");
      const replicate = condition_replicate[condition_replicate.length-1];
      const condition = condition_replicate.slice(0, condition_replicate.length-1).join(".");

      if (!conditions.includes(condition)) {
        conditions.push(condition);
      }

      // Update sample mapping
      this.settings.settings.sampleMap[sample] = {
        replicate: replicate,
        condition: condition,
        name: sample
      };

      // Update sample order
      if (!this.settings.settings.sampleOrder[condition]) {
        this.settings.settings.sampleOrder[condition] = [];
      }
      if (!this.settings.settings.sampleOrder[condition].includes(sample)) {
        this.settings.settings.sampleOrder[condition].push(sample);
      }

      // Set sample visibility
      if (!(sample in this.settings.settings.sampleVisible)) {
        this.settings.settings.sampleVisible[sample] = true;
      }

      // Convert sample data to number
      this.data.raw.df = this.data.raw.df
        .withSeries(sample, new Series(this.convertToNumber(this.data.raw.df.getSeries(sample).toArray())))
        .bake();

      sampleNumber++;
      this.updateProgressBar(sampleNumber * 100 / totalSampleNumber, `Processed ${sample} sample data`);
    }

    // Set condition order if not already set
    if (this.settings.settings.conditionOrder.length === 0) {
      this.settings.settings.conditionOrder = conditions;
    }

    // Set color map for conditions
    this.updateColorMap(conditions);
    this.data.conditions = conditions;
  }

  /**
   * Update color mapping for conditions
   */
  private updateColorMap(conditions: string[]): void {
    let colorPosition = 0;
    const colorMap: {[key: string]: string} = {};

    for (const condition of conditions) {
      if (colorPosition >= this.settings.settings.defaultColorList.length) {
        colorPosition = 0;
      }
      colorMap[condition] = this.settings.settings.defaultColorList[colorPosition];
      colorPosition++;
    }

    this.settings.settings.colorMap = colorMap;
  }

  /**
   * Process dataframes (differential and raw)
   */
  private async processDataFrames(): Promise<void> {
    // Convert primary IDs to uppercase
    this.data.differential.df = this.toUpperCaseColumn(this.data.differentialForm.primaryIDs, this.data.differential.df);
    this.data.raw.df = this.toUpperCaseColumn(this.data.rawForm.primaryIDs, this.data.raw.df);

    // Process fold change values
    this.data.differential.df = this.data.differential.df
      .withSeries(
        this.data.differentialForm.foldChange,
        new Series(this.convertToNumber(this.data.differential.df.getSeries(this.data.differentialForm.foldChange).toArray()))
      )
      .bake();

    if (this.data.differentialForm.transformFC && !this.transformedFC) {
      this.data.differential.df = this.data.differential.df
        .withSeries(
          this.data.differentialForm.foldChange,
          new Series(this.log2Convert(this.data.differential.df.getSeries(this.data.differentialForm.foldChange).toArray()))
        )
        .bake();
      this.transformedFC = true;
    }

    this.updateProgressBar(50, "Processed fold change");

    // Process significance values
    this.data.differential.df = this.data.differential.df
      .withSeries(
        this.data.differentialForm.significant,
        new Series(this.convertToNumber(this.data.differential.df.getSeries(this.data.differentialForm.significant).toArray()))
      )
      .bake();

    if (this.data.differentialForm.transformSignificant && !this.transformedP) {
      this.data.differential.df = this.data.differential.df
        .withSeries(
          this.data.differentialForm.significant,
          new Series(this.log10Convert(this.data.differential.df.getSeries(this.data.differentialForm.significant).toArray()))
        )
        .bake();
      this.transformedP = true;
    }

    this.updateProgressBar(100, "Processed significant");
  }

  /**
   * Calculate min/max values for fold change and significance
   */
  private calculateMinMax(currentDF: IDataFrame): void {
    const fc = currentDF
      .getSeries(this.data.differentialForm.foldChange)
      .where(i => !isNaN(i))
      .bake();

    const sign = currentDF
      .getSeries(this.data.differentialForm.significant)
      .where(i => !isNaN(i))
      .bake();

    this.data.minMax = {
      fcMin: fc.min(),
      fcMax: fc.max(),
      pMin: sign.min(),
      pMax: sign.max()
    };
  }

  /**
   * Create unique IDs for dataframe entries
   */
  private createUniqueIds(currentDF: IDataFrame): void {
    this.data.currentDF = currentDF;

    const uniqueIds: string[] = [];
    for (const row of this.data.currentDF) {
      uniqueIds.push(`${row[this.data.differentialForm.primaryIDs]}(${row[this.data.differentialForm.comparison]})`);
    }

    this.data.currentDF = this.data.currentDF
      .withSeries("UniquePrimaryIDs", new Series(uniqueIds))
      .bake();

    this.data.primaryIDsList = this.data.currentDF
      .getSeries(this.data.differentialForm.primaryIDs)
      .distinct()
      .toArray();
  }

  /**
   * Convert column values to uppercase
   */
  toUpperCaseColumn(columnName: string, dataFrame: IDataFrame): IDataFrame {
    const values = dataFrame.getSeries(columnName).bake().toArray();
    return dataFrame
      .withSeries(columnName, new Series(values.map(v => v.toUpperCase())))
      .bake();
  }

  /**
   * Convert array of strings to array of numbers
   */
  convertToNumber(arr: string[]): number[] {
    return arr.map(Number);
  }

  /**
   * Convert values to log2
   */
  log2Convert(arr: number[]): number[] {
    return arr.map(value => this.log2Stuff(value));
  }

  /**
   * Calculate log2 of a value, handling negative numbers
   */
  log2Stuff(data: number): number {
    if (data > 0) {
      return Math.log2(data);
    } else if (data < 0) {
      return Math.log2(Math.abs(data));
    } else {
      return 0;
    }
  }

  /**
   * Convert values to -log10
   */
  log10Convert(arr: number[]): number[] {
    return arr.map(value => -Math.log10(value));
  }

  /**
   * Process UniProt data if needed
   */
  async processUniProt(): Promise<void> {
    console.log(this.data.fetchUniprot);

    if (this.data.fetchUniprot) {
      if (!this.data.bypassUniProt) {
        try {
          this.resetUniProtData();
          const accList = await this.buildAccessionList();

          if (accList.length > 0) {
            await this.toast.show("UniProt", "Building local UniProt database. This may take a few minutes.");
            this.uniprot.db = new Map<string, any>();

            const allGenes = await this.createUniprotDatabase(accList);
            await this.toast.show(
              "UniProt",
              `Finished building local UniProt database. ${allGenes.length} genes found.`
            );

            this.data.allGenes = allGenes;
            this.completeProcessing();
          } else {
            this.completeProcessing();
          }
        } catch (error) {
          console.error("Error in UniProt processing:", error);
          this.toast.show("Error", "Failed to process UniProt data. See console for details.");
          this.completeProcessing();
        }
      } else {
        this.data.bypassUniProt = false;
        this.completeProcessing();
      }
    } else {
      // Process gene names without UniProt
      this.processGeneNamesWithoutUniProt();
      this.completeProcessing();
    }
  }

  /**
   * Reset UniProt data structures
   */
  private resetUniProtData(): void {
    this.uniprot.geneNameToAcc = {};
    this.uniprot.uniprotParseStatus.next(false);
    this.data.dataMap = new Map<string, string>();
    this.data.genesMap = {};
    this.uniprot.accMap = new Map<string, string[]>();
    this.uniprot.dataMap = new Map<string, any>();
  }

  /**
   * Build accession list from raw data
   */
  private async buildAccessionList(): Promise<string[]> {
    const accList: string[] = [];

    for (const row of this.data.raw.df) {
      const primaryId = row[this.data.rawForm.primaryIDs];

      this.data.dataMap.set(primaryId, primaryId);
      this.data.dataMap.set(row[this.data.rawForm.primaryIDs], primaryId);

      const idParts = primaryId.split(";");
      const accession = this.uniprot.Re.exec(idParts[0]);

      if (accession) {
        this.updateAccessionMapping(primaryId, accession[1]);

        if (!this.uniprot.dataMap.has(accession[1])) {
          accList.push(accession[1]);
        }
      }
    }

    return accList;
  }

  /**
   * Update accession mapping
   */
  private updateAccessionMapping(primaryId: string, accessionId: string): void {
    // Update primaryId -> accessionId mapping
    if (this.uniprot.accMap.has(primaryId)) {
      const accList = this.uniprot.accMap.get(primaryId);
      if (accList && !accList.includes(accessionId)) {
        accList.push(accessionId);
        this.uniprot.accMap.set(primaryId, accList);
      }
    } else {
      this.uniprot.accMap.set(primaryId, [accessionId]);
    }

    // Update accessionId -> primaryId mapping
    if (this.uniprot.accMap.has(accessionId)) {
      const accList = this.uniprot.accMap.get(accessionId);
      if (accList && !accList.includes(primaryId)) {
        accList.push(primaryId);
        this.uniprot.accMap.set(accessionId, accList);
      }
    } else {
      this.uniprot.accMap.set(accessionId, [primaryId]);
    }
  }

  /**
   * Process gene names without UniProt
   */
  private processGeneNamesWithoutUniProt(): void {
    this.uniprot.geneNameToAcc = {};

    if (this.data.differentialForm.geneNames !== "") {
      for (const row of this.data.currentDF) {
        const geneName = row[this.data.differentialForm.geneNames];

        if (geneName) {
          this.updateGeneNameMapping(geneName, row[this.data.differentialForm.primaryIDs]);
        }
      }

      // Get unique gene names
      this.data.allGenes = this.data.currentDF
        .getSeries(this.data.differentialForm.geneNames)
        .distinct()
        .toArray()
        .filter(v => v !== "");
    }
  }

  /**
   * Update gene name mapping
   */
  private updateGeneNameMapping(geneName: string, primaryId: string): void {
    // Add to genes map
    if (!this.data.genesMap[geneName]) {
      this.data.genesMap[geneName] = {};
      this.data.genesMap[geneName][geneName] = true;
    }

    // Process split gene names
    for (const namePart of geneName.split(";")) {
      if (!this.data.genesMap[namePart]) {
        this.data.genesMap[namePart] = {};
      }
      this.data.genesMap[namePart][geneName] = true;
    }

    // Add to allGenes if needed
    if (!this.data.allGenes.includes(geneName)) {
      this.data.allGenes.push(geneName);
    }

    // Update accession mapping
    if (!this.uniprot.geneNameToAcc[geneName]) {
      this.uniprot.geneNameToAcc[geneName] = {};
    }
    this.uniprot.geneNameToAcc[geneName][primaryId] = true;
  }

  /**
   * Create UniProt database from accession list
   */
  private async createUniprotDatabase(accList: string[]): Promise<string[]> {
    await this.uniprot.UniprotParserJS(accList);
    const allGenes: string[] = [];

    for (const primaryId of this.data.primaryIDsList) {
      try {
        const uniprotEntry = this.uniprot.getUniprotFromPrimary(primaryId);

        if (uniprotEntry && uniprotEntry["Gene Names"] && uniprotEntry["Gene Names"] !== "") {
          const geneName = uniprotEntry["Gene Names"];

          if (!allGenes.includes(geneName)) {
            allGenes.push(geneName);
            this.updateGeneNameMapping(geneName, primaryId);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }

    return allGenes;
  }

  /**
   * Complete the processing workflow
   */
  private completeProcessing(): void {
    this.finished.emit(true);
    this.clicked = false;
    this.uniprot.uniprotParseStatus.next(false);
    this.updateProgressBar(100, "Finished");
  }

  /**
   * Handle file loading progress updates
   */
  handleFileLoadingProgress(progress: number, fileType: string): void {
    if (progress === 100) {
      this.updateProgressBar(progress, `Finished loading ${fileType}`);
    } else {
      this.updateProgressBar(progress, `Loading ${fileType}`);
    }
  }

  clearComparisonSelection(): void {
    this.data.differentialForm.comparisonSelect = [];
    this.toast.show("Cleared", "Comparison selection has been cleared.");
  }

  clearComparisonGroup(): void {
    this.data.differentialForm.comparison = '';
    this.data.differentialForm.comparisonSelect = [];
    this.toast.show("Cleared", "Comparison group and selection have been cleared.");
  }
}
