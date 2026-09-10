import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="dialog-header__icon">
          <mat-icon>person_add</mat-icon>
        </div>
        <div class="dialog-header__text">
          <h2 mat-dialog-title>Assign Instructor</h2>
          <p class="dialog-subtitle">
            Select an instructor to assign to <strong>{{ data.courseName }}</strong>.
          </p>
        </div>
      </div>

      <mat-dialog-content class="dialog-content">
        @if (isLoading()) {
          <div class="dialog-loading">
            <mat-spinner diameter="32"></mat-spinner>
            <span>Loading instructors...</span>
          </div>
        } @else if (errorMessage()) {
          <div class="status-banner status-banner--error">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
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

      <mat-dialog-actions class="dialog-actions">
        <button
          class="btn btn--secondary"
          type="button"
          mat-dialog-close
          [disabled]="isSaving()"
        >
          Cancel
        </button>
        <button
          class="btn btn--primary"
          type="button"
          (click)="save()"
          [disabled]="isLoading() || isSaving() || form.invalid"
        >
          @if (isSaving()) {
            <mat-spinner diameter="18"></mat-spinner>
            <span>Saving...</span>
          } @else {
            <mat-icon>check</mat-icon>
            <span>Save</span>
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        display: flex;
        flex-direction: column;
        padding: var(--space-6, 24px);
        max-width: 520px;
        background: var(--color-surface, var(--paper-raised));
        border-radius: var(--radius-xl, 24px);
      }

      .dialog-header {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4, 16px);
        margin-bottom: var(--space-5, 20px);
      }

      .dialog-header__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg, 16px);
        background: var(--color-primary-subtle, #f0f5ff);
        color: var(--color-primary, #2d6bf0);
        flex-shrink: 0;
      }

      .dialog-header__icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .dialog-header__text h2 {
        margin: 0 0 var(--space-1, 4px) 0;
        font-size: var(--font-size-lg, 19px);
        font-weight: var(--font-weight-semibold, 600);
        color: var(--color-text-primary, var(--ink));
        line-height: var(--line-height-snug, 1.35);
      }

      .dialog-subtitle {
        margin: 0;
        font-size: var(--font-size-sm, 12.5px);
        color: var(--color-text-secondary, var(--ink-soft));
        line-height: var(--line-height-normal, 1.5);
      }

      .dialog-content {
        padding: 0 !important;
        margin: 0 !important;
        max-height: 65vh;
        overflow-y: auto;
      }

      .dialog-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3, 12px);
        padding: var(--space-8, 32px) 0;
        color: var(--color-text-tertiary, var(--ink-faint));
        font-size: var(--font-size-sm, 12.5px);
      }

      .status-banner {
        display: flex;
        align-items: center;
        gap: var(--space-2, 8px);
        padding: var(--space-3, 12px) var(--space-4, 16px);
        border-radius: var(--radius-md, 12px);
        font-size: var(--font-size-sm, 12.5px);
        margin-bottom: var(--space-4, 16px);
      }

      .status-banner--error {
        background: var(--color-danger-subtle, #fdedeb);
        color: var(--color-danger, #e74c3c);
        border: 1px solid rgba(231, 76, 60, 0.2);
      }

      .status-banner mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      .w-full {
        width: 100%;
      }

      .dialog-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-3, 12px);
        margin-top: var(--space-6, 24px);
        padding: 0 !important;
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
