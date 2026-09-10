import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../services/user.service';
import { CourseService } from '../../services/course';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-assign-instructor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Assign Instructor</h2>
    <mat-dialog-content class="mat-typography">
      <p>Select an instructor to assign to <strong>{{ data.courseName }}</strong>.</p>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Loading instructors...</span>
        </div>
      } @else if (errorMessage()) {
        <div class="error-message">
          {{ errorMessage() }}
        </div>
      } @else {
        <form [formGroup]="form">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Instructor</mat-label>
            <mat-select formControlName="instructorId">
              <mat-option [value]="null">-- Unassign --</mat-option>
              @for (instructor of instructors(); track instructor.id) {
                <mat-option [value]="instructor.id">
                  {{ instructor.firstName }} {{ instructor.lastName }} ({{ instructor.email }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isSaving()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="save()"
        [disabled]="isLoading() || isSaving() || form.invalid"
      >
        @if (isSaving()) {
          <mat-spinner diameter="20" class="spinner-btn"></mat-spinner>
        } @else {
          Save
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 0;
        gap: 1rem;
        color: var(--mat-sys-on-surface-variant);
      }
      .w-full {
        width: 100%;
        margin-top: 1rem;
      }
      .error-message {
        color: var(--mat-sys-error);
        margin-bottom: 1rem;
      }
      .spinner-btn {
        margin: 0 auto;
      }
    `,
  ],
})
export class AssignInstructorDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AssignInstructorDialogComponent>);
  readonly data = inject<{ courseId: number; courseName: string; currentInstructorId?: string }>(
    MAT_DIALOG_DATA
  );
  private readonly userService = inject(UserService);
  private readonly courseService = inject(CourseService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly instructors = signal<User[]>([]);

  readonly form = this.fb.group({
    instructorId: [this.data.currentInstructorId || null],
  });

  ngOnInit(): void {
    this.loadInstructors();
  }

  private loadInstructors(): void {
    this.userService.getUsers({ role: 'Instructor', pageSize: 1000 }).subscribe({
      next: (response) => {
        this.instructors.set(response.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading instructors', err);
        this.errorMessage.set('Failed to load instructors.');
        this.isLoading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    const selectedInstructorId = this.form.value.instructorId;

    const request$ = selectedInstructorId
      ? this.courseService.assignInstructor(this.data.courseId, selectedInstructorId)
      : this.courseService.removeInstructor(this.data.courseId);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Instructor assigned successfully.', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error saving instructor assignment', err);
        this.errorMessage.set('Failed to assign instructor. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
