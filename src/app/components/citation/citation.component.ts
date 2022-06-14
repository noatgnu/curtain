import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-citation',
  templateUrl: './citation.component.html',
  styleUrls: ['./citation.component.scss']
})
export class CitationComponent implements OnInit {
  _resourceName = "UniProt"
  @Input() set resourceName(value: string) {
    this._resourceName = value
  }
  get resourceName(): string {
    return this._resourceName
  }
  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
