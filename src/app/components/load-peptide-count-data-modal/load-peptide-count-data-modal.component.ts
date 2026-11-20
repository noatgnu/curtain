import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {FormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";

@Component({
    selector: 'app-load-peptide-count-data-modal',
    imports: [
        FormsModule
    ],
    templateUrl: './load-peptide-count-data-modal.component.html',
    styleUrl: './load-peptide-count-data-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadPeptideCountDataModalComponent {
  fileContent: string = '';
  primaryIdColumn: string = '';
  sampleColumns: string[] = [];
  columns: string[] = [];
  peptideCountData: any = {};
  data: IDataFrame<number, any> = new DataFrame()
  constructor(private settingsService: SettingsService, private activeModal: NgbActiveModal, private cdr: ChangeDetectorRef) {}

  onFileChange(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.data = fromCSV(<string>e.target.result);
      this.columns = this.data.getColumnNames();
      this.cdr.detectChanges();
    };
    reader.readAsText(file);
  }

  onSubmit() {
    this.data.forEach((row) => {
      const primaryId = row[this.primaryIdColumn];
      this.peptideCountData[primaryId] = {};
      this.sampleColumns.forEach((sampleColumn) => {
        this.peptideCountData[primaryId][sampleColumn] = row[sampleColumn];
      });
    })

    this.settingsService.settings.peptideCountData = this.peptideCountData;
    this.activeModal.close();
  }

  closeModal() {
    this.activeModal.dismiss()
  }

  checkIfThereIsPeptideCountData() {
    return this.settingsService.settings.peptideCountData && Object.keys(this.settingsService.settings.peptideCountData).length > 0;
  }

  downloadPeptideCount() {
    this.fileContent = '';
    //reconstruct peptide data file from settingsService.settings.peptideCountData
    this.peptideCountData = this.settingsService.settings.peptideCountData;
    this.sampleColumns = Object.keys(this.peptideCountData[Object.keys(this.peptideCountData)[0]]);
    const header = ['PrimaryID', ...this.sampleColumns];
    this.fileContent += header.join(',') + '\n';
    for (const primaryId in this.peptideCountData) {
      const row = [primaryId, ...this.sampleColumns.map(sampleColumn => this.peptideCountData[primaryId][sampleColumn])];
      this.fileContent += row.join(',') + '\n';
    }
    const blob = new Blob([this.fileContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'peptide_count_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

}
