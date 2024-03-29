import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-are-you-sure-clear-modal',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './are-you-sure-clear-modal.component.html',
  styleUrl: './are-you-sure-clear-modal.component.scss'
})
export class AreYouSureClearModalComponent {
  remember = false

  constructor(private activeModal: NgbActiveModal) {

  }

  close() {
    if (this.remember) {
      localStorage.setItem('curtainRememberClearSettings', 'true')
    }
    this.activeModal.dismiss()
  }

  ok() {
    if (this.remember) {
      localStorage.setItem('curtainRememberClearSettings', 'true')
    }
    this.activeModal.close(true)
  }

}
