import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";

@Component({
  selector: 'app-datacite',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './datacite.component.html',
  styleUrl: './datacite.component.scss'
})
export class DataciteComponent {
  dataCiteForm = this.fb.group({
    prefix: ['', Validators.required],
    suffix: ['', Validators.required],
    url: ['', Validators.required],
    creators: this.fb.array([
      this.fb.group({
        name: ['', Validators.required],
        affiliation: ['', Validators.required],
        orcid: ['', Validators.required]
      })
    ]),
    title: this.fb.array([
      this.fb.group({
        title: ['', Validators.required],
        language: ['', Validators.required]
      })
    ]),
    publisher: ['', Validators.required],
    publisherIdentifier: ['https://ror.org/03h2bxq36', Validators.required],
    publicationYear: [new Date().getFullYear(), Validators.required],
    resourceType: this.fb.group({
      resourceTypeGeneral: ['Dataset', Validators.required],
      resourceType: ['Interactive visualization of differential analysis datasets', Validators.required]
    }),
    subjects: this.fb.array([
      this.fb.group(
        {subject: ["", Validators.required], subjectScheme: ["", Validators.required], valueURI: ["", Validators.required]}
      ),
      ]),
    contributors: this.fb.array([
      ]),
    description: this.fb.array([
      this.fb.group({
        description: ['', Validators.required],
        descriptionType: ['', Validators.required]
      })
    ]),
    rightsList: this.fb.array([
      this.fb.group({
        rights: ["Creative Commons Attribution Non Commercial 4.0 International", Validators.required],
        rigtsUri: ["https://creativecommons.org/licenses/by-nc/4.0/legalcode", Validators.required],
      })
    ]),
    alternateIdentifiers: this.fb.array([
      this.fb.group({
        alternateIdentifier: ['', Validators.required],
        alternateIdentifierType: ['URL', Validators.required]
      })
    ]),
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
