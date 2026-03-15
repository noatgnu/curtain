import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ThemeService, ThemeName } from '../../theme.service';
import { AccountsService } from '../../accounts/accounts.service';
import { LoginModalComponent } from '../../accounts/login-modal/login-modal.component';
import { AccountsComponent } from '../../accounts/accounts/accounts.component';
import { ApiKeyModalComponent } from '../api-key-modal/api-key-modal.component';
import { AutoSaveService } from '../../auto-save.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {
  lastAutoSave: Date | null = null;

  get availableThemes() {
    return this.themeService.getAvailableThemes();
  }

  get currentThemeName() {
    return this.themeService.getCurrentThemeName();
  }

  constructor(
    public themeService: ThemeService,
    public accounts: AccountsService,
    public autoSave: AutoSaveService,
    private modal: NgbModal,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const trigger = this.autoSave.autoSaveTrigger();
      if (trigger > 0) {
        this.lastAutoSave = new Date();
        this.saveLastAutoSaveTime();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.loadLastAutoSaveTime();
  }

  private loadLastAutoSaveTime(): void {
    const stored = localStorage.getItem('LastAutoSaveTime');
    if (stored) {
      this.lastAutoSave = new Date(parseInt(stored, 10));
    }
  }

  private saveLastAutoSaveTime(): void {
    if (this.lastAutoSave) {
      localStorage.setItem('LastAutoSaveTime', this.lastAutoSave.getTime().toString());
    }
  }

  getLastAutoSaveText(): string {
    if (!this.lastAutoSave) return 'Never';
    const now = new Date();
    const diff = now.getTime() - this.lastAutoSave.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return this.lastAutoSave.toLocaleDateString();
  }

  isDarkMode(): boolean {
    return this.themeService.getCurrentTheme() === 'dark';
  }

  selectTheme(themeName: ThemeName): void {
    this.themeService.setName(themeName);
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    this.themeService.setMode(mode);
  }

  openLoginModal(): void {
    this.modal.open(LoginModalComponent);
  }

  openAccountModal(): void {
    this.modal.open(AccountsComponent, { size: 'xl' });
  }

  openAPIKeyModal(): void {
    this.modal.open(ApiKeyModalComponent, { size: 'lg' });
  }

  logout(): void {
    this.accounts.logout();
  }
}
