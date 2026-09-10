import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface SettingDto {
  key: string;
  value: string;
  description?: string;
}

export interface UpdateSettingDto {
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly sysApiUrl = `${environment.apiUrl}system-settings`;
  private readonly userApiUrl = `${environment.apiUrl}user-settings`;

  // System Settings (Admin only)
  getSystemSettings(): Observable<SettingDto[]> {
    return this.http.get<SettingDto[]>(this.sysApiUrl);
  }

  updateSystemSetting(key: string, value: string): Observable<void> {
    return this.http.put<void>(`${this.sysApiUrl}/${key}`, { value });
  }

  // User Settings (Authenticated user)
  getUserSettings(): Observable<SettingDto[]> {
    return this.http.get<SettingDto[]>(this.userApiUrl);
  }

  updateUserSetting(key: string, value: string): Observable<void> {
    return this.http.put<void>(`${this.userApiUrl}/${key}`, { value });
  }
}
