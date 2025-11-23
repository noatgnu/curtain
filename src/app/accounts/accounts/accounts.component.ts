import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebService } from '../../web.service';
import { AccountsService } from '../accounts.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Interfaces for type safety
interface CurtainLink {
  link_id: string;
  created: Date;
  description?: string;
  enable?: boolean;
  [key: string]: any;
}

interface ApiResponse<T = any> {
  data: {
    results: T[];
    count: number;
  };
  code?: string;
  message?: string;
}

interface PaginationData {
  results: CurtainLink[];
  count: number;
}

interface SelectedLinksState {
  [linkId: string]: boolean;
}

interface DescriptionTriggerState {
  [linkId: string]: boolean;
}

interface ApiError {
  code?: string;
  message?: string;
  status?: number;
}

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  standalone: false
})
export class AccountsComponent implements OnInit, OnDestroy {
  // Component state with proper typing
  data: PaginationData = { results: [], count: 0 };
  form!: FormGroup;
  currentPage: number = 1;
  totalItems: number = 0;
  pageNumber: number = 0;
  base: string = window.location.origin;
  descriptionTrigger: DescriptionTriggerState = {};
  selectedLinks: SelectedLinksState = {};
  selectedCount: number = 0;
  isLoading: boolean = false;
  activeTab: number = 1;

  collections: any[] = [];
  collectionsLoading: boolean = false;
  collectionPage: number = 1;
  totalCollections: number = 0;
  collectionSearchQuery: string = '';

  // RxJS subject for component cleanup
  private readonly destroy$ = new Subject<void>();

  // Constants
  private readonly ITEMS_PER_PAGE = 20;
  private readonly COLLECTIONS_PER_PAGE = 20;
  constructor(
    private readonly web: WebService,
    public readonly accounts: AccountsService,
    private readonly fb: FormBuilder
  ) {
    this.initializeForm();
    this.initializeUserData();
  }
  
