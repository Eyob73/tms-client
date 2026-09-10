import { Component, OnInit, computed, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AssessmentService } from '../../services/assessment.service';
import { AssessmentDto } from '../../models/assessment.model';
import { AddAssessmentDialogComponent } from './add-assessment-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatTableModule, MatSortModule, MatMenuModule, MatIconModule, MatSnackBarModule],
  templateUrl: './assessments.component.html',
  styleUrl: './assessments.component.scss'
})
export class AssessmentsComponent implements OnInit {
  private readonly api = inject(AssessmentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  assessments = signal<AssessmentDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  displayedColumns = ['title', 'course', 'marks', 'date', 'status', 'actions'];
  searchInput = signal('');
  sortState = signal<{active: string, direction: string}>({ active: '', direction: '' });

  readonly publishedCount = computed(() => this.assessments().filter(a => a.isPublished).length);
  readonly draftCount = computed(() => this.assessments().filter(a => !a.isPublished).length);

  readonly courseId = input<number>();

  filteredAssessments = computed(() => {
    const s = (this.searchInput() || '').toLowerCase();
    const cid = this.courseId();
    let data = this.assessments();
    
    if (cid != null) {
      data = data.filter(a => a.courseId === cid);
    }
    
    if (s) {
      data = data.filter(a => 
        (a.title && a.title.toLowerCase().includes(s)) || 
        (a.courseName && a.courseName.toLowerCase().includes(s)) ||
        (a.courseCode && a.courseCode.toLowerCase().includes(s))
      );
    }
    
    const sort = this.sortState();
    if (sort.active && sort.direction) {
      data = [...data].sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'title': return this.compare(a.title, b.title, isAsc);
          case 'course': return this.compare(a.courseCode || '', b.courseCode || '', isAsc);
          case 'date': return this.compare(new Date(a.assessmentDate).getTime(), new Date(b.assessmentDate).getTime(), isAsc);
          case 'status': return this.compare(a.isPublished ? 1 : 0, b.isPublished ? 1 : 0, isAsc);
          default: return 0;
        }
      });
    }

    return data;
  });

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  onSortChange(sort: any) {
    this.sortState.set(sort);
  }

  ngOnInit() {
    this.loadAssessments();
  }

  loadAssessments() {
    this.isLoading.set(true);
    this.error.set(null);
    this.api.getAssessments().subscribe({
      next: (data) => {
        this.assessments.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load assessments');
        this.isLoading.set(false);
        this.snackBar.open(this.error()!, 'Dismiss', { duration: 5000, panelClass: 'snack-error' });
      }
    });
  }

  onSearchChange(val: string) {
    this.searchInput.set(val);
  }

  openAddAssessment() {
    const dialogRef = this.dialog.open(AddAssessmentDialogComponent, {
      width: '500px',
      data: { courseId: this.courseId() }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAssessments();
        this.snackBar.open('Assessment created successfully.', 'Dismiss', { duration: 4000, panelClass: 'snack-success' });
      }
    });
  }

  togglePublish(a: AssessmentDto) {
    const action = a.isPublished ? this.api.unpublishAssessment(a.id) : this.api.publishAssessment(a.id);
    action.subscribe({
      next: () => {
        this.loadAssessments();
        this.snackBar.open(`Assessment ${a.isPublished ? 'unpublished' : 'published'} successfully.`, 'Dismiss', { duration: 4000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || 'Failed to update publish status.', 'Dismiss', { duration: 5000, panelClass: 'snack-error' });
      }
    });
  }

  deleteAssessment(a: AssessmentDto) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Assessment',
        description: `Are you sure you want to delete "${a.title}"?`,
        warningText: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmTone: 'danger',
        icon: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      
      this.api.deleteAssessment(a.id).subscribe({
        next: () => {
          this.loadAssessments();
          this.snackBar.open('Assessment deleted successfully.', 'Dismiss', { duration: 4000, panelClass: 'snack-success' });
        },
        error: (err) => {
          this.snackBar.open(err.error?.detail || 'Failed to delete assessment.', 'Dismiss', { duration: 5000, panelClass: 'snack-error' });
        }
      });
    });
  }

  getStatusBadgeClass(isPublished: boolean): string {
    return isPublished ? 'badge--success' : 'badge--warning';
  }

  getStatusIcon(isPublished: boolean): string {
    return isPublished ? 'check_circle' : 'hourglass_empty';
  }
}
