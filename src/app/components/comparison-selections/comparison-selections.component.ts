import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DataService} from "../../data.service";

@Component({
    selector: 'app-comparison-selections',
    templateUrl: './comparison-selections.component.html',
    styleUrls: ['./comparison-selections.component.scss'],
    standalone: false
})
export class ComparisonSelectionsComponent implements OnInit {
  selected: string = ""

  @Output() selection: EventEmitter<string> = new EventEmitter<string>()

  constructor(public data: DataService) {
    this.selected = this.data.differentialForm.comparisonSelect[0].slice()
  }

  ngOnInit(): void {
  }

  updateValue() {
    this.selection.emit(this.selected)
  }

}
