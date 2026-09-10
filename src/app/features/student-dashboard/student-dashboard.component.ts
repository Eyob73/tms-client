import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { EnrollmentService } from '../../services/enrollment';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './student-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  private api = inject(EnrollmentService);
  private auth = inject(AuthService);

  studentName = computed(() => this.auth.currentUser()?.displayName || 'Student');

  coursesResource = rxResource({
    stream: () => this.api.getAvailableCourses(),
  });

  enrollmentsResource = rxResource({
    stream: () => this.api.getMyEnrollments(),
  });

  // --- Computed Stats ---
  stats = computed(() => {
    const enrollments = this.enrollmentsResource.value() ?? [];
    const courses = this.coursesResource.value() ?? [];

    const approved = enrollments.filter(e => e.status === 'Approved').length;
    const pending = enrollments.filter(e => e.status === 'Pending').length;
    const completed = enrollments.filter(e => e.status === 'Completed').length;
    const total = enrollments.length;

    return {
      enrolledCourses: approved + completed,
      pendingEnrollments: pending,
      completedCourses: completed,
      availableCourses: courses.length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // --- Filter for enrollment table ---
  activeFilter = 'all';

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  filteredEnrollments = computed(() => {
    const enrollments = this.enrollmentsResource.value() ?? [];
    if (this.activeFilter === 'all') return enrollments;
    return enrollments.filter(e => e.status.toLowerCase() === this.activeFilter);
  });
}
