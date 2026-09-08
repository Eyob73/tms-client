import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Enrollment, EnrollmentFilterRequest, EnrollmentStatus } from '../../../models/enrollment.model';
import { EnrollmentService } from '../../../services/enrollment';
import { LiveSyncService } from '../../../services/live-sync.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { RejectEnrollmentDialogComponent, RejectEnrollmentDialogData } from '../dialogs/reject-enrollment-dialog.component';
import { EnrollmentDetailsDialogComponent, EnrollmentDetailsDialogData } from '../dialogs/enrollment-details-dialog.component';

@Component({
  selector: 'app-admin-enrollments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-enrollments.component.html',
  styleUrl: './admin-enrollments.component.scss',
})
export class AdminEnrollmentsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly liveSync = inject(LiveSyncService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  enrollments = signal<Enrollment[]>([]);
  totalCount = signal(0);
  pageIndex = signal(0);
  pageSize = signal(10);
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  includeArchived = signal(false);
  
  readonly stats = computed(() => {
    const list = this.enrollments();
    return {
      total: this.totalCount(),
      pending: list.filter(e => e.status === 'Pending').length,
      approved: list.filter(e => e.status === 'Approved').length,
      rejected: list.filter(e => e.status === 'Rejected').length,
      completed: list.filter(e => e.status === 'Completed').length,
    };
  });
  sortBy = signal<string>('enrollmentDate');
  descending = signal<boolean>(true);

  isLoading = signal(true);
  error = signal<string | null>(null);
  processingId = signal<string | number | null>(null);

  readonly displayedColumns: string[] = [
    'student',
    'course',
    'status',
    'enrollmentDate',
    'reviewedBy',
    'actions',
  ];

  ngOnInit(): void {
    this.loadEnrollments();

    // SignalR Live Sync
    this.liveSync.connect();
    this.liveSync.events$.subscribe(() => {
      this.loadEnrollments(false);
    });
  }

  loadEnrollments(showSpinner = true): void {
    if (showSpinner) this.isLoading.set(true);
    this.error.set(null);

    const filter: EnrollmentFilterRequest = {
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      search: this.searchQuery().trim() || undefined,
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      includeArchived: this.includeArchived(),
      sortBy: this.sortBy(),
      descending: this.descending(),
    };

    this.enrollmentService.getEnrollments(filter).subscribe({
      next: (res) => {
        this.enrollments.set(res.items);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load enrollments.');
        this.isLoading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
    this.loadEnrollments();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.pageIndex.set(0);
    this.loadEnrollments();
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.loadEnrollments();
  }

  onIncludeArchivedChange(checked: boolean): void {
    this.includeArchived.set(checked);
    this.pageIndex.set(0);
    this.loadEnrollments();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadEnrollments();
  }

  onSortChange(sort: Sort): void {
    this.sortBy.set(sort.active || 'enrollmentDate');
    this.descending.set(sort.direction === 'desc');
    this.pageIndex.set(0);
    this.loadEnrollments();
  }

  openDetails(enrollment: Enrollment): void {
    this.dialog.open(EnrollmentDetailsDialogComponent, {
      width: '600px',
      data: {
        enrollmentId: enrollment.id,
      } as EnrollmentDetailsDialogData,
    });
  }

  approve(enrollment: Enrollment): void {
    if (this.processingId() !== null) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Approve Enrollment Request',
        description: `Are you sure you want to approve enrollment for student "${enrollment.studentName || enrollment.studentId}" in course "${enrollment.courseCode ? enrollment.courseCode + ' - ' : ''}${enrollment.courseName}"?`,
        confirmText: 'Approve Enrollment',
        cancelText: 'Cancel',
        confirmTone: 'primary',
        icon: 'check_circle',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.processingId.set(enrollment.id);

      this.enrollmentService.approveEnrollment(enrollment.id).subscribe({
        next: () => {
          this.processingId.set(null);
          this.snackBar.open('Enrollment approved successfully!', 'Dismiss', {
            duration: 4000,
            panelClass: 'snack-success',
          });
          this.loadEnrollments(false);
        },
        error: (err) => {
          this.processingId.set(null);
          this.snackBar.open(err.error?.detail || 'Failed to approve enrollment.', 'Dismiss', {
            duration: 5000,
            panelClass: 'snack-error',
          });
        },
      });
    });
  }

  reject(enrollment: Enrollment): void {
    if (this.processingId() !== null) return;

    const dialogRef = this.dialog.open(RejectEnrollmentDialogComponent, {
      width: '460px',
      data: {
        enrollmentId: enrollment.id,
        studentName: enrollment.studentName || `Student #${enrollment.studentId}`,
        courseName: enrollment.courseName,
        courseCode: enrollment.courseCode || '',
      } as RejectEnrollmentDialogData,
    });

    dialogRef.afterClosed().subscribe((reason: string | null | undefined) => {
      if (reason === null || reason === undefined) return;

      this.processingId.set(enrollment.id);

      this.enrollmentService.rejectEnrollment(enrollment.id, reason).subscribe({
        next: () => {
          this.processingId.set(null);
          this.snackBar.open('Enrollment request rejected.', 'Dismiss', {
            duration: 4000,
            panelClass: 'snack-success',
          });
          this.loadEnrollments(false);
        },
        error: (err) => {
          this.processingId.set(null);
          this.snackBar.open(err.error?.detail || 'Failed to reject enrollment.', 'Dismiss', {
            duration: 5000,
            panelClass: 'snack-error',
          });
        },
      });
    });
  }

  archive(enrollment: Enrollment): void {
    if (this.processingId() !== null) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Archive Enrollment',
        description: `Archive the enrollment record for "${enrollment.studentName || enrollment.studentId}" in "${enrollment.courseName}"?`,
        warningText: 'Archived enrollments will be hidden from the default review queue.',
        confirmText: 'Archive Record',
        cancelText: 'Cancel',
        confirmTone: 'warn',
        icon: 'archive',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.processingId.set(enrollment.id);

      this.enrollmentService.archiveEnrollment(enrollment.id).subscribe({
        next: () => {
          this.processingId.set(null);
          this.snackBar.open('Enrollment archived successfully.', 'Dismiss', {
            duration: 4000,
            panelClass: 'snack-success',
          });
          this.loadEnrollments(false);
        },
        error: (err) => {
          this.processingId.set(null);
          this.snackBar.open(err.error?.detail || 'Failed to archive enrollment.', 'Dismiss', {
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
