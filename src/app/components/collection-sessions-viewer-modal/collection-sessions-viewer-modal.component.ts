import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountsService } from '../../accounts/accounts.service';
import { CommonModule } from '@angular/common';
import { CurtainCollection } from 'curtain-web-api';

@Component({
  selector: 'app-collection-sessions-viewer-modal',
  imports: [CommonModule],
  templateUrl: './collection-sessions-viewer-modal.component.html',
  styleUrl: './collection-sessions-viewer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionSessionsViewerModalComponent implements OnInit {
  @Input() collectionId!: number;

  collection: CurtainCollection | null = null;
  sessions: any[] = [];
  isLoading: boolean = false;
  removingLinkId: string | null = null;
  base: string = window.location.origin;

  constructor(
    public activeModal: NgbActiveModal,
    private accounts: AccountsService,
    private cdr: ChangeDetectorRef
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
      this.cdr.detectChanges();
    }
  }

  get isOwner(): boolean {
    return !!this.collection && this.collection.owner_username === this.accounts.curtainAPI.user.username;
  }

  async removeSession(session: any): Promise<void> {
    if (!confirm(`Remove "${session.name || session.link_id}" from this collection?`)) {
      return;
    }

    try {
      this.removingLinkId = session.link_id;
      await this.accounts.removeCurtainFromCollection(this.collectionId, session.link_id);
      this.sessions = this.sessions.filter(s => s.link_id !== session.link_id);
    } catch (error) {
      console.error('Failed to remove session from collection:', error);
    } finally {
      this.removingLinkId = null;
      this.cdr.detectChanges();
    }
  }
}
