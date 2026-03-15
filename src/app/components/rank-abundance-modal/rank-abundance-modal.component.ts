import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-rank-abundance-modal',
    templateUrl: './rank-abundance-modal.component.html',
    styleUrls: ['./rank-abundance-modal.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankAbundanceModalComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
