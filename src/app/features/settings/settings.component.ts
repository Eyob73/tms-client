import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService, SettingDto } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatTabsModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatSlideToggleModule, 
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isAdmin = signal(this.authService.hasRole('Admin'));

  // User Settings State
  userSettings = signal<SettingDto[]>([]);
  themePref = signal<string>('light');
  langPref = signal<string>('en');
  emailNotif = signal<boolean>(true);
  isUserSaving = signal(false);

  // System Settings State
  systemSettings = signal<SettingDto[]>([]);
  sysName = signal<string>('AAU TMS');
  sysMaintenance = signal<boolean>(false);
  isSysSaving = signal(false);

  ngOnInit() {
    this.loadUserSettings();
    if (this.isAdmin()) {
      this.loadSystemSettings();
    }
  }

  // --- User Settings Methods ---

  private loadUserSettings() {
    this.settingsService.getUserSettings().subscribe({
      next: (settings) => {
        this.userSettings.set(settings);
        const theme = settings.find(s => s.key === 'ThemePreference')?.value;
        const lang = settings.find(s => s.key === 'LanguagePreference')?.value;
        const email = settings.find(s => s.key === 'EmailNotifications')?.value;
        
        if (theme) this.themePref.set(theme);
        if (lang) this.langPref.set(lang);
        if (email) this.emailNotif.set(email === 'true');
      },
      error: (err) => console.error('Failed to load user settings', err)
    });
  }

  saveUserSettings() {
    this.isUserSaving.set(true);
    let completed = 0;
    const total = 3;

    const checkDone = () => {
      completed++;
      if (completed === total) {
        this.isUserSaving.set(false);
        this.snackBar.open('Personal settings saved successfully', 'Close', { duration: 3000 });
      }
    };

    this.settingsService.updateUserSetting('ThemePreference', this.themePref()).subscribe({ next: checkDone, error: checkDone });
    this.settingsService.updateUserSetting('LanguagePreference', this.langPref()).subscribe({ next: checkDone, error: checkDone });
    this.settingsService.updateUserSetting('EmailNotifications', this.emailNotif().toString()).subscribe({ next: checkDone, error: checkDone });
  }

  // --- System Settings Methods ---

  private loadSystemSettings() {
    this.settingsService.getSystemSettings().subscribe({
      next: (settings) => {
        this.systemSettings.set(settings);
        const name = settings.find(s => s.key === 'SystemName')?.value;
        const maintenance = settings.find(s => s.key === 'MaintenanceMode')?.value;
        
        if (name) this.sysName.set(name);
        if (maintenance) this.sysMaintenance.set(maintenance === 'true');
      },
      error: (err) => console.error('Failed to load system settings', err)
    });
  }

  saveSystemSettings() {
    this.isSysSaving.set(true);
    let completed = 0;
    const total = 2;

    const checkDone = () => {
      completed++;
      if (completed === total) {
        this.isSysSaving.set(false);
        this.snackBar.open('System settings saved successfully', 'Close', { duration: 3000 });
      }
    };

    this.settingsService.updateSystemSetting('SystemName', this.sysName()).subscribe({ next: checkDone, error: checkDone });
    this.settingsService.updateSystemSetting('MaintenanceMode', this.sysMaintenance().toString()).subscribe({ next: checkDone, error: checkDone });
  }
}
