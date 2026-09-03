import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
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

  readonly displayedColumns = [
    'code',
    'name',
    'department',
    'creditHours',
    'status',
    'createdAt',
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

  filteredCourses = computed(() => {
    let list = [...this.courses()];
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const dept = this.departmentFilter();
    const sort = this.sortState();

    list = list.filter((course) => {
      const matchesText =
        !term ||
        course.code.toLowerCase().includes(term) ||
        course.title.toLowerCase().includes(term) ||
        (course.department && course.department.toLowerCase().includes(term));

      let matchesStatus = true;
      if (status === 'open') {
        matchesStatus = course.enrollmentCount < course.maxCapacity;
      } else if (status === 'full') {
        matchesStatus = course.enrollmentCount >= course.maxCapacity;
      }

      const matchesDept = dept === 'all' || course.department === dept;

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
      case 'code':
        return course.code.toLowerCase();
      case 'name':
        return course.title.toLowerCase();
      case 'department':
        return (course.department || '').toLowerCase();
      case 'creditHours':
        return course.creditHours || 0;
      case 'status':
        return course.enrollmentCount < course.maxCapacity ? 1 : 0;
      case 'createdAt':
        return new Date(course.createdAt || 0).getTime();
      default:
        return course.title.toLowerCase();
    }
  }

  getCourseCreatedAt(course: Course): string {
    const createdAt = (course as Course & { createdAt?: string }).createdAt;
    return createdAt ? new Date(createdAt).toLocaleDateString() : '—';
  }

  getCourseStatus(course: Course): 'open' | 'full' {
    return course.enrollmentCount < course.maxCapacity ? 'open' : 'full';
  }

  getStatusLabel(course: Course): string {
    return this.getCourseStatus(course) === 'open' ? 'Open' : 'Full';
  }

  editCourse(course: Course): void {
    this.successMessage.set(`Editing ${course.title}.`);
    // Optionally navigate to edit page
  }

  deleteCourse(course: Course): void {
    const confirmed = window.confirm(`Delete ${course.title}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }
    this.store.deleteCourse(course.id);
    this.successMessage.set(`${course.title} was deleted successfully.`);
    this.loadCourses();
  }
}
