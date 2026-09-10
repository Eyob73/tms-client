
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { AssessmentService } from '../../services/assessment.service';
import { AssessmentDto, AssessmentResultDto, AssessmentStatisticsDto } from '../../models/assessment.model';

@Component({
  selector: 'app-assessment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule, FormsModule, MatSnackBarModule, MatButtonModule],
  styleUrl: './assessments.component.scss',
  template: `
    <div class="wrap">
      @if (isLoading()) {
        <div class="empty-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; width: 100%; text-align: center; gap: 16px;">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading assessment details...</p>
        </div>
      } @else if (error()) {
        <div class="empty-state" style="color: var(--rose); display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <mat-icon>error_outline</mat-icon>
          <p style="margin: 0;">{{ error() }}</p>
          <a routerLink="/assessments" class="btn btn--secondary btn--sm" style="margin-top: 8px;">
            <mat-icon>arrow_back</mat-icon>
            Back to Assessments
          </a>
        </div>
      } @else if (assessment()) {
        <!-- Back Navigation Header -->
        <div class="page-header animate-in">
          <div class="page-header__left">
            <a class="back-link" routerLink="/assessments">
              <mat-icon>arrow_back</mat-icon>
              <span>Back to Assessments</span>
            </a>
          </div>
        </div>

        <header>
          <div class="header-text">
            <h1>{{ assessment()?.title }}</h1>
            <p>{{ assessment()?.courseCode }} - {{ assessment()?.courseName }}</p>
          </div>
        </header>

        @if (stats()) {
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-icon" style="background:var(--blue-tint);color:var(--blue)">
                <mat-icon>groups</mat-icon>
              </div>
              <div>
                <div class="stat-label">Total Students</div>
                <div class="stat-value">{{ stats()?.totalStudents }}</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background:var(--green-tint);color:var(--green)">
                <mat-icon>checklist</mat-icon>
              </div>
              <div>
                <div class="stat-label">Graded</div>
                <div class="stat-value">{{ stats()?.gradedCount }} / {{ stats()?.totalStudents }}</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background:var(--gold-tint);color:var(--gold)">
                <mat-icon>functions</mat-icon>
              </div>
              <div>
                <div class="stat-label">Average Mark</div>
                <div class="stat-value">{{ stats()?.averageMark | number:'1.1-2' }}</div>
              </div>
            </div>
          </div>
        }

        <div class="panel">
            <div class="panel-head" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2>Grades</h2>
                <p>Enter marks for enrolled students.</p>
              </div>
              <button class="btn btn--primary" (click)="saveMarks()" [disabled]="isSaving()">
                @if (isSaving()) {
                  <mat-spinner diameter="18" style="margin-right: 8px;" color="accent"></mat-spinner>
                  <span>Saving...</span>
                } @else {
                  <ng-container>
                    <mat-icon>save</mat-icon>
                    <span>Save All Marks</span>
                  </ng-container>
                }
              </button>
            </div>

          <div style="overflow-x:auto;">
            <table class="users-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr class="mdc-data-table__row">
                  <th class="mat-mdc-header-cell">Student</th>
                  <th class="mat-mdc-header-cell">Reg. Number</th>
                  <th class="mat-mdc-header-cell">Mark (Out of {{ assessment()?.totalMarks }})</th>
                  <th class="mat-mdc-header-cell">Feedback (Optional)</th>
                </tr>
              </thead>
              <tbody>
                @for (res of results(); track res.studentId) {
                  <tr class="mdc-data-table__row">
                    <td class="mat-mdc-cell" style="font-weight: 500;">{{ res.studentName }}</td>
                    <td class="mat-mdc-cell" style="color: var(--ink-soft)">{{ res.registrationNumber }}</td>
                    <td class="mat-mdc-cell">
                      <input type="number" [(ngModel)]="res.marksObtained" 
                        class="mark-input"
                        min="0" [max]="assessment()?.totalMarks || 100" />
                    </td>
                    <td class="mat-mdc-cell">
                      <input type="text" [(ngModel)]="res.feedback" class="feedback-input" placeholder="Great job..." />
                    </td>
                  </tr>
                }
                @if (results().length === 0) {
                  <tr class="mdc-data-table__row">
                    <td colspan="4" class="mat-mdc-cell empty-state">No students enrolled yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mark-input, .feedback-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: var(--radius-s);
      font-family: inherit;
      color: var(--ink);
      background: var(--paper);
    }
    .mark-input:focus, .feedback-input:focus {
      outline: none;
      border-color: var(--blue);
    }
    .mark-input {
      max-width: 100px;
    }
  `]
})
export class AssessmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AssessmentService);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);

  assessment = signal<AssessmentDto | null>(null);
  stats = signal<AssessmentStatisticsDto | null>(null);
  results = signal<AssessmentResultDto[]>([]);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadData(id);
    }
  }

  loadData(id: number) {
    this.isLoading.set(true);

    // In a real app we might use forkJoin here
    this.api.getAssessment(id).subscribe({
      next: (a) => {
        this.assessment.set(a);

        this.api.getStatistics(id).subscribe(s => this.stats.set(s));
        this.api.getResults(id).subscribe(r => {
          this.results.set(r);
          this.isLoading.set(false);
        });
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load assessment');
        this.isLoading.set(false);
      }
    });
  }

  saveMarks() {
    const a = this.assessment();
    if (!a) return;

    this.isSaving.set(true);
    const payload = {
      marks: this.results().map(r => ({
        studentId: r.studentId,
        marksObtained: Number(r.marksObtained) || 0,
        feedback: r.feedback
      }))
    };

    this.api.saveBulkMarks(a.id, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Marks saved successfully!', 'Dismiss', { duration: 4000, panelClass: 'snack-success' });
        this.loadData(a.id); // Reload to update stats
      },
      error: (err) => {
        this.isSaving.set(false);
        this.snackBar.open('Failed to save marks: ' + (err.error?.detail || err.message), 'Dismiss', { duration: 5000, panelClass: 'snack-error' });
      }
    });
  }
}
