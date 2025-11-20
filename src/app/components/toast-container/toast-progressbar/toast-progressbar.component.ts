import {Component, effect, EventEmitter, input, Output, signal} from '@angular/core';
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../../data.service";

@Component({
    selector: 'app-toast-progressbar',
    imports: [
        NgbProgressbar
    ],
    templateUrl: './toast-progressbar.component.html',
    styleUrl: './toast-progressbar.component.scss'
})
export class ToastProgressbarComponent {
  action = input("other")
  progress = signal(0)
  total = input(100)
  @Output() finished: EventEmitter<boolean> = new EventEmitter()

  constructor(public data: DataService) {
    effect(() => {
      const actionValue = this.action()
      if (actionValue === "download") {
        this.data.downloadProgress.subscribe((data) => {
          this.progress.set(data)
          if (data === 100) {
            this.finished.emit(true)
          }
        })
      } else if (actionValue === "upload") {
        this.data.uploadProgress.subscribe((data) => {
          this.progress.set(data)
          if (data === 100) {
            this.finished.emit(true)
          }
        })
      }
    })
  }

}
