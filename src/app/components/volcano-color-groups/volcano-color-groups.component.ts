import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataService} from "../../service/data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";


@Component({
  selector: 'app-volcano-color-groups',
  templateUrl: './volcano-color-groups.component.html',
  styleUrls: ['./volcano-color-groups.component.css']
})
export class VolcanoColorGroupsComponent implements OnInit {
  _colorGroups: string[] = []
  data: any = {}
  @Output() colorChange: EventEmitter<any> = new EventEmitter<any>()
  @Input() set colorGroups(value: string[]) {
    if (value.length > 0) {
      const a: any = {}
      for (const c of value) {
        if (!(c in this.dataService.colorMap)) {
          a[c] = ""
        } else {
          a[c] = this.dataService.colorMap[c]
        }
      }
      this.data = a
      this._colorGroups = value
    }
  }

  get colorGroups(): string[] {
    return  this._colorGroups
  }
  constructor(private dataService: DataService, public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }
  updateColor(group: string, event: string) {
    this.colorChange.emit({group: group, color: event})
  }


}
