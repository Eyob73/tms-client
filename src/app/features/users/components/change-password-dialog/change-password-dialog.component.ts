import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../services/user.service';

export interface ChangePasswordDialogData {
  userId: string;
  userName: string;
  fullName: string;
  isAdminReset: boolean;
}

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const newPass = control.get('newPassword')?.value;
    const confirmPass = control.get('confirmPassword')?.value;
    if (!newPass || !confirmPass) {
      return null;
    }
    return newPass === confirmPass ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
})
export class ChangePasswordDialogComponent {
  readonly data: ChangePasswordDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly hideCurrent = signal(true);
  readonly hideNew = signal(true);
  readonly hideConfirm = signal(true);

  readonly form = this.fb.group(
    {
      currentPassword: [
        '',
        this.data.isAdminReset ? [] : [Validators.required],
      ],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(100),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator() }
  );

  toggleCurrentVisibility(): void {
    this.hideCurrent.update((v) => !v);
  }

  toggleNewVisibility(): void {
    this.hideNew.update((v) => !v);
  }

  toggleConfirmVisibility(): void {
    this.hideConfirm.update((v) => !v);
  }

  cancel(): void {
    if (!this.isSubmitting()) {
      this.dialogRef.close(false);
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();

    if (this.data.isAdminReset) {
      this.userService
        .resetPassword(this.data.userId, {
          newPassword: newPassword || '',
          confirmPassword: confirmPassword || '',
        })
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            const detail = err.error?.detail || err.message || 'Failed to reset password.';
            this.errorMessage.set(detail);
          },
        });
    } else {
      this.userService
        .changePassword(this.data.userId, {
          currentPassword: currentPassword || '',
          newPassword: newPassword || '',
          confirmPassword: confirmPassword || '',
        })
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            const detail = err.error?.detail || err.message || 'Failed to change password.';
            this.errorMessage.set(detail);
          },
        });
    }
  }
}
