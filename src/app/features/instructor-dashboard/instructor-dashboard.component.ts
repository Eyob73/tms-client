import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course';
import { rxResource } from '@angular/core/rxjs-interop';

import { switchMap, map, catchError, forkJoin, of } from 'rxjs';
import { EnrollmentService } from '../../services/enrollment';
import { AssessmentService } from '../../services/assessment.service';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './instructor-dashboard.component.html',
  styleUrl: './instructor-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDashboardComponent {
  private auth = inject(AuthService);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private assessmentService = inject(AssessmentService);

  instructorName = computed(() => this.auth.currentUser()?.displayName || 'Instructor');

  // Resource to fetch courses assigned to this instructor and their real enrollments
  coursesResource = rxResource({
    stream: () => this.courseService.getMyCourses().pipe(
      switchMap(courses => {
        if (!courses || courses.length === 0) return of([]);
        const counts$ = courses.map(c => 
          this.enrollmentService.getEnrollments({ courseId: c.id, status: 'Approved' }).pipe(
            map(res => res.totalCount),
            catchError(() => of(0))
          )
        );
        return forkJoin(counts$).pipe(
          map(counts => courses.map((c, i) => ({ ...c, displayEnrollmentCount: counts[i] })))
        );
      })
    ),
  });
  
  // Resource to fetch assessments and calculate total pending grading
  pendingGradingResource = rxResource({
    stream: () => {
      // First, we need AssessmentService which we will inject
      return this.assessmentService.getAssessments().pipe(
        switchMap(assessments => {
          if (!assessments || assessments.length === 0) return of(0);
          const stats$ = assessments.map(a => 
            this.assessmentService.getStatistics(a.id).pipe(
              map(s => s.pendingCount),
              catchError(() => of(0))
            )
          );
          return forkJoin(stats$).pipe(
            map(counts => counts.reduce((sum, curr) => sum + curr, 0))
          );
        }),
        catchError(() => of(0))
      );
    }
  });

  // Example stats based on their courses
  stats = computed(() => {
    const courses = this.coursesResource.value() ?? [];
    
    // Aggregate some numbers based on the courses array
    let upcomingSessions = 0;
    let activeLearners = 0;
    courses.forEach(c => {
      if (c.status === 'Upcoming') {
        upcomingSessions++;
      }
      activeLearners += (c as any).displayEnrollmentCount || 0;
    });

    return {
      activeCourses: courses.length,
      activeLearners,
      upcomingSessions,
      pendingGrading: this.pendingGradingResource.value() || 0, // Real pending grading count
    };
  });

  // --- Filter for the table ---
  activeFilter = signal('all');

  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  filteredCourses = computed(() => {
    const courses = this.coursesResource.value() ?? [];
    const filter = this.activeFilter();
    
    if (filter === 'all') return courses;
    return courses.filter(c => (c.status?.toLowerCase() || 'active') === filter);
  });

  // Mock recent activities
  recentActivities = signal([
    {
      icon: 'assignment_turned_in',
      iconBg: 'rgba(16, 185, 129, 0.1)',
      iconColor: 'var(--success)',
      text: 'Graded Assignment 1 for <strong>Introduction to Computer Science</strong>',
      time: '2 hours ago',
    },
    {
      icon: 'forum',
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: 'var(--info)',
      text: 'Responded to student questions in <strong>Data Structures</strong>',
      time: '5 hours ago',
    },
    {
      icon: 'upload_file',
      iconBg: 'rgba(139, 92, 246, 0.1)',
      iconColor: '#8b5cf6',
      text: 'Uploaded new course materials for <strong>Web Development</strong>',
      time: 'Yesterday at 2:30 PM',
    },
    {
      icon: 'campaign',
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: 'var(--warning)',
      text: 'Posted an announcement in <strong>Database Systems</strong>',
      time: '2 days ago',
    },
  ]);
}
