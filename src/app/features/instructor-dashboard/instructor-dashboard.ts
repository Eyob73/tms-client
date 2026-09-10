import { Component, inject, signal } from '@angular/core';
import { AnalyticsChart } from '../../ui/analytics-chart/analytics-chart';
import { CourseService } from '../../services/course';
import { Course } from '../../models/course.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    AnalyticsChart, 
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatButtonModule
  ],
  templateUrl: './instructor-dashboard.html',
  styleUrls: ['./instructor-dashboard.scss'],
})
export class InstructorDashboard {
  private readonly courseService = inject(CourseService);
  
  readonly myCourses = signal<Course[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadMyCourses();
  }

  loadMyCourses(): void {
    this.isLoading.set(true);
    this.courseService.getMyCourses().subscribe({
      next: (courses) => {
        this.myCourses.set(courses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading my courses', err);
        this.errorMessage.set('Unable to load your assigned courses.');
        this.isLoading.set(false);
      }
    });
  }
}
