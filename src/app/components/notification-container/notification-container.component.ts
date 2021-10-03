import {Component, OnInit, TemplateRef} from '@angular/core';
import {NotificationService} from "../../service/notification.service";

@Component({
  selector: 'app-notification-container',
  host: {'[class.ngb-toasts]': 'true'},
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.css']
})
export class NotificationContainerComponent implements OnInit {
  constructor(public notification: NotificationService) {}
  show: boolean = true
  isTemplate(note: any) { return note.textOrTpl instanceof TemplateRef; }

  ngOnInit(): void {
  }

  close() {
    this.show = false
  }
}
