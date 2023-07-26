import { Component, OnInit } from '@angular/core';
import {Enrichr} from "enrichrjs";
import {DataService} from "../../data.service";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-enrichr-modal',
  templateUrl: './enrichr-modal.component.html',
  styleUrls: ['./enrichr-modal.component.scss']
})
export class EnrichrModalComponent implements OnInit {
  enrichr: Enrichr = new Enrichr()
  libraries: string[] = []
  form: FormGroup = this.fb.group({
    selectedSet:[""],
    backgroundSet:['All Genes'],
    library:[''],
  })

  constructor(public data: DataService, private fb: FormBuilder) {
    this.enrichr.getLibraries().then((data: any) => {
      for (const i in data) {
        this.libraries.push(i)
      }
    })
    this.form.controls['library'].setValue(this.libraries[0])
    this.form.controls['selectedSet'].setValue(this.data.selectOperationNames[0])
  }

  ngOnInit(): void {
  }

}
