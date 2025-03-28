import { Component, OnInit } from '@angular/core';
import {Enrichr} from "enrichrjs";
import {DataService} from "../../data.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {UniprotService} from "../../uniprot.service";

@Component({
    selector: 'app-enrichr-modal',
    templateUrl: './enrichr-modal.component.html',
    styleUrls: ['./enrichr-modal.component.scss'],
    standalone: false
})
export class EnrichrModalComponent implements OnInit {
  enrichr: Enrichr = new Enrichr()
  libraries: string[] = []
  form: FormGroup = this.fb.group({
    selectedSet:[""],
    backgroundSet:['All Genes'],
    userBackgroundSet: [false],
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
    for (const key in this.data.selectedMap) {
      for (const v in this.data.selectedMap[key]) {
        if (v === this.form.value['selectedSet']) {
          const uni = this.uniprot.getUniprotFromPrimary(key)
          if (uni) {
            selectedList.push(uni["Gene Names"].split(";")[0])
          }
        }
      }
    }
    let backgroundList: string[] = []
    if (this.form.value['backgroundSet'] === 'All Genes') {
      backgroundList = this.data.allGenes.slice().map((value: any) => {
        return value.split(";")[0]
      })
    } else {
      for (const key in this.data.selectedMap) {
        for (const v in this.data.selectedMap[key]) {
          if (v === this.form.value['backgroundSet']) {
            const uni = this.uniprot.getUniprotFromPrimary(key)
            if (uni) {
              backgroundList.push(uni["Gene Names"].split(";")[0])
            }
          }
        }
      }
    }

    this.enrichr.addList(selectedList, this.form.value["selectedSet"]).then((geneList) => {
      if (this.form.value['userBackgroundSet']) {
        this.enrichr.addBackgroundList(backgroundList).then((background) => {
          this.enrichr.getEnrichmentResults(geneList.userListId, background.backgroundid, "").then((data: any) => {
            console.log(data)
          })
        })
      } else {
        this.enrichr.getEnrichmentResults(geneList.userListId, "", this.form.value.library.replace(/ /g, "_")).then((data: any) => {
          const geneRankMap: any = {}
          const top10Map: any = {}
          for (const i in data) {
            for (const res of data[i]) {
              for (const gene of res[5]) {
                if (!geneRankMap[gene]) {
                  geneRankMap[gene] = {}
                }
                if (!geneRankMap[gene][i]) {
                  geneRankMap[gene][i] = {}
                }
                geneRankMap[gene][i][res[1]] = {
                  rank: res[0],
                  termName: res[1],
                  pValue: res[2],
                  adjustedpValue: res[6],
                }
              }
            }
            top10Map[i] = data[i].slice(0, 10).map((a: any) => {
              return {
                rank: a[0],
                termName: a[1],
                pValue: a[2],
                adjustedpValue: a[6],
              }
            })
          }
          this.modal.close({geneRankMap, library: this.form.value.library.replace(/ /g, "_"), top10Map})
        })
      }

    })
  }

  close() {
    this.modal.dismiss()
  }
}
