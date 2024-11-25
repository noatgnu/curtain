import { Component } from '@angular/core';
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
    styleUrl: './load-peptide-count-data-modal.component.scss'
})
export class LoadPeptideCountDataModalComponent {
  fileContent: string = '';
  primaryIdColumn: string = '';
  sampleColumns: string[] = [];
  columns: string[] = [];
  peptideCountData: any = {};
  data: IDataFrame<number, any> = new DataFrame()
  constructor(private settingsService: SettingsService, private activeModal: NgbActiveModal) {}

  onFileChange(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.data = fromCSV(<string>e.target.result);
      this.columns = this.data.getColumnNames();
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

}
