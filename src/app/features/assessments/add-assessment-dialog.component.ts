
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CourseService } from '../../services/course';
import { AssessmentService } from '../../services/assessment.service';
import { CreateAssessmentDto } from '../../models/assessment.model';

@Component({
  selector: 'app-add-assessment-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Create New Assessment</h2>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      <mat-dialog-content class="dialog-content">
        @if (error) {
          <div style="background: var(--rose-tint); color: var(--rose); padding: 12px; border-radius: var(--radius-s); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
            <mat-icon style="font-size: 20px; width: 20px; height: 20px;">error_outline</mat-icon>
            {{ error }}
          </div>
        }
        <form [formGroup]="form" class="form-layout">
          
          <mat-form-field appearance="outline">
            <mat-label>Course</mat-label>
            <mat-select formControlName="courseId">
              @for (c of courses; track c.id) {
                <mat-option [value]="c.id">{{ c.courseCode || c.code }} - {{ c.courseName || c.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" placeholder="e.g. Midterm Exam">
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select formControlName="assessmentType">
                <mat-option [value]="0">Assignment</mat-option>
                <mat-option [value]="1">Quiz</mat-option>
                <mat-option [value]="2">Midterm Exam</mat-option>
                <mat-option [value]="3">Final Exam</mat-option>
                <mat-option [value]="4">Project</mat-option>
                <mat-option [value]="5">Practical</mat-option>
                <mat-option [value]="6">Presentation</mat-option>
                <mat-option [value]="7">Class Test</mat-option>
                <mat-option [value]="8">Laboratory</mat-option>
                <mat-option [value]="9">Other</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="assessmentDate">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Total Marks</mat-label>
              <input matInput type="number" formControlName="totalMarks">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Weight (%)</mat-label>
              <input matInput type="number" formControlName="weightPercentage">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Description (Optional)</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions" style="gap: 12px;">
        <button class="btn btn--secondary" type="button" [disabled]="isSubmitting" (click)="close()">Cancel</button>
        <button class="btn btn--primary" type="button" [disabled]="form.invalid || isSubmitting" (click)="submit()">
          {{ isSubmitting ? 'Creating...' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 24px; box-sizing: border-box; overflow-x: hidden; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .dialog-header h2 { margin: 0; font-family: 'Fraunces', serif; color: var(--ink); font-optical-sizing: auto; font-size: 20px; }
    .dialog-content { padding: 0 !important; overflow-y: auto; overflow-x: hidden; max-height: 70vh; }
    .form-layout { display: flex; flex-direction: column; gap: 12px; box-sizing: border-box; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; }
    .row > * { flex: 1; min-width: 0; }
    mat-form-field { width: 100%; box-sizing: border-box; }
    .dialog-actions { padding: 16px 0 0 0; margin-bottom: -8px; }
  `]
})
export class AddAssessmentDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddAssessmentDialogComponent>);
  private courseService = inject(CourseService);
  private api = inject(AssessmentService);
  private data = inject(MAT_DIALOG_DATA, { optional: true });

  courses: any[] = [];
  form: FormGroup;
  error: string | null = null;
  isSubmitting = false;

  constructor() {
    this.form = this.fb.group({
      courseId: [this.data?.courseId || null, Validators.required],
      title: ['', Validators.required],
      description: [''],
      assessmentType: [1, Validators.required],
      totalMarks: [100, [Validators.required, Validators.min(1)]],
      weightPercentage: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      assessmentDate: [new Date(), Validators.required],
      isPublished: [false]
    });
  }

  ngOnInit() {
    this.courseService.getMyCourses().subscribe(res => {
      this.courses = res;
    });
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.valid) {
      this.error = null;
      this.isSubmitting = true;
      const val = this.form.value;
      const data: CreateAssessmentDto = {
        ...val,
        assessmentDate: new Date(val.assessmentDate).toISOString()
      };
      
      this.api.createAssessment(data).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.title || err.error?.detail || err.message;
        }
      });
    }
  }
}
