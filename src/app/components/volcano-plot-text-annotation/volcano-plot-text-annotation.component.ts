import {Component, Input, OnInit} from '@angular/core';
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-volcano-plot-text-annotation',
  templateUrl: './volcano-plot-text-annotation.component.html',
  styleUrls: ['./volcano-plot-text-annotation.component.scss']
})
export class VolcanoPlotTextAnnotationComponent implements OnInit {
  private _data:any = {}
  @Input() set data(value: any) {
    this._data = value
    for (const i in value.annotation) {
      //this.annotationText.push(this.settings.settings.textAnnotation[i])
      this.forms.push(this.fb.group({
        annotationID: [i],
        text: [value.annotation[i].data.text],
        showarrow: [value.annotation[i].data.showarrow],
        arrowhead: [value.annotation[i].data.arrowhead],
        arrowsize: [value.annotation[i].data.arrowsize],
        arrowwidth: [value.annotation[i].data.arrowwidth],
        ax: [value.annotation[i].data.ax],
        ay: [value.annotation[i].data.ay],
        fontsize: [value.annotation[i].data.font.size],
        fontcolor: [value.annotation[i].data.font.color],
        showannotation: [value.annotation[i].data.showannotation],
      }))
      this.colorMap[i] = value.annotation[i].data.font.color.slice()
    }
  }

  colorMap: any = {}

  forms: FormGroup[] = []
  constructor(public modal: NgbActiveModal, private fb: FormBuilder) {

  }

  ngOnInit(): void {
  }

  updateColor(event: any, id: string) {
    this.forms.find((f) => f.controls["annotationID"].value === id)?.controls["fontcolor"].setValue(event)
  }

}
