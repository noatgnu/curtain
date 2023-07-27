import { Component, OnInit } from '@angular/core';
import {Enrichr} from "enrichrjs";
import {DataService} from "../../data.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {UniprotService} from "../../uniprot.service";

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

  constructor(public data: DataService, private fb: FormBuilder, private modal: NgbActiveModal, private uniprot: UniprotService) {
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

  submit() {
    const selectedList: string[] = []
    this.data.selectedMap.forEach((value: any, key: string) => {
      for (const v in value) {
        if (v === this.form.value['selectedSet']) {
          const uni = this.uniprot.getUniprotFromPrimary(key)
          if (uni) {
            selectedList.push(uni["Gene Names"].split(";")[0])
          }
        }
      }
    })
    let backgroundList: string[] = []
    if (this.form.value['backgroundSet'] === 'All Genes') {
      backgroundList = this.data.allGenes.slice().map((value: any) => {
        return value.split(";")[0]
      })
    } else {
      this.data.selectedMap.forEach((value: any, key: string) => {
        for (const v in value) {
          if (v === this.form.value['backgroundSet']) {
            const uni = this.uniprot.getUniprotFromPrimary(key)
            if (uni) {
              selectedList.push(uni["Gene Names"].split(";")[0])
            }
          }
        }
      })
    }

    this.enrichr.addList(selectedList, this.form.value["selectedSet"]).then((geneList) => {
      this.enrichr.addBackgroundList(backgroundList).then((background) => {
        this.enrichr.getEnrichmentResults(geneList.userListId, background.backgroundid, this.form.value['library']).then((data: any) => {
          console.log(data)
        })
      })
    })
  }

  close() {
    this.modal.dismiss()
  }
}
