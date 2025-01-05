import { Component, OnInit } from '@angular/core';
import {ToastService} from "../../toast.service";
import {DataService} from "../../data.service";

@Component({
    selector: 'app-toast-container',
    templateUrl: './toast-container.component.html',
    styleUrls: ['./toast-container.component.scss'],
    standalone: false
})
export class ToastContainerComponent implements OnInit {

  constructor(public toastService: ToastService, public data: DataService) { }

  ngOnInit(): void {
  }


}
