import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Enrollment, EnrollmentStatus } from '../../../models/enrollment.model';
import { EnrollmentService } from '../../../services/enrollment';
import { LiveSyncService } from '../../../services/live-sync.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './my-enrollments.component.html',
  styleUrl: './my-enrollments.component.scss',
})
export class MyEnrollmentsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly liveSync = inject(LiveSyncService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  enrollments = signal<Enrollment[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  cancellingId = signal<string | null>(null);

  searchQuery = signal('');
  statusFilter = signal<string>('all');

  readonly filteredEnrollments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.enrollments().filter((e) => {
      const matchesSearch =
        !query ||
        e.courseName.toLowerCase().includes(query) ||
        (e.courseCode && e.courseCode.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (status !== 'all' && e.status !== status) return false;

      return true;
    });
  });

  readonly counts = computed(() => {
    const list = this.enrollments();
    return {
      all: list.length,
      pending: list.filter((e) => e.status === 'Pending').length,
      approved: list.filter((e) => e.status === 'Approved').length,
      rejected: list.filter((e) => e.status === 'Rejected').length,
      completed: list.filter((e) => e.status === 'Completed').length,
      cancelled: list.filter((e) => e.status === 'Cancelled').length,
    };
  });

  ngOnInit(): void {
    this.loadEnrollments();

    // SignalR Real-time synchronization
    this.liveSync.connect();
    this.liveSync.events$.subscribe(() => {
      this.loadEnrollments(false);
    });
  }

  loadEnrollments(showSpinner = true): void {
    if (showSpinner) this.isLoading.set(true);
    this.error.set(null);

    this.enrollmentService.getMyEnrollments().subscribe({
      next: (res) => {
        this.enrollments.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load your enrollments.');
        this.isLoading.set(false);
      },
    });
  }

  canCancel(status: EnrollmentStatus): boolean {
    return status === 'Pending' || status === 'Approved';
  }

  cancelEnrollment(enrollment: Enrollment): void {
    if (!this.canCancel(enrollment.status) || this.cancellingId() !== null) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Cancel Enrollment',
        description: `Are you sure you want to cancel your enrollment in ${enrollment.courseCode ? enrollment.courseCode + ' - ' : ''}${enrollment.courseName}?`,
        warningText: enrollment.status === 'Approved' ? 'You will lose your reserved seat in this course.' : undefined,
        confirmText: 'Yes, Cancel Enrollment',
        cancelText: 'Keep Enrollment',
        confirmTone: 'danger',
        icon: 'cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.cancellingId.set(enrollment.id);

      this.enrollmentService.cancelEnrollment(enrollment.id).subscribe({
        next: () => {
          this.cancellingId.set(null);
          this.snackBar.open('Enrollment cancelled successfully.', 'Dismiss', {
            duration: 4000,
            panelClass: 'snack-success',
          });
          this.loadEnrollments(false);
        },
        error: (err) => {
          this.cancellingId.set(null);
          this.snackBar.open(err.error?.detail || 'Failed to cancel enrollment.', 'Dismiss', {
            duration: 5000,
            panelClass: 'snack-error',
          });
        },
      });
    });
  }

  getStatusBadgeClass(status: EnrollmentStatus): string {
    switch (status) {
      case 'Approved':
        return 'badge--success';
      case 'Pending':
        return 'badge--warning';
      case 'Rejected':
        return 'badge--danger';
      case 'Completed':
        return 'badge--primary';
      case 'Cancelled':
      case 'Archived':
      default:
        return 'badge--neutral';
    }
  }

  getStatusIcon(status: EnrollmentStatus): string {
    switch (status) {
      case 'Approved':
        return 'check_circle';
      case 'Pending':
        return 'hourglass_empty';
      case 'Rejected':
        return 'cancel';
      case 'Completed':
        return 'verified';
      case 'Cancelled':
        return 'block';
      default:
        return 'info';
    }
  }
}
