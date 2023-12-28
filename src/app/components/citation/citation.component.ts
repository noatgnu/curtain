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
  pdbeCollapsed: boolean = true
  molstartCollapsed: boolean = true
  uniprotCollapsed: boolean = true
  alphaFoldCollapsed: boolean = true
  interactomeAtlasCollapsed: boolean = true
  proteomicsDBCollapsed: boolean = true
  stringDBCollapsed: boolean = true

  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
