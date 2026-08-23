import { firstValueFrom } from 'rxjs';
import { inject, Injectable, Service, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

export interface TmsUser {
  email: string;
  displayName: string;
  role: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private accessToken = signal<string | null>(null);
  private baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/auth`;

  currentUser = signal<TmsUser | null>(null);

  getAccessToken(): string | null {
    return this.accessToken();
  }
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.role === role || user?.role === 'Admin';
  }

  private getLoginUrls(): string[] {
    const root = environment.apiUrl.replace(/\/$/, '');
    const candidates = [
      `${root}/auth/login`,
      `${root}/Auth/login`,
      `${root}/login`,
      'http://localhost:5001/api/auth/login',
      'http://localhost:5001/api/Auth/login',
      'http://localhost:5001/api/v1/auth/login',
      'http://localhost:5001/api/v1/Auth/login',
      'http://localhost:5001/Auth/login',
    ];

    return [...new Set(candidates)];
  }

  async login(credentials: LoginRequest): Promise<void> {
    let lastError: unknown;

    for (const url of this.getLoginUrls()) {
      try {
        const res = await firstValueFrom(this.http.post<AuthResponse>(url, credentials));
        this.accessToken.set(res.accessToken);

        const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
        this.currentUser.set({
          email: payload.email || payload.sub,
          displayName: payload.name || payload.email || 'User',
          role:
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            payload.role ||
            'Student',
        });
        return;
      } catch (error) {
        lastError = error;
        const httpError = error as HttpErrorResponse;
        if (httpError?.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError ?? new Error('Login endpoint not found');
  }
  logout(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
  }
}
