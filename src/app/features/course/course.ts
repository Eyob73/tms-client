import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Course } from '../../models/course.model';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { CourseStore } from '../../store/course.store';

@Component({
  selector: 'app-admin-course-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatSelectModule,
  ],
  templateUrl: './course.html',
  styleUrl: './course.scss',
})
export class CourseComponent {
  private readonly store = inject(CourseStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = [
    'courseName',
    'description',
    'credits',
    'departmentId',
    'programId',
    'courseType',
    'prerequisiteCourseId',
    'durationHours',
    'status',
    'isPublished',
    'createdAt',
    'updatedAt',
    'actions',
  ];

  readonly loading = this.store.isLoading;
  readonly errorMessage = computed(() => this.store.error() ?? null);
  readonly successMessage = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'open' | 'full'>('all');
  readonly departmentFilter = signal<string>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly sortState = signal<Sort | null>(null);

  readonly courses = this.store.courses;
  readonly totalCount = this.store.totalCourses;

  readonly departmentOptions = computed(() => {
    const values = new Set<string>();
    for (const course of this.courses()) {
      const department = course.departmentId || course.department;
      if (department) {
        values.add(department);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  });

  readonly hasActiveFilters = computed(
    () =>
      !!this.searchTerm().trim() ||
      this.statusFilter() !== 'all' ||
      this.departmentFilter() !== 'all',
  );

  filteredCourses = computed(() => {
    let list = [...this.courses()];
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const dept = this.departmentFilter();
    const sort = this.sortState();

    list = list.filter((course) => {
      const code = course.courseCode || course.code || '';
      const name = course.courseName || course.title || '';
      const department = course.departmentId || course.department || '';

      const matchesText =
        !term ||
        code.toLowerCase().includes(term) ||
        name.toLowerCase().includes(term) ||
        (course.description && course.description.toLowerCase().includes(term)) ||
        department.toLowerCase().includes(term);

      let matchesStatus = true;
      if (status === 'open') {
        const capacity = course.maxCapacity;
        const enrolled = course.enrollmentCount;
        matchesStatus = capacity && enrolled ? enrolled < capacity : true;
      } else if (status === 'full') {
        const capacity = course.maxCapacity;
        const enrolled = course.enrollmentCount;
        matchesStatus = capacity && enrolled ? enrolled >= capacity : false;
      }

      const matchesDept = dept === 'all' || department === dept;

      return matchesText && matchesStatus && matchesDept;
    });

    if (sort && sort.active) {
      list = [...list].sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        const valueA = this.getSortValue(a, sort.active);
        const valueB = this.getSortValue(b, sort.active);

        if (valueA === valueB) {
          return 0;
        }

        const comparison = valueA > valueB ? 1 : -1;
        return isAsc ? comparison : -comparison;
      });
    }

    return list;
  });

  constructor() {
    this.loadCourses();
  }

  loadCourses(): void {
    this.store.loadCourses({
      pageIndex: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      search: this.searchTerm().trim() || undefined,
    });
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.loadCourses();
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.departmentFilter.set('all');
    this.pageIndex.set(0);
    this.loadCourses();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCourses();
  }

  applyStatusFilter(filter: 'all' | 'open' | 'full'): void {
    this.statusFilter.set(filter);
    this.pageIndex.set(0);
    this.loadCourses();
  }

  applyDepartmentFilter(filter: string): void {
    this.departmentFilter.set(filter);
    this.pageIndex.set(0);
    this.loadCourses();
  }

  onSortChange(sort: Sort): void {
    this.sortState.set(sort);
  }

  private getSortValue(course: Course, column: string): string | number {
    switch (column) {
      case 'courseCode':
        return (course.courseCode || course.code || '').toLowerCase();
      case 'courseName':
        return (course.courseName || course.title || '').toLowerCase();
      case 'description':
        return (course.description || '').toLowerCase();
      case 'credits':
        return course.credits || course.creditHours || 0;
      case 'departmentId':
        return (course.departmentId || course.department || '').toLowerCase();
      case 'programId':
        return (course.programId || '').toLowerCase();
      case 'courseType':
        return (course.courseType || '').toLowerCase();
      case 'prerequisiteCourseId':
        return (course.prerequisiteCourseId || '').toLowerCase();
      case 'durationHours':
        return course.durationHours || 0;
      case 'status':
        return (course.status || '').toLowerCase();
      case 'isPublished':
        return course.isPublished ? 1 : 0;
      case 'createdAt':
        return new Date(course.createdAt || 0).getTime();
      case 'updatedAt':
        return new Date(course.updatedAt || 0).getTime();
      default:
        return (course.courseName || course.title || '').toLowerCase();
    }
  }

  getCourseCode(course: Course): string {
    return course.courseCode || course.code || '—';
  }

  getCourseName(course: Course): string {
    return course.courseName || course.title || 'Untitled course';
  }

  getCourseCreatedAt(course: Course): string {
    const createdAt = course.createdAt;
    return createdAt ? new Date(createdAt).toLocaleDateString() : '—';
  }

  getCourseUpdatedAt(course: Course): string {
    const updatedAt = course.updatedAt;
    return updatedAt ? new Date(updatedAt).toLocaleDateString() : '—';
  }

  getCourseStatus(course: Course): 'open' | 'full' {
    const capacity = course.maxCapacity;
    const enrolled = course.enrollmentCount;
    if (capacity && enrolled) {
      return enrolled < capacity ? 'open' : 'full';
    }
    return 'open';
  }

  getStatusLabel(course: Course): string {
    return course.status || 'Active';
  }

  getIsPublishedLabel(course: Course): string {
    return course.isPublished ? 'Published' : 'Draft';
  }

  editCourse(course: Course): void {
    const courseName = this.getCourseName(course);
    this.successMessage.set(`Editing ${courseName}.`);
    void this.router.navigate(['/courses/new'], {
      queryParams: { editId: course.id },
    });
  }

  deleteCourse(course: Course): void {
    const courseName = this.getCourseName(course);

    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(100vw - 24px, 420px)',
        maxWidth: '420px',
        panelClass: 'logout-dialog-panel',
        disableClose: false,
        autoFocus: true,
        restoreFocus: true,
        hasBackdrop: true,
        data: {
          title: 'Delete course?',
          description: `This will permanently remove ${courseName} from the system.`,
          warningText: 'Deleting a course may affect related course records and enrollments.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          confirmTone: 'danger',
          icon: 'delete_outline',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.store.deleteCourse(course.id);
        this.successMessage.set(`${courseName} was deleted.`);
        setTimeout(() => this.loadCourses(), 100);
      });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('Admin');
  }
}
