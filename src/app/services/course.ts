import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Course, CourseDetail, PagedResponse } from '../models/course.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/courses`;

  getAll(page = 1, pageSize = 50, search?: string) {
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
    };
    if (search) {
      params['search'] = search;
    }
    return this.http.get<PagedResponse<Course>>(this.baseUrl, { params });
  }

  getById(id: number) {
    return this.http.get<CourseDetail>(`${this.baseUrl}/${id}`);
  }

  create(payload: Partial<Course>) {
    return this.http.post<Course>(this.baseUrl, payload);
  }

  update(id: number, payload: Partial<Course>) {
    return this.http.put<Course>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
