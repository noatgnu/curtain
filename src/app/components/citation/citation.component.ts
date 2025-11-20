import {Component, input, OnInit, signal} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-citation',
    templateUrl: './citation.component.html',
    styleUrls: ['./citation.component.scss'],
    standalone: false
})
export class CitationComponent implements OnInit {
  resourceName = input("UniProt")
  pdbeCollapsed = signal(true)
  molstartCollapsed = signal(true)
  uniprotCollapsed = signal(true)
  alphaFoldCollapsed = signal(true)
  interactomeAtlasCollapsed = signal(true)
  proteomicsDBCollapsed = signal(true)
  stringDBCollapsed = signal(true)

  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
