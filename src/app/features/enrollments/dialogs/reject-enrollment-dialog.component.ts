import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface RejectEnrollmentDialogData {
  enrollmentId: string | number;
  studentName: string;
  courseName: string;
  courseCode: string;
}

@Component({
  selector: 'app-reject-enrollment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <div class="reject-dialog">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>cancel</mat-icon>
        </div>
        <div class="header-text">
          <h2 mat-dialog-title>Reject Enrollment Request</h2>
          <p class="subtitle">Provide an optional reason for the student.</p>
        </div>
      </div>

      <mat-dialog-content class="dialog-content">
        <div class="summary-card">
          <div class="summary-item">
            <span class="label">Student:</span>
            <span class="value">{{ data.studentName }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Course:</span>
            <span class="value">{{ data.courseCode }} - {{ data.courseName }}</span>
          </div>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Rejection Reason</mat-label>
          <textarea
            matInput
            rows="3"
            [(ngModel)]="reason"
            placeholder="e.g. Course capacity has been reached or prerequisites not met..."
          ></textarea>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button type="button" (click)="cancel()">Cancel</button>
        <button mat-flat-button color="warn" type="button" (click)="confirm()">
          Reject Enrollment
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .reject-dialog {
      padding: 8px 4px;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-s, 4px);
      background: var(--color-danger-subtle, #fde8e8);
      color: var(--color-danger, #e74c3c);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
    .header-text h2 {
      font-family: 'Fraunces', serif;
      font-optical-sizing: auto;

      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary, var(--ink));
    }
    .subtitle {
      margin: 2px 0 0;
      font-size: 13px;
      color: var(--color-text-secondary, var(--ink-soft));
    }
    .dialog-content {
      padding: 0 0 16px 0 !important;
    }
    .summary-card {
      background: var(--color-gray-50, #f9fafc);
      border: 1px solid var(--color-border, #e3e6ef);
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .summary-item {
      display: flex;
      font-size: 13px;
      .label {
        width: 70px;
        font-weight: 500;
        color: var(--color-text-secondary, var(--ink-soft));
      }
      .value {
        font-weight: 600;
        color: var(--color-text-primary, var(--ink));
      }
    }
    .w-full {
      width: 100%;
    }
    .dialog-actions {
      padding: 8px 0 0 0;
      gap: 8px;
    }
  `],
})
export class RejectEnrollmentDialogComponent {
  readonly data = inject<RejectEnrollmentDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RejectEnrollmentDialogComponent>);

  reason = '';

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    this.dialogRef.close(this.reason.trim());
  }
}
