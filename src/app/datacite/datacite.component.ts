import { Component } from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";

@Component({
  selector: 'app-datacite',
  standalone: true,
  imports: [],
  templateUrl: './datacite.component.html',
  styleUrl: './datacite.component.scss'
})
export class DataciteComponent {
  dataCiteForm = this.fb.group({
    id: ['', Validators.required],
    type: ['', Validators.required],
    attributes: this.fb.group({
      doi: ['', Validators.required],
      prefix: ['', Validators.required],
      suffix: ['', Validators.required],
      identifiers: this.fb.array([]),
      alternateIdentifiers: this.fb.array([]),
      creators: this.fb.array([]),
      titles: this.fb.array([]),
      publisher: ['', Validators.required],
      container: [''],
      publicationYear: [null, Validators.required],
      subjects: this.fb.array([]),
      contributors: this.fb.array([]),
      dates: this.fb.array([]),
      language: ['', Validators.required],
      types: this.fb.group({
        ris: ['', Validators.required],
        bibtex: ['', Validators.required],
        citeproc: ['', Validators.required],
        schemaOrg: ['', Validators.required],
        resourceType: ['', Validators.required],
        resourceTypeGeneral: ['', Validators.required]
      }),
      relatedIdentifiers: this.fb.array([]),
      relatedItems: this.fb.array([]),
      sizes: this.fb.array([]),
      formats: this.fb.array([]),
      version: [null],
      rightsList: this.fb.array([]),
      descriptions: this.fb.array([]),
      geoLocations: this.fb.array([]),
      fundingReferences: this.fb.array([]),
      xml: [''],
      url: [''],
      contentUrl: [null],
      metadataVersion: [null],
      schemaVersion: [null],
      source: [null],
      isActive: [false],
      state: [''],
      reason: [null],
      viewCount: [0],
      viewsOverTime: this.fb.array([]),
      downloadCount: [0],
      downloadsOverTime: this.fb.array([]),
      referenceCount: [0],
      citationCount: [0],
      citationsOverTime: this.fb.array([]),
      partCount: [0],
      partOfCount: [0],
      versionCount: [0],
      versionOfCount: [0],
      created: [null],
      registered: [null],
      published: [''],
      updated: [null]
    }),
    relationships: this.fb.group({
      client: this.fb.group({
        data: this.fb.group({
          id: ['', Validators.required],
          type: ['', Validators.required]
        })
      }),
      provider: this.fb.group({
        data: this.fb.group({
          id: ['', Validators.required],
          type: ['', Validators.required]
        })
      }),
      media: this.fb.group({
        data: this.fb.group({
          id: ['', Validators.required],
          type: ['', Validators.required]
        })
      }),
      references: this.fb.array([]),
      citations: this.fb.array([]),
      parts: this.fb.array([]),
      partOf: this.fb.array([]),
      versions: this.fb.array([]),
      versionOf: this.fb.array([])
    })
  });
  constructor(private fb: FormBuilder) {
  }

  onSubmit() {
    if (this.dataCiteForm.valid) {
      const dataCiteMetadata: any = this.dataCiteForm.value;
      console.log(dataCiteMetadata);
    }
  }



}
