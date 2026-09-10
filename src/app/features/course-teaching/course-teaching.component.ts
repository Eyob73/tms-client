import { Component, computed, inject, signal } from '@angular/core';
import { EnrollmentService } from '../../services/enrollment';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourseService } from '../../services/course';
import { CourseDetail } from '../../models/course.model';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-course-teaching',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './course-teaching.component.html',
  styleUrls: ['./course-teaching.component.scss']
})
export class CourseTeachingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);

  readonly course = signal<CourseDetail | null>(null);
  readonly students = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly studentColumns = ['studentName', 'enrollmentDate', 'status'];

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadCourseData(id);
      }
    });
  }

  loadCourseData(id: number) {
    this.isLoading.set(true);
    
    this.courseService.getById(id).subscribe({
      next: (courseData) => {
        this.course.set(courseData);
        
        // Load enrolled students
        this.enrollmentService.getEnrollments({ courseId: id }).subscribe({
          next: (response) => {
            // response is PagedResult<Enrollment>
            this.students.set(response.items || []);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error loading students', err);
            this.errorMessage.set('Could not load enrolled students.');
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error loading course', err);
        this.errorMessage.set('Could not load course details.');
        this.isLoading.set(false);
      }
    });
  }
}
