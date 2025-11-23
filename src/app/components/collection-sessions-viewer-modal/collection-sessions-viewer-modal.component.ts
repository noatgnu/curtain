import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountsService } from '../../accounts/accounts.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collection-sessions-viewer-modal',
  imports: [CommonModule],
  templateUrl: './collection-sessions-viewer-modal.component.html',
  styleUrl: './collection-sessions-viewer-modal.component.scss',
})
export class CollectionSessionsViewerModalComponent implements OnInit {
  @Input() collectionId!: number;

  collection: any = null;
  sessions: any[] = [];
  isLoading: boolean = false;
  base: string = window.location.origin;

  constructor(
    public activeModal: NgbActiveModal,
    private accounts: AccountsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCollectionDetails();
  }

  async loadCollectionDetails(): Promise<void> {
    if (!this.collectionId) return;

    try {
      this.isLoading = true;
      const [collectionResponse, sessionsResponse] = await Promise.all([
        this.accounts.curtainAPI.getCurtainCollection(this.collectionId),
        this.accounts.curtainAPI.getCurtainCollectionSessions(this.collectionId)
      ]);

      this.collection = collectionResponse.data;
      this.sessions = sessionsResponse.data.curtains || [];
    } catch (error) {
      console.error('Failed to load collection details:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
