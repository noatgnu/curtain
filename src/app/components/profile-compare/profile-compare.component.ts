import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-profile-compare',
  templateUrl: './profile-compare.component.html',
  styleUrls: ['./profile-compare.component.scss']
})
export class ProfileCompareComponent implements OnInit {
  @Input() data: IDataFrame = new DataFrame()
  @Input() selected: string[] = []
  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
