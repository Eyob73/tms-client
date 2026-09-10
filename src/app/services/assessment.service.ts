import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AssessmentDto,
  CreateAssessmentDto,
  UpdateAssessmentDto,
  AssessmentResultDto,
  BulkMarksEntryRequest,
  AssessmentStatisticsDto
} from '../models/assessment.model';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl = `${environment.apiUrl}Assessments`;

  constructor(private http: HttpClient) { }

  getAssessments(courseId?: number): Observable<AssessmentDto[]> {
    let params = new HttpParams();
    if (courseId) {
      params = params.set('courseId', courseId.toString());
    }
    return this.http.get<AssessmentDto[]>(this.apiUrl, { params });
  }

  getAssessment(id: number): Observable<AssessmentDto> {
    return this.http.get<AssessmentDto>(`${this.apiUrl}/${id}`);
  }

  createAssessment(data: CreateAssessmentDto): Observable<AssessmentDto> {
    return this.http.post<AssessmentDto>(this.apiUrl, data);
  }

  updateAssessment(id: number, data: UpdateAssessmentDto): Observable<AssessmentDto> {
    return this.http.put<AssessmentDto>(`${this.apiUrl}/${id}`, data);
  }

  deleteAssessment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishAssessment(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/publish`, {});
  }

  unpublishAssessment(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/unpublish`, {});
  }

  getResults(id: number): Observable<AssessmentResultDto[]> {
    return this.http.get<AssessmentResultDto[]>(`${this.apiUrl}/${id}/results`);
  }

  getStudentResults(studentId: number): Observable<AssessmentResultDto[]> {
    return this.http.get<AssessmentResultDto[]>(`${this.apiUrl}/student/${studentId}/results`);
  }

  saveBulkMarks(id: number, data: BulkMarksEntryRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/results/bulk`, data);
  }

  getStatistics(id: number): Observable<AssessmentStatisticsDto> {
    return this.http.get<AssessmentStatisticsDto>(`${this.apiUrl}/${id}/statistics`);
  }
}
