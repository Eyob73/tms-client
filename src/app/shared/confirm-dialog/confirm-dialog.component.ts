import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  description: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  confirmTone?: 'primary' | 'warn' | 'danger';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  @Input() data: ConfirmDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {
    title: '',
    description: '',
  };

  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>, { optional: true });

  isSubmitting = false;

  get confirmButtonClass(): string {
    switch (this.data?.confirmTone) {
      case 'warn':
      case 'danger':
        return 'btn btn--danger';
      default:
        return 'btn btn--primary';
    }
  }

  cancel(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.dialogRef) {
      this.dialogRef.close(false);
      return;
    }
  }

  confirm(): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    if (this.dialogRef) {
      this.dialogRef.close(true);
    }
  }


}
