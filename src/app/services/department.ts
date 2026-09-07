import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}departments`;

  getAll() {
    return this.http.get<Department[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Department>(`${this.baseUrl}/${id}`);
  }
}
