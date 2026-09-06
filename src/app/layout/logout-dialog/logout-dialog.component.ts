import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-logout-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-dialog.component.html',
  styleUrl: './logout-dialog.component.scss',
})
export class LogoutDialogComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<LogoutDialogComponent>);

  isLoggingOut = false;

  cancel(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.dialogRef.close(false);
  }

  confirmLogout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.authService.logout();
    this.router.navigateByUrl('/login');
    this.dialogRef.close(true);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isLoggingOut) {
      this.cancel();
    }
  }
}
