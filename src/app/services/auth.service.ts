import { firstValueFrom } from 'rxjs';
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

export interface TmsUser {
  id?: string;
  email: string;
  displayName: string;
  role: string | string[];
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
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'tms_access_token';
  private readonly userKey = 'tms_current_user';
  private readonly accessToken = signal<string | null>(this.readStoredToken());
  private readonly baseUrl = `${environment.apiUrl}auth`;

  currentUser = signal<TmsUser | null>(this.readStoredUser());

  constructor() {
    const storedToken = this.readStoredToken();
    if (storedToken) {
      this.accessToken.set(storedToken);
    }

    const storedUser = this.readStoredUser();
    if (storedUser) {
      this.currentUser.set(storedUser);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user || !user.role) return false;
    
    let roles: string[] = [];
    if (Array.isArray(user.role)) {
      roles = user.role;
    } else {
      roles = user.role.split(',').map(r => r.trim());
    }

    return roles.includes(role) || roles.includes('Admin');
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  private readStoredUser(): TmsUser | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? (JSON.parse(raw) as TmsUser) : null;
    } catch {
      return null;
    }
  }

  private persistSession(token: string, user: TmsUser): void {
    this.accessToken.set(token);
    this.currentUser.set(user);

    try {
      localStorage.setItem(this.storageKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch {
      // Ignore storage issues in restricted browsers.
    }
  }

  private getLoginUrls(): string[] {
    const root = environment.apiUrl.replace(/\/$/, '');

    return root.includes('localhost')
      ? [`${root}/Auth/login`, `${root}/Auth/login-local`]
      : [`${root}/Auth/login`];
  }

  async login(credentials: LoginRequest): Promise<void> {
    let lastError: unknown;

    for (const url of this.getLoginUrls()) {
      try {
        const res = await firstValueFrom(this.http.post<AuthResponse>(url, credentials));
        const payloadPart = res.accessToken.split('.')[1];
        const payload = JSON.parse(atob(payloadPart ?? ''));

        const idClaim =
          payload.nameid ||
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          payload.sub ||
          '';

        const emailClaim =
          payload.email ||
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
          payload['email'] ||
          payload.sub;

        const roleClaim =
          payload.role ||
          payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
          payload['role'] ||
          'Student';

        const firstName = payload.FirstName || payload.firstName || '';
        const lastName = payload.LastName || payload.lastName || '';
        const displayName =
          [firstName, lastName].filter(Boolean).join(' ') || payload.Name || emailClaim || 'User';

        const user: TmsUser = {
          id: idClaim,
          email: emailClaim || 'user@unknown.local',
          displayName,
          role: roleClaim,
        };

        this.persistSession(res.accessToken, user);
        console.log('Logged in user:', user);
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

    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.userKey);
    } catch {
      // Ignore if storage is unavailable.
    }
  }
}
