import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResponse } from '../models/course.model';
import {
  User,
  UserQueryParameters,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UpdateUserRolesRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  UserStats,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}users`;

  /**
   * Retrieves a paginated list of users matching query filters.
   */
  getUsers(parameters: UserQueryParameters = {}): Observable<PagedResponse<User>> {
    let params = new HttpParams();

    if (parameters.page != null) {
      params = params.set('page', parameters.page.toString());
    }
    if (parameters.pageSize != null) {
      params = params.set('pageSize', parameters.pageSize.toString());
    }
    if (parameters.search && parameters.search.trim()) {
      params = params.set('search', parameters.search.trim());
    }
    if (parameters.role && parameters.role !== 'all') {
      params = params.set('role', parameters.role.trim());
    }
    if (parameters.isActive != null) {
      params = params.set('isActive', parameters.isActive.toString());
    }
    if (parameters.orderBy) {
      params = params.set('orderBy', parameters.orderBy);
    }
    if (parameters.descending != null) {
      params = params.set('descending', parameters.descending.toString());
    }

    return this.http.get<PagedResponse<User>>(this.baseUrl, { params });
  }

  /**
   * Gets a single user by ID.
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  /**
   * Creates a new user with credentials and optional roles.
   */
  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  /**
   * Updates an existing user's profile information.
   */
  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${encodeURIComponent(id)}`, request);
  }

  /**
   * Activates or deactivates a user account.
   */
  updateStatus(id: string, isActive: boolean): Observable<User> {
    const payload: UpdateUserStatusRequest = { isActive };
    return this.http.patch<User>(`${this.baseUrl}/${encodeURIComponent(id)}/status`, payload);
  }

  /**
   * Lists all available roles in the system.
   */
  getAvailableRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/roles`);
  }

  /**
   * Gets roles assigned to a user.
   */
  getUserRoles(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${encodeURIComponent(id)}/roles`);
  }

  /**
   * Synchronizes/replaces roles assigned to a user.
   */
  updateUserRoles(id: string, roles: string[]): Observable<string[]> {
    const payload: UpdateUserRolesRequest = { roles };
    return this.http.put<string[]>(`${this.baseUrl}/${encodeURIComponent(id)}/roles`, payload);
  }

  /**
   * Changes password using current password verification.
   */
  changePassword(id: string, request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/${encodeURIComponent(id)}/change-password`,
      request
    );
  }

  /**
   * Administratively resets password (revokes active sessions).
   */
  resetPassword(id: string, request: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/${encodeURIComponent(id)}/reset-password`,
      request
    );
  }

  /**
   * Soft-deletes a user and revokes active sessions.
   */
  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  /**
   * Restores a soft-deleted user.
   */
  restoreUser(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/${encodeURIComponent(id)}/restore`,
      {}
    );
  }

  /**
   * Retrieves accurate real-time summary statistics from the backend
   * via lightweight parallel count queries (pageSize: 1) without fetching full sets.
   */
  getUserStats(): Observable<UserStats> {
    return forkJoin({
      total: this.getUsers({ page: 1, pageSize: 1 }),
      active: this.getUsers({ page: 1, pageSize: 1, isActive: true }),
      inactive: this.getUsers({ page: 1, pageSize: 1, isActive: false }),
      instructors: this.getUsers({ page: 1, pageSize: 1, role: 'Instructor' }),
      students: this.getUsers({ page: 1, pageSize: 1, role: 'Student' }),
    }).pipe(
      map(({ total, active, inactive, instructors, students }) => ({
        totalUsers: total.totalCount || 0,
        activeUsers: active.totalCount || 0,
        inactiveUsers: inactive.totalCount || 0,
        instructorCount: instructors.totalCount || 0,
        studentCount: students.totalCount || 0,
      }))
    );
  }
}
