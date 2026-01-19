import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemeService, ThemeName } from '../../theme.service';
import { AccountsService } from '../../accounts/accounts.service';
import { LoginModalComponent } from '../../accounts/login-modal/login-modal.component';
import { AccountsComponent } from '../../accounts/accounts/accounts.component';
import { ApiKeyModalComponent } from '../api-key-modal/api-key-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  get availableThemes() {
    return this.themeService.getAvailableThemes();
  }

  get currentThemeName() {
    return this.themeService.getCurrentThemeName();
  }

  constructor(
    public themeService: ThemeService,
    public accounts: AccountsService,
    private modal: NgbModal
  ) {}

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