  /**
   * Initializes the reactive form with validation
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      sessionDescription: ['', [Validators.maxLength(255)]]
    });
  }
  
  /**
   * Initializes user data and loads initial curtain links
   */
  private async initializeUserData(): Promise<void> {
    try {
      this.isLoading = true;
      await this.accounts.getUser();
      
      const username = this.accounts.curtainAPI.user?.username;
      if (!username) {
        throw new Error('User not authenticated');
      }
      
      const data = await this.accounts.curtainAPI.getCurtainLinks(username, '');
      this.updateShowingLink(data);
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnInit(): void {
    // Component initialization is handled in constructor
    // Additional initialization logic can be added here if needed
  }

  onTabChange(tabId: number): void {
    if (tabId === 2) {
      this.loadCollections();
    }
  }
  
  /**
   * Cleanup component resources on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Submits search form and retrieves curtain links for specified page
   * @param page - Page number (1-based)
   */
  async submit(page: number = 1): Promise<void> {
    if (!this.form.valid) {
      console.warn('Form is invalid');
      return;
    }
    
    const username = this.accounts.curtainAPI.user?.username;
    if (!username) {
      console.error('User not authenticated');
      return;
    }
    
    try {
      this.isLoading = true;
      const sessionDescription = this.form.get('sessionDescription')?.value ?? '';
      const offset = Math.max(0, (page - 1)) * this.ITEMS_PER_PAGE;
      
      const data = await this.accounts.curtainAPI.getCurtainLinks(
        username, 
        sessionDescription, 
        offset
      );
      
      this.updateShowingLink(data);
      this.currentPage = page;
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Updates the component state with fetched curtain links data
   * @param response - API response containing curtain links data
   */
  private updateShowingLink(response: ApiResponse<CurtainLink>): void {
    if (!response?.data?.results) {
      console.warn('Invalid response data structure');
      return;
    }
    
    // Transform and validate the data
    const processedResults = response.data.results.map((link): CurtainLink => {
      const linkId = link.link_id;
      
      // Initialize UI state for new links
      if (!(linkId in this.descriptionTrigger)) {
        this.descriptionTrigger[linkId] = false;
        this.selectedLinks[linkId] = false;
      }
      
      // Parse and validate date
      const createdDate = link.created ? new Date(link.created) : new Date();
      if (isNaN(createdDate.getTime())) {
        console.warn(`Invalid date for link ${linkId}`);
      }
      
      return {
        ...link,
        created: createdDate
      };
    });
    
    this.totalItems = response.data.count ?? 0;
    this.pageNumber = Math.ceil(this.totalItems / this.ITEMS_PER_PAGE);
    this.data = {
      results: processedResults,
      count: this.totalItems
    };
  }

  /**
   * Deletes a single curtain link by ID
   * @param linkId - The ID of the link to delete
   */
  async deleteLink(linkId: string): Promise<void> {
    if (!this.validateLinkId(linkId)) {
      return;
    }
    
    try {
      this.isLoading = true;
      await this.accounts.deleteCurtainLink(linkId);
      
      // Refresh the current page and user data
      await Promise.all([
        this.submit(this.currentPage),
        this.accounts.getUser()
      ]);
      
      // Clean up UI state
      delete this.descriptionTrigger[linkId];
      delete this.selectedLinks[linkId];
      this.updateSelectedCount();
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Toggles the description visibility for a specific link
   * @param linkId - The ID of the link to toggle description for
   */
  viewDescription(linkId: string): void {
    if (!this.validateLinkId(linkId)) {
      return;
    }
    
    this.descriptionTrigger[linkId] = !this.descriptionTrigger[linkId];
  }

  /**
   * Toggles selection state of a link and updates selected count
   * @param linkId - The ID of the link to toggle selection for
   */
  addOrRemoveFromSelected(linkId: string): void {
    if (!this.validateLinkId(linkId)) {
      return;
    }
    
    // Initialize if not exists, otherwise toggle
    if (linkId in this.selectedLinks) {
      this.selectedLinks[linkId] = !this.selectedLinks[linkId];
    } else {
      this.selectedLinks[linkId] = true;
    }
    
    this.updateSelectedCount();
  }

  /**
   * Toggles selection of all links on current page
   */
  toggleSelectAll(): void {
    const allSelected = this.selectedCount === this.data.results.length && this.data.results.length > 0;
    
    this.data.results.forEach(link => {
      this.selectedLinks[link.link_id] = !allSelected;
    });
    
    this.updateSelectedCount();
  }
  
  /**
   * Updates the selected count based on current selection state
   */
  private updateSelectedCount(): void {
    this.selectedCount = Object.values(this.selectedLinks).filter(Boolean).length;
  }

  /**
   * Adds an owner to all currently selected links
   * @param owner - The username to add as owner
   */
  async addOwnerToLinks(owner: string): Promise<void> {
    if (!this.validateOwnerInput(owner)) {
      return;
    }
    
    const selectedLinkIds = this.getSelectedLinkIds();
    if (selectedLinkIds.length === 0) {
      console.warn('No links selected for owner addition');
      return;
    }
    
    try {
      this.isLoading = true;
      
      // Add owner to each selected link
      await Promise.all(
        selectedLinkIds.map(linkId => 
          this.accounts.curtainAPI.addOwner(linkId, owner)
        )
      );
      
      // Refresh data
      await this.refreshDataAfterBulkOperation();
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Public wrapper for adding owner to selected links
   * @param owner - The username to add as owner
   */
  addOwnerToSelectedLinks(owner: string): void {
    this.addOwnerToLinks(owner).catch(error => {
      console.error('Failed to add owner to selected links:', error);
    });
  }

  /**
   * Removes all currently selected links
   */
  async removeLinks(): Promise<void> {
    const selectedLinkIds = this.getSelectedLinkIds();
    if (selectedLinkIds.length === 0) {
      console.warn('No links selected for removal');
      return;
    }
    
    try {
      this.isLoading = true;
      
      // Delete all selected links
      await Promise.all(
        selectedLinkIds.map(linkId => 
          this.accounts.deleteCurtainLink(linkId)
        )
      );
      
      // Clean up UI state for deleted links
      selectedLinkIds.forEach(linkId => {
        delete this.descriptionTrigger[linkId];
        delete this.selectedLinks[linkId];
      });
      
      this.updateSelectedCount();
      
      // Refresh data
      await this.refreshDataAfterBulkOperation();
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Public wrapper for removing selected links
   */
  removeSelectedLinks(): void {
    this.removeLinks().catch(error => {
      console.error('Failed to remove selected links:', error);
    });
  }

  /**
   * Changes the publicity status of all currently selected links
   * @param status - The new publicity status (true for public, false for private)
   */
  async changePublicity(status: boolean): Promise<void> {
    const selectedLinkIds = this.getSelectedLinkIds();
    if (selectedLinkIds.length === 0) {
      console.warn('No links selected for publicity change');
      return;
    }
    
    try {
      this.isLoading = true;
      
      // Update publicity status for all selected links
      await Promise.all(
        selectedLinkIds.map(linkId => 
          this.accounts.curtainAPI.updateSession({ enable: status }, linkId)
        )
      );
      
      // Refresh data
      await this.refreshDataAfterBulkOperation();
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading = false;
    }
  }
  /**
   * Public wrapper for changing publicity of selected links
   * @param status - The new publicity status
   */
  changePublicitySelectedLinks(status: boolean): void {
    this.changePublicity(status).catch(error => {
      console.error('Failed to change publicity of selected links:', error);
    });
  }
  
  // Private helper methods
  
  /**
   * Validates a link ID input
   * @param linkId - The link ID to validate
   * @returns True if valid, false otherwise
   */
  private validateLinkId(linkId: string): boolean {
    if (!linkId || typeof linkId !== 'string' || linkId.trim().length === 0) {
      console.error('Invalid link ID provided');
      return false;
    }
    return true;
  }
  
  /**
   * Validates owner input
   * @param owner - The owner string to validate
   * @returns True if valid, false otherwise
   */
  private validateOwnerInput(owner: string): boolean {
    if (!owner || typeof owner !== 'string' || owner.trim().length === 0) {
      console.error('Invalid owner input provided');
      return false;
    }
    return true;
  }
  
  /**
   * Gets array of currently selected link IDs
   * @returns Array of selected link IDs
   */
  private getSelectedLinkIds(): string[] {
    return Object.entries(this.selectedLinks)
      .filter(([_, isSelected]) => isSelected === true)
      .map(([linkId, _]) => linkId);
  }
  
  /**
   * Refreshes data after bulk operations (add owner, remove links, change publicity)
   */
  private async refreshDataAfterBulkOperation(): Promise<void> {
    const username = this.accounts.curtainAPI.user?.username;
    if (!username) {
      throw new Error('User not authenticated');
    }
    
    const sessionDescription = this.form.get('sessionDescription')?.value ?? '';
    const [linksData] = await Promise.all([
      this.accounts.curtainAPI.getCurtainLinks(username, sessionDescription),
      this.accounts.getUser()
    ]);
    
    this.updateShowingLink(linksData);
  }
  
  /**
   * Handles API errors in a consistent manner
   * @param error - The error object to handle
   */
  private async handleApiError(error: ApiError): Promise<void> {
    console.error('API Error:', error);

    // Handle token expiration
    if (error.code === 'token_not_valid') {
      try {
        await this.accounts.logout();
      } catch (logoutError) {
        console.error('Logout failed:', logoutError);
      }
    }

    // Log error for debugging
    console.error(`Operation failed: ${error.message ?? 'Unknown error'}`);
  }

  async loadCollections(): Promise<void> {
    try {
      this.collectionsLoading = true;
      const response = await this.accounts.getCollections(
        this.collectionPage,
        this.COLLECTIONS_PER_PAGE,
        this.collectionSearchQuery,
        true
      );
      this.collections = response.results || [];
      this.totalCollections = response.count || 0;
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      this.collectionsLoading = false;
    }
  }

  searchCollections(): void {
    this.collectionPage = 1;
    this.loadCollections();
  }

  openCreateCollectionModal(): void {
    const name = prompt('Enter collection name:');
    if (name && name.trim()) {
      const description = prompt('Enter collection description (optional):');
      this.createCollection(name.trim(), description?.trim() || '');
    }
  }

  async createCollection(name: string, description: string = ''): Promise<void> {
    try {
      this.collectionsLoading = true;
      await this.accounts.createCollection(name, description);
      await this.loadCollections();
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      this.collectionsLoading = false;
    }
  }

  openEditCollectionModal(collection: any): void {
    const name = prompt('Enter new collection name:', collection.name);
    if (name && name.trim()) {
      const description = prompt('Enter new collection description (optional):', collection.description || '');
      this.updateCollection(collection.id, name.trim(), description?.trim() || '');
    }
  }

  async updateCollection(id: number, name: string, description: string = ''): Promise<void> {
    try {
      this.collectionsLoading = true;
      await this.accounts.updateCollection(id, name, description);
      await this.loadCollections();
    } catch (error) {
      console.error('Failed to update collection:', error);
    } finally {
      this.collectionsLoading = false;
    }
  }

  confirmDeleteCollection(collection: any): void {
    if (confirm(`Are you sure you want to delete collection "${collection.name}"?`)) {
      this.deleteCollection(collection.id);
    }
  }

  async deleteCollection(id: number): Promise<void> {
    try {
      this.collectionsLoading = true;
      await this.accounts.deleteCollection(id);
      await this.loadCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    } finally {
      this.collectionsLoading = false;
    }
  }

  viewCollectionSessions(collection: any): void {
    console.log('Viewing sessions for collection:', collection);
  }
}
