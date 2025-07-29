import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {ColorPickerDirective} from "ngx-color-picker";
import {Settings} from "../../../classes/settings";
import {SettingsService} from "../../../settings.service";
import {DataService} from "../../../data.service";

@Component({
    selector: 'app-annotation',
    imports: [
        ReactiveFormsModule,
        ColorPickerDirective
    ],
    templateUrl: './annotation.component.html',
    styleUrl: './annotation.component.scss'
})
export class AnnotationComponent {
  colorMap: any = {}

  forms: FormGroup[] = []
  @Output() updateAnnotation: EventEmitter<any> = new EventEmitter<any>()
  constructor(private fb: FormBuilder, private settings: SettingsService, private dataService: DataService) {
    this.forms = []
    this.composeForms()
    this.dataService.annotationVisualUpdated.asObservable().subscribe(
      (value) => {
        this.forms = []
        this.composeForms()
      }
    )
  }

  ngOnInit(): void {

  }

  formAll = this.fb.group({
    fontsize: [15],
    fontcolor: ["#000000"]
  })

  updateColor(event: any, id: string) {
    this.forms.find((f) => f.controls["annotationID"].value === id)?.controls["fontcolor"].setValue(event)
  }

  composeForms() {
    for (const i in this.settings.settings.textAnnotation) {
      //this.annotationText.push(this.settings.settings.textAnnotation[i])
      if (this.forms.find((f) => f.controls["annotationID"].value === i)) {
        continue
      }
      this.forms.push(this.fb.group({
        annotationID: [i],
        text: [this.settings.settings.textAnnotation[i].data.text],
        showarrow: [this.settings.settings.textAnnotation[i].data.showarrow],
        arrowhead: [this.settings.settings.textAnnotation[i].data.arrowhead],
        arrowsize: [this.settings.settings.textAnnotation[i].data.arrowsize],
        arrowwidth: [this.settings.settings.textAnnotation[i].data.arrowwidth],
        ax: [this.settings.settings.textAnnotation[i].data.ax],
        ay: [this.settings.settings.textAnnotation[i].data.ay],
        fontsize: [this.settings.settings.textAnnotation[i].data.font.size],
        fontcolor: [this.settings.settings.textAnnotation[i].data.font.color],
        showannotation: [this.settings.settings.textAnnotation[i].data.showannotation],
      }))
      this.colorMap[i] = this.settings.settings.textAnnotation[i].data.font.color.slice()
    }
  }

  submitFormAll() {
    for (const f of this.forms) {
      //f.controls["fontcolor"].setValue(this.formAll.controls["fontcolor"].value)
      f.controls["fontsize"].setValue(this.formAll.controls["fontsize"].value)
    }
    this.updateAnnotation.emit(this.forms)
  }
}
