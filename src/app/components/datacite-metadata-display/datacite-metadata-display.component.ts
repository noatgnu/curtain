import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DataCiteMetadata} from "../../data-cite-metadata";
import {DataciteCitationComponent} from "./datacite-citation/datacite-citation.component";
import {NgbModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-datacite-metadata-display',
  standalone: true,
  imports: [
    DataciteCitationComponent,
    NgbTooltip
  ],
  templateUrl: './datacite-metadata-display.component.html',
  styleUrl: './datacite-metadata-display.component.scss'
})
export class DataciteMetadataDisplayComponent {
  private _metadata: DataCiteMetadata|undefined
  @Input() set metadata(value: DataCiteMetadata|undefined) {
    this._metadata = value
    let authors: string[] = []
    if (this._metadata) {
      if (this._metadata.data.attributes.contributors.length > 0) {
        authors = this._metadata.data.attributes.contributors.map((a) => {
          return a.name
        })
      } else {
        authors = this._metadata.data.attributes.creators.map((a) => {
          return a.name
        })
      }

      this.authorsString = authors.join("; ")
      if (this._metadata.data.relationships.media.data) {
        this.mediaID = encodeURIComponent(this._metadata.data.relationships.media.data.id)

      }
    }


  }

  @Output() clickDownload: EventEmitter<string> = new EventEmitter<string>()
  authorsString: string = ""
  get metadata(): DataCiteMetadata|undefined {
    return this._metadata
  }

  mediaID: string = ""

  constructor(private modal: NgbModal) { }

  openCitation() {
    const ref = this.modal.open(DataciteCitationComponent, {size: "lg"})
    ref.componentInstance.doi = this._metadata?.data.relationships.media.data.id
  }

}