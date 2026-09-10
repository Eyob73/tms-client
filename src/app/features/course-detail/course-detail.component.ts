import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { Router, RouterLink } from '@angular/router';
import { Course } from '../../models/course.model';
import { DepartmentService } from '../../services/department';
import { ProgramService } from '../../services/program';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { CourseStore } from '../../store/course.store';
import { AssignInstructorDialogComponent } from './assign-instructor-dialog.component';

interface CourseOfferingRow {
  academicYear: string;
  semester: string;
  teacher: string;
  startDate: string;
  endDate: string;
  capacity: number | string;
  enrolled: number | string;
  status: string;
}

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss',
})
export class CourseDetailComponent {
  readonly id = input<string | null>(null);

  private readonly departmentService = inject(DepartmentService);
  private readonly programService = inject(ProgramService);
  private readonly courseStore = inject(CourseStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  private readonly selectedCourseId = signal<number | null>(null);

  readonly course = computed(() => {
    const id = this.selectedCourseId();
    if (id == null) {
      return null;
    }

    return this.courseStore.courses().find((course) => course.id === id) ?? null;
  });
  readonly departmentName = signal('—');
  readonly programName = signal('—');
  readonly isLoading = signal(true);
  readonly isDeleting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly courseOfferings = signal<CourseOfferingRow[]>([]);

  readonly offeringColumns = [
    'academicYear',
    'semester',
    'teacher',
    'startDate',
    'endDate',
    'capacity',
    'enrolled',
    'status',
  ];

  readonly overviewCards = computed(() => {
    const course = this.course();
    if (!course) {
      return [];
    }

    return [
      { label: 'Course Code', value: course.courseCode || '—', icon: 'code' },
      { label: 'Course Name', value: course.courseName || 'Untitled', icon: 'school' },
      { label: 'Credits', value: `${course.credits ?? 0}`, icon: 'stars' },
      { label: 'Course Type', value: course.courseType || '—', icon: 'category' },
      { label: 'Level', value: course.level || '—', icon: 'bar_chart' },
      { label: 'Status', value: course.status || 'Active', icon: 'toggle_on' },
      { label: 'Instructor', value: course.instructorName || 'Not Assigned', icon: 'person' },
      { label: 'Duration', value: this.formatDuration(course.durationHours), icon: 'schedule' },
      { label: 'Published', value: course.isPublished ? 'Yes' : 'No', icon: 'visibility' },
    ];
  });

  constructor() {
    effect(() => {
      const rawId = this.id();
      const course = this.course();

      if (!rawId) {
        this.isLoading.set(false);
        this.errorMessage.set('Unable to load course details.');
        return;
      }

      const numericId = Number(rawId);
      if (!Number.isFinite(numericId)) {
        this.isLoading.set(false);
        this.errorMessage.set('Unable to load course details.');
        return;
      }

      this.selectedCourseId.set(numericId);

      if (course) {
        this.isLoading.set(false);
        this.errorMessage.set(null);
        this.loadRelatedMetadata(course);
        return;
      }

      if (!this.courseStore.isLoading()) {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.courseStore.loadCourses({ pageIndex: 1, pageSize: 200 });
      }
    });
  }

  get courseStatusClass(): string {
    const value = this.course()?.status?.toLowerCase() ?? 'active';
    if (value.includes('inactive')) return 'status-pill status-pill--inactive';
    if (value.includes('archived')) return 'status-pill status-pill--archived';
    return 'status-pill status-pill--active';
  }

  get hasPrerequisite(): boolean {
    return !!this.course()?.prerequisiteCourseId;
  }

  private loadRelatedMetadata(course: Course): void {
    if (course.departmentId) {
      this.departmentService.getById(course.departmentId).subscribe({
        next: (department) => this.departmentName.set(department.name || 'Unknown department'),
        error: () => this.departmentName.set('Unknown department'),
      });
    } else {
      this.departmentName.set('—');
    }

    if (course.programId) {
      this.programService.getById(course.programId).subscribe({
        next: (program) => this.programName.set(program.name || 'Unknown program'),
        error: () => this.programName.set('Unknown program'),
      });
    } else {
      this.programName.set('—');
    }

    this.courseOfferings.set([]);
  }

  openDeleteDialog(): void {
    const currentCourse = this.course();
    if (!currentCourse) {
      return;
    }

    const dialogRef = this.dialog.open(CourseDeleteDialogComponent, {
      width: 'min(100vw - 24px, 420px)',
      maxWidth: '420px',
      panelClass: 'logout-dialog-panel',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      hasBackdrop: true,
      data: {
        courseName: currentCourse.courseName,
        courseCode: currentCourse.courseCode,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.deleteCourse();
      }
    });
  }

  deleteCourse(): void {
    const currentCourse = this.course();
    if (!currentCourse) {
      return;
    }

    this.isDeleting.set(true);
    this.courseStore.deleteCourse(currentCourse.id);
    const lastError = this.courseStore.error();

    if (lastError) {
      this.errorMessage.set('Unable to delete the course. Please try again.');
    } else {
      void this.router.navigate(['/courses']);
    }

    this.isDeleting.set(false);
  }

  editCourse(): void {
    const currentCourse = this.course();
    if (!currentCourse) {
      return;
    }

    void this.router.navigate(['/courses/new'], {
      queryParams: { editId: currentCourse.id },
    });
  }

  openAssignInstructorDialog(): void {
    const currentCourse = this.course();
    if (!currentCourse) return;

    const dialogRef = this.dialog.open(AssignInstructorDialogComponent, {
      width: 'min(100vw - 24px, 420px)',
      maxWidth: '420px',
      data: {
        courseId: currentCourse.id,
        courseName: currentCourse.courseName,
        currentInstructorId: currentCourse.instructorId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Reload course details to reflect changes
        this.courseStore.loadCourses({ pageIndex: 1, pageSize: 200 });
      }
    });
  }

  formatDuration(minutesOrHours?: number): string {
    if (!minutesOrHours) {
      return '—';
    }

    return `${minutesOrHours} Hours`;
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

@Component({
  selector: 'app-course-delete-dialog',
  standalone: true,
  imports: [ConfirmDialogComponent],
  template: `
    <app-confirm-dialog
      [data]="dialogData"
      (confirmed)="confirm()"
      (cancelled)="cancel()"
    ></app-confirm-dialog>
  `,
  styles: [],
})
export class CourseDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CourseDeleteDialogComponent>);

  readonly dialogData = {
    title: 'Delete course?',
    description: 'This will permanently remove the course from the system.',
    warningText: 'Deleting a course may affect related course records and enrollments.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmTone: 'danger' as const,
    icon: 'delete_outline',
  };

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
