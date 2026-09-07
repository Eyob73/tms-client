import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import {
  ChangePasswordDialogComponent,
  ChangePasswordDialogData,
} from '../change-password-dialog/change-password-dialog.component';
import {
  UserRolesDialogComponent,
  UserRolesDialogData,
} from '../user-roles-dialog/user-roles-dialog.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly user = signal<User | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);

  readonly isSelf = computed(() => {
    const current = this.user();
    if (!current) return false;
    const currentId = this.currentUserId();
    return current.id === currentId || current.email === this.authService.currentUser()?.email;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('User ID was not provided in the route.');
      this.isLoading.set(false);
      return;
    }
    this.loadUser(id);
  }

  loadUser(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err.error?.detail || err.message || 'Unable to load user details.';
        this.errorMessage.set(detail);
      },
    });
  }

  getUserInitials(): string {
    const u = this.user();
    if (!u) return 'U';
    const first = (u.firstName || '').trim().charAt(0);
    const last = (u.lastName || '').trim().charAt(0);
    const initials = `${first}${last}`.toUpperCase();
    if (initials) return initials;
    return (u.userName || 'U').substring(0, 2).toUpperCase();
  }

  getUserFullName(): string {
    const u = this.user();
    if (!u) return '';
    const full = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return full || u.userName;
  }

  openChangePassword(): void {
    const u = this.user();
    if (!u) return;

    const isSelf = this.isSelf();
    const data: ChangePasswordDialogData = {
      userId: u.id,
      userName: u.userName,
      fullName: this.getUserFullName(),
      isAdminReset: !isSelf,
    };

    this.dialog
      .open(ChangePasswordDialogComponent, {
        width: 'min(100vw - 24px, 460px)',
        maxWidth: '460px',
        data,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.showSuccess(
            !isSelf
              ? `Password for '${u.userName}' has been reset successfully.`
              : 'Your password was changed successfully.'
          );
        }
      });
  }

  openManageRoles(): void {
    const u = this.user();
    if (!u) return;

    const data: UserRolesDialogData = {
      userId: u.id,
      userName: u.userName,
      fullName: this.getUserFullName(),
      currentRoles: u.roles || [],
      isSelf: this.isSelf(),
    };

    this.dialog
      .open(UserRolesDialogComponent, {
        width: 'min(100vw - 24px, 500px)',
        maxWidth: '500px',
        data,
      })
      .afterClosed()
      .subscribe((updatedRoles: string[] | null) => {
        if (updatedRoles) {
          this.user.update((prev) => (prev ? { ...prev, roles: updatedRoles } : null));
          this.showSuccess(`Roles updated successfully.`);
        }
      });
  }

  toggleStatus(): void {
    const u = this.user();
    if (!u) return;

    if (this.isSelf() && u.isActive) {
      alert('Administrators cannot deactivate their own account.');
      return;
    }

    const nextState = !u.isActive;
    const actionTitle = nextState ? 'Activate User Account' : 'Deactivate User Account';
    const description = nextState
      ? `Are you sure you want to activate the account for ${this.getUserFullName()} (${u.userName})?`
      : `Are you sure you want to deactivate ${this.getUserFullName()} (${u.userName})? Active sessions will be terminated.`;

    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(100vw - 24px, 440px)',
        maxWidth: '440px',
        data: {
          title: actionTitle,
          description,
          confirmText: nextState ? 'Activate' : 'Deactivate',
          confirmTone: nextState ? 'primary' : 'warn',
          icon: nextState ? 'check_circle' : 'block',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.userService.updateStatus(u.id, nextState).subscribe({
            next: (updated) => {
              this.user.set(updated);
              this.showSuccess(
                `User '${u.userName}' was successfully ${nextState ? 'activated' : 'deactivated'}.`
              );
            },
            error: (err) => {
              alert(err.error?.detail || 'Failed to update status.');
            },
          });
        }
      });
  }

  deleteUser(): void {
    const u = this.user();
    if (!u) return;

    if (this.isSelf()) {
      alert('Administrators cannot delete their own account.');
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(100vw - 24px, 440px)',
        maxWidth: '440px',
        data: {
          title: 'Delete User?',
          description: `Are you sure you want to delete ${this.getUserFullName()} (${u.userName})?`,
          warningText: 'This user will be soft-deleted and removed from active user listings.',
          confirmText: 'Delete User',
          confirmTone: 'danger',
          icon: 'delete',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.userService.deleteUser(u.id).subscribe({
            next: () => {
              void this.router.navigate(['/users']);
            },
            error: (err) => {
              alert(err.error?.detail || 'Failed to delete user.');
            },
          });
        }
      });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4500);
  }
}
