import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Department, DepartmentService } from '../../services/department';
import { ProgramService, Program, CreateProgramRequest, UpdateProgramRequest } from '../../services/program';

export interface ProgramDialogData {
  program?: Program; // If editing
}

@Component({
  selector: 'app-program-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ data?.program ? 'Edit Program' : 'Create New Program' }}</h2>
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
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Computer Science B.Sc.">
            @if (form.get('name')?.hasError('required')) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="e.g. CS101">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Department</mat-label>
            <mat-select formControlName="departmentId">
              <mat-option [value]="null">-- None --</mat-option>
              @for (d of departments; track d.id) {
                <mat-option [value]="d.id">{{ d.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Program description..."></textarea>
          </mat-form-field>

          <div style="margin-top: 8px; margin-bottom: 16px;">
            <mat-slide-toggle formControlName="isActive" color="primary">Active Program</mat-slide-toggle>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="close()">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid || isSubmitting" (click)="save()">
          {{ isSubmitting ? 'Saving...' : 'Save' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px 0 24px;
      margin-bottom: 16px;
      
      h2 {
        margin: 0;
        padding: 16px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--ink);
      }
      
      button {
        color: var(--ink-soft);
      }
    }
    .dialog-content {
      padding: 0 24px !important;
      margin: 0;
      flex-grow: 1;
    }
    .form-layout {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .row {
      display: flex;
      gap: 16px;
      mat-form-field {
        flex: 1;
      }
    }
    .dialog-actions {
      padding: 16px 24px;
      margin-bottom: 0;
      border-top: 1px solid var(--line-soft);
      gap: 8px;
    }
  `]
})
export class ProgramDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProgramDialogComponent>);
  public data: ProgramDialogData = inject(MAT_DIALOG_DATA) || {};
  private programService = inject(ProgramService);
  private departmentService = inject(DepartmentService);

  form!: FormGroup;
  departments: Department[] = [];
  isSubmitting = false;
  error: string | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      name: [this.data.program?.name || '', [Validators.required, Validators.maxLength(150)]],
      code: [this.data.program?.code || '', [Validators.maxLength(50)]],
      departmentId: [this.data.program?.departmentId || null],
      description: [this.data.program?.description || '', [Validators.maxLength(1000)]],
      isActive: [this.data.program ? this.data.program.isActive : true]
    });

    this.loadDepartments();
  }

  loadDepartments() {
    this.departmentService.getAll().subscribe({
      next: (deps) => this.departments = deps,
      error: () => console.error('Failed to load departments')
    });
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.error = null;
    const formValue = this.form.value;

    const request: CreateProgramRequest = {
      name: formValue.name,
      code: formValue.code || undefined,
      description: formValue.description || undefined,
      departmentId: formValue.departmentId,
      isActive: formValue.isActive
    };

    const req$ = this.data.program 
      ? this.programService.update(this.data.program.id, request as UpdateProgramRequest)
      : this.programService.create(request);

    req$.subscribe({
      next: (res) => {
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.detail || err.error?.title || 'An error occurred while saving the program.';
      }
    });
  }
}
