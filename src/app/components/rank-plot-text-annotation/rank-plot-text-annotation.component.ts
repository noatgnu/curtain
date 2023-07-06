import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-rank-plot-text-annotation',
  templateUrl: './rank-plot-text-annotation.component.html',
  styleUrls: ['./rank-plot-text-annotation.component.scss']
})
export class RankPlotTextAnnotationComponent implements OnInit {

  private _data:any = {}
  @Input() set data(value: any) {
    this._data = value
    for (const i in value.annotation) {
      //this.annotationText.push(this.settings.settings.textAnnotation[i])
      console.log(value.annotation[i])
      for (const c in value.annotation[i]) {
        this.forms.push(this.fb.group({
          annotationID: [i+" " +c],
          id: [i],
          condition: [c],
          text: [value.annotation[i][c].data.text],
          showarrow: [value.annotation[i][c].data.showarrow],
          arrowhead: [value.annotation[i][c].data.arrowhead],
          arrowsize: [value.annotation[i][c].data.arrowsize],
          arrowwidth: [value.annotation[i][c].data.arrowwidth],
          ax: [value.annotation[i][c].data.ax],
          ay: [value.annotation[i][c].data.ay],
          fontsize: [value.annotation[i][c].data.font.size],
          fontcolor: [value.annotation[i][c].data.font.color],
          showannotation: [value.annotation[i][c].data.showannotation],
        }))
        this.colorMap[i+" " +c] = value.annotation[i][c].data.font.color.slice()
      }


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
