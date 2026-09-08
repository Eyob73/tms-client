import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AvailableCourse } from '../../../models/enrollment.model';
import { EnrollmentService } from '../../../services/enrollment';
import { LiveSyncService } from '../../../services/live-sync.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-available-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './available-courses.component.html',
  styleUrl: './available-courses.component.scss',
})
export class AvailableCoursesComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly liveSync = inject(LiveSyncService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  courses = signal<AvailableCourse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  enrollingCourseId = signal<number | null>(null);

  searchQuery = '';
  selectedFilter: 'all' | 'available' | 'enrolled' = 'all';

  ngOnInit(): void {
    this.loadCourses();

    // Connect live sync for real-time seat availability updates
    this.liveSync.connect();
    this.liveSync.events$.subscribe((event) => {
      // Refresh course list if any enrollment state changed
      this.loadCourses(false);
    });
  }

  loadCourses(showSpinner = true): void {
    if (showSpinner) this.isLoading.set(true);
    this.error.set(null);

    this.enrollmentService.getAvailableCourses().subscribe({
      next: (res) => {
        this.courses.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load courses.');
        this.isLoading.set(false);
      },
    });
  }

  get filteredCourses(): AvailableCourse[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.courses().filter((c) => {
      const matchesSearch =
        !query ||
        c.courseCode.toLowerCase().includes(query) ||
        c.courseName.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.departmentName && c.departmentName.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (this.selectedFilter === 'available') {
        return c.canEnroll;
      }
      if (this.selectedFilter === 'enrolled') {
        return c.studentEnrollmentStatus != null;
      }
      return true;
    });
  }

  getBadgeClass(course: AvailableCourse): string {
    if (course.availabilityStatus === 'Full') return 'full';
    if (course.availabilityStatus === 'Almost Full') return 'almost-full';
    if (course.availabilityStatus === 'Closed') return 'closed';
    return ''; // Default is available
  }

  getBadgeText(course: AvailableCourse): string {
    return course.availabilityStatus;
  }

  getDeptColor(deptName?: string): string {
    if (!deptName) return 'var(--ink)';
    // Simple deterministic color assignment based on department name
    const hash = Array.from(deptName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#233A63', '#9C7326', '#1F6B4E', '#8A93A3', '#5B6577'];
    return colors[hash % colors.length];
  }

  requestEnrollment(course: AvailableCourse): void {
    if (!course.canEnroll || this.enrollingCourseId() !== null) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Request Course Enrollment',
        description: `Are you sure you want to request enrollment in ${course.courseCode} - ${course.courseName}?`,
        confirmText: 'Confirm Enrollment',
        cancelText: 'Cancel',
        confirmTone: 'primary',
        icon: 'school',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.enrollingCourseId.set(course.id);

      this.enrollmentService.requestEnrollment(course.id).subscribe({
        next: () => {
          this.enrollingCourseId.set(null);
          this.snackBar.open(
            `Enrollment request for ${course.courseCode} submitted successfully!`,
            'Dismiss',
            { duration: 4000, panelClass: 'snack-success' }
          );
          this.loadCourses(false);
        },
        error: (err) => {
          this.enrollingCourseId.set(null);
          this.snackBar.open(
            err.error?.detail || 'Failed to submit enrollment request.',
            'Dismiss',
            { duration: 5000, panelClass: 'snack-error' }
          );
        },
      });
    });
  }
}
