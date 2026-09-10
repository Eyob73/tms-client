import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Program {
  id: string;
  name: string;
  code?: string;
  description?: string;
  departmentId?: string | null;
  departmentName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProgramRequest {
  name: string;
  code?: string;
  description?: string;
  departmentId?: string | null;
  isActive: boolean;
}

export interface UpdateProgramRequest {
  name: string;
  code?: string;
  description?: string;
  departmentId?: string | null;
  isActive: boolean;
}

export interface PatchProgramRequest {
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}programs`;

  getAll() {
    return this.http.get<Program[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Program>(`${this.baseUrl}/${id}`);
  }

  getByDepartment(departmentId: string) {
    return this.http.get<Program[]>(`${this.baseUrl}/by-department/${departmentId}`);
  }

  create(data: CreateProgramRequest) {
    return this.http.post<Program>(this.baseUrl, data);
  }

  update(id: string, data: UpdateProgramRequest) {
    return this.http.put<Program>(`${this.baseUrl}/${id}`, data);
  }

  patch(id: string, data: PatchProgramRequest) {
    return this.http.patch<Program>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
