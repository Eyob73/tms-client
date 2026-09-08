import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Enrollment,
  EnrollmentDetails,
  AvailableCourse,
  EnrollmentFilterRequest,
  PagedResult,
} from '../models/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}enrollments`;

  // Student methods
  getAvailableCourses(): Observable<AvailableCourse[]> {
    return this.http.get<AvailableCourse[]>(`${this.baseUrl}/available-courses`);
  }

  requestEnrollment(courseId: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(this.baseUrl, { courseId });
  }

  getMyEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.baseUrl}/my`);
  }

  getMyEnrollmentById(id: number | string): Observable<EnrollmentDetails> {
    return this.http.get<EnrollmentDetails>(`${this.baseUrl}/my/${id}`);
  }

  cancelEnrollment(id: number | string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/${id}/cancel`, {});
  }

  // Admin / Registrar methods
  getEnrollments(filter?: EnrollmentFilterRequest): Observable<PagedResult<Enrollment>> {
    let params = new HttpParams();
    if (filter) {
      if (filter.page != null) params = params.set('page', filter.page.toString());
      if (filter.pageSize != null) params = params.set('pageSize', filter.pageSize.toString());
      if (filter.status) params = params.set('status', filter.status);
      if (filter.search) params = params.set('search', filter.search);
      if (filter.courseId != null) params = params.set('courseId', filter.courseId.toString());
      if (filter.studentId != null) params = params.set('studentId', filter.studentId.toString());
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.descending != null) params = params.set('descending', filter.descending.toString());
      if (filter.includeArchived != null) params = params.set('includeArchived', filter.includeArchived.toString());
    }

    return this.http.get<PagedResult<Enrollment>>(this.baseUrl, { params });
  }

  getEnrollmentById(id: number | string): Observable<EnrollmentDetails> {
    return this.http.get<EnrollmentDetails>(`${this.baseUrl}/${id}`);
  }

  approveEnrollment(id: number | string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/${id}/approve`, {});
  }

  rejectEnrollment(id: number | string, reason?: string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/${id}/reject`, { reason });
  }

  archiveEnrollment(id: number | string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/${id}/archive`, {});
  }

  // Legacy backward compatibility methods
  getAll(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(this.baseUrl);
  }

  approve(id: string): Observable<Enrollment> {
    return this.approveEnrollment(id);
  }
}
