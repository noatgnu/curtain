import { Component } from '@angular/core';
import {Settings} from "../../classes/settings";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DataFrame, fromCSV} from "data-forge";
import {InputFile} from "../../classes/input-file";
import {Differential} from "../../classes/differential";
import {Raw} from "../../classes/raw";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {
  NgbActiveModal,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton, NgbNavOutlet,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {IndividualSessionComponent} from "./individual-session/individual-session.component";
import {BatchUploadServiceService} from "./batch-upload-service.service";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-batch-upload-modal',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    IndividualSessionComponent,
    NgbTooltip,
    NgClass,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNav,
    NgbNavOutlet
  ],
  templateUrl: './batch-upload-modal.component.html',
  styleUrl: './batch-upload-modal.component.scss'
})
export class BatchUploadModalComponent {
  differentialFiles: File[] = [];
  rawFiles: File[] = [];
  extraFiles: File[] = [];
  peptideFiles: File[] = [];

  sessions: {data: {
      raw: InputFile,
      rawForm: Raw,
      differentialForm: Differential,
      processed: InputFile,
      password: string,
      selections: [],
      selectionsMap: any,
      selectionsName: [],
      settings: Settings,
      fetchUniprot: boolean,
      annotatedData: any,
      extraData: any,
      permanent: boolean,
      uniqueComparisons: string[]
    },
    form: FormGroup,
    peptideFileForm: FormGroup,
    rawColumns: string[],
    differentialColumns: string[],
    peptideFileColumns: string[],
    rawFile: null|File,
    differentialFile: null|File,
    peptideFile: null|File,
    uniqueComparisons: string[],
    linkId: string|undefined|null,
    extraFiles: {file: File, type: string}[],
    colorCategoryForms: FormGroup[],
    colorCategoryColumn: string,
    colorCategoryPrimaryIdColumn: string,
    private: boolean,
    volcanoColors: any,
    colorPalette: string
  }[] = [];
  allTasksFinished = false
  constructor(private toasts: ToastService, private fb: FormBuilder, private dialogRef: NgbActiveModal, private batchService: BatchUploadServiceService) {
    this.batchService.taskStartAnnouncer.subscribe((index) => {
      this.toasts.show("Task started", `Start processing task ${index}`).then()
    })
  }

  handleDifferentialAnalysisFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      for (const f of files) {
        this.differentialFiles.push(f);
      }
    }
  }

  handleRawFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      for (const f of files) {
        this.rawFiles.push(f);
      }
    }
  }

  handleExtraFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      for (const f of files) {
        this.extraFiles.push(f);
      }
    }
  }

  handlePeptideCountFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      for (const f of files) {
        this.peptideFiles.push(f);
      }
    }
  }

  addSession() {
    const form = this.fb.group({
      raw: [null as File | null],
      differential: [null as File | null],
    })

    const peptideFileForm = this.fb.group({
      peptideFile: [null as File | null],
      primaryIdColumn: [""],
      sampleColumns: [[]]
    })

    const data: {
      data: any,
      form: FormGroup,
      peptideFileForm: FormGroup,
      rawColumns: string[],
      differentialColumns: string[],
      peptideFileColumns: string[],
      rawFile: File | null,
      differentialFile: File | null,
      peptideFile: File | null,
      uniqueComparisons: string[],
      linkId: string | null,
      extraFiles: {file: File, type: string}[],
      colorCategoryForms: FormGroup[],
      colorCategoryColumn: string,
      colorCategoryPrimaryIdColumn: string,
      private: boolean,
      volcanoColors: any,
      colorPalette: string
    } = {data: {
      raw: new InputFile(),
      rawForm: new Raw(),
      differentialForm: new Differential(),
      processed: new InputFile(),
      password: "",
      selections: [],
      selectionsMap: {},
      selectionsName: [],
      settings: new Settings(),
      fetchUniprot: true,
      annotatedData: null,
      extraData: null,
      permanent: false,
    },
      form,
      peptideFileForm,
      rawColumns: [],
      differentialColumns: [],
      peptideFileColumns: [],
      rawFile: null,
      differentialFile: null,
      peptideFile: null,
      uniqueComparisons: [],
      linkId: null,
      extraFiles: [],
      colorCategoryForms: [],
      colorCategoryColumn: "",
      colorCategoryPrimaryIdColumn: "",
      private: true,
      volcanoColors: {},
      colorPalette: "pastel"
    }
    peptideFileForm.controls.peptideFile.valueChanges.subscribe((value: File | null) => {
      if (value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            // @ts-ignore
            data.peptideFileColumns = df.getColumnNames()
            data.peptideFile = value
            // @ts-ignore
            data.data.raw.filename = value.name
          }
        }
        reader.readAsText(value)
      }
    })
    form.controls.raw.valueChanges.subscribe((value: File | null) => {
      if (value) {

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            // @ts-ignore
            data.rawColumns = df.getColumnNames()
            data.rawFile = value
            // @ts-ignore
            data.data.raw.filename = value.name
          }
        }
        console.log(value)
        reader.readAsText(value)
      }
    })
    form.controls.differential.valueChanges.subscribe((value: File | null) => {
      if (value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            // @ts-ignore
            data.differentialColumns = df.getColumnNames()
            data.differentialFile = value
            // @ts-ignore
            data.data.processed.filename = value.name
          }
        }
        console.log(value)
        reader.readAsText(value)

        // Auto-populate description with filename if description is empty
        if (!data.data.settings.description || data.data.settings.description.trim() === '') {
          data.data.settings.description = value.name;
        }
      }
    })
    // @ts-ignore
    this.sessions.push(data)
  }

  close() {
    this.dialogRef.close()
  }

  submit() {
    this.allTasksFinished = false
    this.batchService.taskStartAnnouncer.next(0)
  }

  cloneSession(index: number) {
    const selectedSession = this.sessions[index]
    const data: {
      data: any,
      form: FormGroup,
      peptideFileForm: FormGroup,
      rawColumns: string[],
      differentialColumns: string[],
      peptideFileColumns: string[],
      rawFile: File | null,
      differentialFile: File | null,
      peptideFile: File | null,
      uniqueComparisons: string[],
      linkId: string | null,
      extraFiles: {file: File, type: string}[],
      colorCategoryForms: FormGroup[],
      colorCategoryColumn: string,
      colorCategoryPrimaryIdColumn: string,
      private: boolean,
      volcanoColors: any,
      colorPalette: string
    } = {data: {
      raw: new InputFile(),
      rawForm: new Raw(),
      differentialForm: new Differential(),
      processed: new InputFile(),
      password: "",
      selections: [],
      selectionsMap: {},
      selectionsName: [],
      settings: new Settings(),
      fetchUniprot: true,
      annotatedData: null,
      extraData: null,
      permanent: false,
    }, form: this.fb.group({
      raw: [null as File | null],
      differential: [null as File | null],
    }), peptideFileForm: this.fb.group({
      peptideFile: [null as File | null],
      primaryIdColumn: [""],
      sampleColumns: [[]]
      }),
      rawColumns: [],
      differentialColumns: [],
      peptideFileColumns: [],
      rawFile: null,
      differentialFile: null,
      peptideFile: null,
      uniqueComparisons: [],
      linkId: null,
      extraFiles: [],
      colorCategoryForms: [],
      colorCategoryColumn: "",
      colorCategoryPrimaryIdColumn: "",
      private: true,
      volcanoColors: {},
      colorPalette: "pastel"
    }
    data.colorPalette = selectedSession.colorPalette.slice()
    data.volcanoColors = JSON.parse(JSON.stringify(selectedSession.volcanoColors))
    // copy the data
    data.colorCategoryColumn = selectedSession.colorCategoryColumn.slice()
    data.colorCategoryPrimaryIdColumn = selectedSession.colorCategoryPrimaryIdColumn.slice()
    data.private = selectedSession.private
    for (const c of selectedSession.colorCategoryForms) {
      const colorForm = this.fb.group({
        color: [c.value.color],
        category: [c.value.category],
        value: [c.value.value],
        comparison: [c.value.comparison],
        label: [c.value.label]
      })
      // @ts-ignore
      data.colorCategoryForms.push(colorForm)
    }
    for (const key in selectedSession.data) {
      // @ts-ignore
      console.log(key, selectedSession.data[key])
      if (key === "raw" || key === "processed" || key === "rawForm" || key === "differentialForm") {
        for (const key2 in selectedSession.data[key]) {
          // @ts-ignore
          if (selectedSession.data[key][key2] !== undefined) {
            // @ts-ignore
            data.data[key][key2] = JSON.parse(JSON.stringify(selectedSession.data[key][key2]))
          }

        }
      } else {
        // @ts-ignore
        if (selectedSession.data[key] !== undefined) {
          // @ts-ignore
          data.data[key] = JSON.parse(JSON.stringify(selectedSession.data[key]))
        }

      }
      // @ts-ignore
      console.log(key, data.data[key])
    }
    // copy the form
    data.form.patchValue({
      raw: selectedSession.form.value.raw,
      differential: selectedSession.form.value.differential,
    })
    // copy the columns
    // @ts-ignore
    data.rawColumns = [...selectedSession.rawColumns]
    // @ts-ignore
    data.differentialColumns = [...selectedSession.differentialColumns]
    // copy the files
    // @ts-ignore
    data.rawFile = selectedSession.rawFile
    // @ts-ignore
    data.differentialFile = selectedSession.differentialFile
    // @ts-ignore
    data.uniqueComparisons = [...selectedSession.uniqueComparisons]
    // @ts-ignore
    data.peptideFile = selectedSession.peptideFile
    // @ts-ignore
    data.peptideFileForm.patchValue({peptideFile: selectedSession.peptideFileForm.value.peptideFile, primaryIdColumn: selectedSession.peptideFileForm.value.primaryIdColumn, sampleColumns: [...selectedSession.peptideFileForm.value.sampleColumns]
    })
    // @ts-ignore
    data.peptideFileColumns = [...selectedSession.peptideFileColumns]

    data.peptideFileForm.controls["peptideFile"].valueChanges.subscribe((value: File | null) => {
      if (value) {

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            // @ts-ignore
            data.peptideFileColumns = df.getColumnNames()
            data.peptideFile = value
            // @ts-ignore
            data.data.raw.filename = value.name
          }
        }
        reader.readAsText(value)
      }
    })

    data.form.controls['raw'].valueChanges.subscribe((value: File | null) => {
      if (value) {

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            // @ts-ignore
            data.rawColumns = df.getColumnNames()
            data.rawFile = value
            // @ts-ignore
            data.data.raw.filename = value.name
          }
        }
        console.log(value)
        reader.readAsText(value)
      }
    })
    data.form.controls['differential'].valueChanges.subscribe((value: File | null) => {
      if (value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            // @ts-ignore
            data.differentialColumns = df.getColumnNames()
            data.differentialFile = value
            // @ts-ignore
            data.data.processed.filename = value.name
          }
        }
        console.log(value)
        reader.readAsText(value)

        // Auto-populate description with filename if description is empty
        if (!data.data.settings.description || data.data.settings.description.trim() === '') {
          data.data.settings.description = value.name;
        }
      }
    })
    for (const extraFile of selectedSession.extraFiles) {
      // @ts-ignore
      data.extraFiles.push({file: extraFile.file, type: extraFile.type})
    }
    // @ts-ignore
    this.sessions.push(data)
    console.log(data)
  }

  deleteSession(index: number) {
    this.sessions.splice(index, 1)
    this.sessions = [...this.sessions]
  }

  handleFinished(event: string, index: number) {
    if (!event || event === "") {
      this.sessions[index].linkId = null
      return
    }

    if (event) {
      this.sessions[index].linkId = location.origin + "/#/" + event
    }
    if (this.sessions[index+1]) {
      this.batchService.taskStartAnnouncer.next(index+1)
    } else {
      this.toasts.show("Task finished", "All tasks have been processed").then()
      this.allTasksFinished = true
    }
  }

  downloadLinkDocument() {
    // download a csv document generated with all the links from each session with 3 columns: session number, link, description
    const data = []
    for (let i = 0; i < this.sessions.length; i++) {
      data.push([i+1, this.sessions[i].linkId, this.sessions[i].data.settings.description])
    }
    const csv = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url= window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'links.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  openAllLinks() {
    for (const session of this.sessions) {
      if (session.linkId) {
        window.open(session.linkId, "_blank")
      }
    }
  }

  exportSettingsButFiles(index: number) {
    const currentSession = this.sessions[index]
    if (currentSession) {
      const session = {
        data: {
          raw: null,
          rawForm: JSON.parse(JSON.stringify(currentSession.data.rawForm)),
          differentialForm: JSON.parse(JSON.stringify(currentSession.data.differentialForm)),
          processed: null,
          password: "",
          selections: [],
          selectionsMap: {},
          selectionsName: [],
          settings: JSON.parse(JSON.stringify(currentSession.data.settings)),
          fetchUniprot: currentSession.data.fetchUniprot,
          annotatedData: {},
          extraData: JSON.parse(JSON.stringify(currentSession.data.extraData)),
          permanent: currentSession.data.permanent,

        },
        extraFiles: [],
        colorCategoryForms: [],
        colorCategoryColumn: currentSession.colorCategoryColumn,
        colorCategoryPrimaryIdColumn: currentSession.colorCategoryPrimaryIdColumn,
        private: currentSession.private,
        volcanoColors: JSON.parse(JSON.stringify(currentSession.volcanoColors)),
        colorPalette: currentSession.colorPalette,
      }
      for (const ef of currentSession.extraFiles) {
        // @ts-ignore
        session.extraFiles.push({name: ef.file.name, type: ef.type})
      }
      const a = document.createElement("a");
      const file = new Blob([JSON.stringify(session, null, 2)], {type: 'application/json'});
      a.href = URL.createObjectURL(file);
      a.download = 'curtain_batch_settings.json';
      a.click();
    }
  }

  importSettingsButFiles(event: any, index: number) {

    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        const contents = e.target.result;
        if (contents) {
          const currentSession = this.sessions[index]
          if (currentSession) {
            const session = JSON.parse(<string>contents)
            if (currentSession) {
              for (const r in currentSession.data.rawForm) {
                if (session.data.rawForm[r]) {
                  if (currentSession.rawColumns.includes(session.data.rawForm[r])) {
                    // @ts-ignore
                    currentSession.data.rawForm[r] = session.data.rawForm[r]
                  }
                }
              }
              for (const r in currentSession.data.differentialForm) {
                if (session.data.differentialForm[r]) {
                  if (typeof session.data.differentialForm[r] === "string") {
                    // Validate all string fields against current differential columns
                    if (currentSession.differentialColumns.includes(session.data.differentialForm[r])) {
                      // @ts-ignore
                      currentSession.data.differentialForm[r] = session.data.differentialForm[r]
                      // If this is the comparison column, update unique comparisons
                      if (r === "comparison") {
                        this.getComparisonColumnUniqueForImport(currentSession, session.data.differentialForm[r]);
                      }
                    }
                  } else if (r === "comparisonSelect") {
                    // Handle comparison selection - validate against uniqueComparisons after comparison column is set
                    currentSession.data.differentialForm.comparisonSelect = [];
                    for (const c of session.data.differentialForm.comparisonSelect) {
                      if (currentSession.uniqueComparisons.includes(c)) {
                        currentSession.data.differentialForm.comparisonSelect.push(c)
                      }
                    }
                  }
                }
              }

              for (const i in currentSession.data.settings) {
                if (session.data.settings[i]) {
                  // @ts-ignore
                  currentSession.data.settings[i] = session.data.settings[i]
                }
              }
              currentSession.data.fetchUniprot = session.data.fetchUniprot
              currentSession.data.extraData = session.data.extraData
              currentSession.data.permanent = session.data.permanent
              currentSession.volcanoColors = session.volcanoColors
              currentSession.colorPalette = session.colorPalette
              currentSession.colorCategoryColumn = session.colorCategoryColumn
              currentSession.colorCategoryPrimaryIdColumn = session.colorCategoryPrimaryIdColumn
              currentSession.colorCategoryForms = session.colorCategoryForms
              currentSession.private = session.private
              if (session.extraFiles.length > 0) {
                for (const f of session.extraFiles) {
                  for (const ef of this.extraFiles) {
                    if (ef.name === f.name) {
                      currentSession.extraFiles.push({
                        file: ef,
                        type: f.type
                      })
                    }
                  }
                }
              }
            }
          }

        }
      }
    }
    reader.readAsText(file)
  }

  private getComparisonColumnUniqueForImport(session: any, columnComp: string) {
    if (session.differentialFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const loadedFile = e.target.result;
          const df = fromCSV(<string>loadedFile)
          // @ts-ignore
          const column = df.getSeries(columnComp)
          // @ts-ignore
          session.uniqueComparisons = column.distinct().toArray()
        } else {
          session.uniqueComparisons = []
        }
      }
      reader.readAsText(session.differentialFile)
    }
  }
}
