import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-add-raw-data-imputation-map-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './add-raw-data-imputation-map-modal.component.html',
  styleUrl: './add-raw-data-imputation-map-modal.component.scss'
})
export class AddRawDataImputationMapModalComponent {
  form = this.fb.group({
    indexCol: ["", Validators.required],
    sampleCols: [[], Validators.required]
  })

  columns: string[] = []
  data: IDataFrame<number,any> = new DataFrame()

  constructor(private dialogRef: NgbActiveModal, private fb: FormBuilder, private settingsService: SettingsService) {
  }

  close() {
    this.dialogRef.dismiss()
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close({form: this.form.value, data: this.data})
    }
  }

  removeImputationMap() {
    this.settingsService.settings.imputationMap = {}
  }

  onFileChange(event: any) {
    if (event.target) {
      if (event.target.files) {
        const file: File = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const data = e.target.result as string;
          console.log(file.name)
          if (file.name.endsWith(".csv")) {
            // @ts-ignore
            this.data = fromCSV(data);
          } else {
            // @ts-ignore
            this.data = fromCSV(data, {delimiter: "\t"});
          }

          this.columns = this.data.getColumnNames();
          // this.data = fromCSV(<string>e.target.result);
          // this.columns = this.data.getColumnNames();
        };
        reader.readAsText(file);
      }
    }
  }

}
