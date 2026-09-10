import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EnrollmentDetails } from '../../../models/enrollment.model';
import { EnrollmentService } from '../../../services/enrollment';

export interface EnrollmentDetailsDialogData {
  enrollmentId: number | string;
}

@Component({
  selector: 'app-enrollment-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="details-dialog">
      <div class="dialog-header">
        <div>
          <h2 class="dialog-title">Enrollment Details</h2>
          <p class="subtitle">Complete record and lifecycle history for request #{{ data.enrollmentId }}</p>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        @if (isLoading()) {
          <div class="loading-state">
            <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
            <span>Loading enrollment details...</span>
          </div>
        } @else if (error()) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error() }}</span>
          </div>
        } @else if (details()) {
          <!-- Status Banner -->
          <div class="status-card" [ngClass]="'status--' + details()!.status.toLowerCase()">
            <div class="status-left">
              <span class="status-dot"></span>
              <span class="status-title">{{ details()!.status }}</span>
            </div>
            <span class="status-date">Submitted on {{ details()!.enrollmentDate | date: 'medium' }}</span>
          </div>

          @if (details()!.rejectionReason) {
            <div class="rejection-box">
              <mat-icon>info</mat-icon>
              <div>
                <strong>Rejection Reason:</strong>
                <p>{{ details()!.rejectionReason }}</p>
              </div>
            </div>
          }

          <div class="sections-grid">
            <!-- 1. Student Information -->
            <div class="info-section">
              <div class="section-title">
                <mat-icon>person</mat-icon>
                <h3>Student Information</h3>
              </div>
              <div class="info-grid">
                <div class="info-row">
                  <span class="lbl">Name:</span>
                  <span class="val">{{ details()!.student.name }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Student ID:</span>
                  <span class="val">{{ details()!.student.registrationNumber }}</span>
                </div>
                @if (details()!.student.email) {
                  <div class="info-row">
                    <span class="lbl">Email:</span>
                    <span class="val">{{ details()!.student.email }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="lbl">GPA:</span>
                  <span class="val">{{ details()!.student.gpa | number: '1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- 2. Course Information -->
            <div class="info-section">
              <div class="section-title">
                <mat-icon>menu_book</mat-icon>
                <h3>Course Information</h3>
              </div>
              <div class="info-grid">
                <div class="info-row">
                  <span class="lbl">Course:</span>
                  <span class="val">{{ details()!.course.courseCode }} - {{ details()!.course.courseName }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Credits:</span>
                  <span class="val">{{ details()!.course.credits }} Credits</span>
                </div>
                @if (details()!.course.departmentName) {
                  <div class="info-row">
                    <span class="lbl">Department:</span>
                    <span class="val">{{ details()!.course.departmentName }}</span>
                  </div>
                }
                @if (details()!.course.instructorId) {
                  <div class="info-row">
                    <span class="lbl">Instructor:</span>
                    <span class="val">{{ details()!.course.instructorId }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="lbl">Capacity:</span>
                  <span class="val">{{ details()!.course.enrolledCount }} / {{ details()!.course.maxCapacity || 30 }} seats filled</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Lifecycle Audit Details -->
          <div class="audit-section">
            <div class="section-title">
              <mat-icon>history</mat-icon>
              <h3>Lifecycle History</h3>
            </div>
            <div class="timeline">
              <div class="timeline-item">
                <span class="timeline-dot"></span>
                <div class="timeline-content">
                  <span class="timeline-action">Enrollment Requested</span>
                  <span class="timeline-time">{{ details()!.createdAt | date: 'medium' }}</span>
                </div>
              </div>

              @if (details()!.approvedDate) {
                <div class="timeline-item timeline-item--success">
                  <span class="timeline-dot success"></span>
                  <div class="timeline-content">
                    <span class="timeline-action">Approved by {{ details()!.approvedBy || 'Admin' }}</span>
                    <span class="timeline-time">{{ details()!.approvedDate | date: 'medium' }}</span>
                  </div>
                </div>
              }

              @if (details()!.rejectedDate) {
                <div class="timeline-item timeline-item--danger">
                  <span class="timeline-dot danger"></span>
                  <div class="timeline-content">
                    <span class="timeline-action">Rejected by {{ details()!.rejectedBy || 'Reviewer' }}</span>
                    <span class="timeline-time">{{ details()!.rejectedDate | date: 'medium' }}</span>
                  </div>
                </div>
              }

              @if (details()!.cancellationDate) {
                <div class="timeline-item timeline-item--neutral">
                  <span class="timeline-dot neutral"></span>
                  <div class="timeline-content">
                    <span class="timeline-action">Cancelled by {{ details()!.cancelledBy || 'Student' }}</span>
                    <span class="timeline-time">{{ details()!.cancellationDate | date: 'medium' }}</span>
                  </div>
                </div>
              }

              @if (details()!.completionDate) {
                <div class="timeline-item timeline-item--info">
                  <span class="timeline-dot info"></span>
                  <div class="timeline-content">
                    <span class="timeline-action">Course Completed</span>
                    <span class="timeline-time">{{ details()!.completionDate | date: 'medium' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button class="btn btn--secondary" (click)="close()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .details-dialog {
      padding: 24px;
      min-width: min(90vw, 700px);
    }
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .dialog-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-primary, var(--ink));
    }
    .subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--color-text-secondary, var(--ink-soft));
    }
    .close-btn {
      color: var(--color-text-tertiary, var(--ink-faint));
      margin-top: -8px;
      margin-right: -8px;
    }
    .dialog-content {
      padding: 0 !important;
      max-height: 70vh;
      overflow-y: auto;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px 0;
      color: var(--color-text-secondary);
      font-size: 14px;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: var(--color-danger-subtle, #fde8e8);
      color: var(--color-danger, #e74c3c);
      font-size: 13px;
    }
    .status-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: var(--radius-s, 4px);
      margin-bottom: 16px;
      font-weight: 600;

      &.status--pending {
        background: var(--color-warning-subtle, #fef3c7);
        color: #b45309;
        border: 1px solid #fef3c7;
        .status-dot { background: #f59e0b; }
      }
      &.status--approved {
        background: #ecfdf5;
        color: #047857;
        border: 1px solid #d1fae5;
        .status-dot { background: #10b981; }
      }
      &.status--rejected {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fee2e2;
        .status-dot { background: #ef4444; }
      }
      &.status--cancelled {
        background: var(--line-soft);
        color: #4b5563;
        border: 1px solid var(--line);
        .status-dot { background: var(--ink-faint); }
      }
      &.status--completed {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #dbeafe;
        .status-dot { background: #3b82f6; }
      }
    }
    .status-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-date {
      font-size: 12px;
      font-weight: 400;
      opacity: 0.85;
    }
    .rejection-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      padding: 12px 14px;
      color: #991b1b;
      margin-bottom: 16px;
      font-size: 13px;

      mat-icon {
        color: #ef4444;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      p {
        margin: 4px 0 0;
      }
    }
    .sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }
    .info-section, .audit-section {
      background: var(--color-gray-50, #f9fafc);
      border: 1px solid var(--color-border, #e3e6ef);
      border-radius: var(--radius-s, 4px);
      padding: 14px 16px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border, #e3e6ef);

      mat-icon {
        color: var(--color-primary, #2d6bf0);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      h3 {

        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-primary, var(--ink));
      }
    }
    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .info-row {
      display: flex;
      font-size: 13px;
      .lbl {
        width: 85px;
        color: var(--color-text-secondary, var(--ink-soft));
        font-weight: 500;
      }
      .val {
        color: var(--color-text-primary, var(--ink));
        font-weight: 600;
        flex: 1;
        word-break: break-word;
      }
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-left: 8px;
    }
    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      position: relative;
    }
    .timeline-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-primary, #2d6bf0);
      margin-top: 4px;

      &.success { background: #10b981; }
      &.danger { background: #ef4444; }
      &.neutral { background: var(--ink-faint); }
      &.info { background: #3b82f6; }
    }
    .timeline-content {
      display: flex;
      flex-direction: column;
    }
    .timeline-action {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary, var(--ink));
    }
    .timeline-time {
      font-size: 11.5px;
      color: var(--color-text-tertiary, var(--ink-faint));
    }
    .dialog-actions {
      padding: 16px 0 0 0 !important;
    }
  `],
})
export class EnrollmentDetailsDialogComponent implements OnInit {
  readonly data = inject<EnrollmentDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EnrollmentDetailsDialogComponent>);
  private readonly enrollmentService = inject(EnrollmentService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  details = signal<EnrollmentDetails | null>(null);

  ngOnInit(): void {
    this.enrollmentService.getEnrollmentById(this.data.enrollmentId).subscribe({
      next: (res) => {
        this.details.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to load enrollment details.');
        this.isLoading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
