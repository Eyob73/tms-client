import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { UserStore } from '../../../../store/user.store';
import { UserService } from '../../../../services/user.service';
import { AuthService, TmsUser } from '../../../../services/auth.service';
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
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  readonly store = inject(UserStore);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = [
    'user',
    'userName',
    'email',
    'roles',
    'phoneNumber',
    'status',
    'createdAt',
    'actions',
  ];

  readonly users = this.store.users;
  readonly totalCount = this.store.totalCount;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly stats = this.store.stats;
  readonly availableRoles = this.store.availableRoles;
  readonly hasActiveFilters = this.store.hasActiveFilters;

  readonly sortState = signal<Sort | null>(null);

  readonly sortedUsers = computed(() => {
    const list = [...this.users()];
    const sort = this.sortState();

    if (sort && sort.active && sort.direction) {
      list.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        const valueA = this.getSortValue(a, sort.active);
        const valueB = this.getSortValue(b, sort.active);

        if (valueA === valueB) {
          return 0;
        }

        const comparison = valueA > valueB ? 1 : -1;
        return isAsc ? comparison : -comparison;
      });
    }

    return list;
  });

  readonly searchInput = signal('');
  readonly selectedRole = signal('all');
  readonly selectedStatus = signal<'all' | 'active' | 'inactive'>('all');

  readonly successMessage = signal<string | null>(null);
  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);

  ngOnInit(): void {
    this.store.loadUsers();
    this.store.loadStats();
    this.store.loadAvailableRoles();
  }

  isCurrentUser(user: User): boolean {
    const currentId = this.currentUserId();
    if (!currentId) {
      return false;
    }
    return user.id === currentId || user.email === this.authService.currentUser()?.email;
  }

  getUserInitials(user: User): string {
    const first = (user.firstName || '').trim().charAt(0);
    const last = (user.lastName || '').trim().charAt(0);
    const initials = `${first}${last}`.toUpperCase();
    if (initials) {
      return initials;
    }
    return (user.userName || 'U').substring(0, 2).toUpperCase();
  }

  getUserFullName(user: User): string {
    const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return full || user.userName;
  }

  getRoleClass(role: string): string {
    const r = role.toLowerCase();
    if (r === 'student') return 'role-student';
    if (r === 'instructor') return 'role-instructor';
    if (r === 'admin' || r === 'super admin') return 'role-admin';
    return '';
  }

  onSearchChange(term: string): void {
    this.searchInput.set(term);
    this.store.loadUsers({
      search: term,
      pageIndex: 0,
      role: this.selectedRole(),
      status: this.selectedStatus(),
    });
  }

  onRoleFilterChange(role: string): void {
    this.selectedRole.set(role);
    this.store.loadUsers({
      search: this.searchInput(),
      pageIndex: 0,
      role,
      status: this.selectedStatus(),
    });
  }

  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.selectedStatus.set(status);
    this.store.loadUsers({
      search: this.searchInput(),
      pageIndex: 0,
      role: this.selectedRole(),
      status,
    });
  }

  clearFilters(): void {
    this.searchInput.set('');
    this.selectedRole.set('all');
    this.selectedStatus.set('all');
    this.store.clearFilters();
    this.store.loadUsers({
      search: '',
      role: 'all',
      status: 'all',
      pageIndex: 0,
    });
  }

  onPageChange(event: PageEvent): void {
    this.store.loadUsers({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      search: this.searchInput(),
      role: this.selectedRole(),
      status: this.selectedStatus(),
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize()) || 1;
  }

  get startIndex(): number {
    if (this.totalCount() === 0) return 0;
    return this.pageIndex() * this.pageSize() + 1;
  }

  get endIndex(): number {
    return Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalCount());
  }

  goToPage(index: number): void {
    if (index >= 0 && index < this.totalPages) {
      this.store.loadUsers({
        pageIndex: index,
        pageSize: this.pageSize(),
        search: this.searchInput(),
        role: this.selectedRole(),
        status: this.selectedStatus(),
      });
    }
  }

  changePageSize(event: Event): void {
    const size = parseInt((event.target as HTMLSelectElement).value, 10);
    this.store.loadUsers({
      pageIndex: 0,
      pageSize: size,
      search: this.searchInput(),
      role: this.selectedRole(),
      status: this.selectedStatus(),
    });
  }

  onSortChange(sort: Sort): void {
    this.sortState.set(sort);
  }

  private getSortValue(user: User, column: string): string | number {
    switch (column) {
      case 'user':
        return this.getUserFullName(user).toLowerCase();
      case 'userName':
        return (user.userName || '').toLowerCase();
      case 'email':
        return (user.email || '').toLowerCase();
      case 'roles':
        return (user.roles?.[0] || '').toLowerCase();
      case 'phoneNumber':
        return (user.phoneNumber || '').toLowerCase();
      case 'status':
        return user.isActive ? 1 : 0;
      case 'createdAt':
        return user.createdAt ? new Date(user.createdAt).getTime() : 0;
      default:
        return '';
    }
  }

  openChangePassword(user: User): void {
    const isSelf = this.isCurrentUser(user);
    const data: ChangePasswordDialogData = {
      userId: user.id,
      userName: user.userName,
      fullName: this.getUserFullName(user),
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
              ? `Password for '${user.userName}' has been reset successfully.`
              : 'Your password was changed successfully.'
          );
        }
      });
  }

  openManageRoles(user: User): void {
    const data: UserRolesDialogData = {
      userId: user.id,
      userName: user.userName,
      fullName: this.getUserFullName(user),
      currentRoles: user.roles || [],
      isSelf: this.isCurrentUser(user),
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
          const updatedUser: User = { ...user, roles: updatedRoles };
          this.store.updateLocalUser(updatedUser);
          this.store.loadStats();
          this.showSuccess(`Roles updated for '${user.userName}'.`);
        }
      });
  }

  toggleUserStatus(user: User): void {
    if (this.isCurrentUser(user) && user.isActive) {
      alert('Administrators cannot deactivate their own account.');
      return;
    }

    const nextState = !user.isActive;
    const actionWord = nextState ? 'activate' : 'deactivate';
    const actionTitle = nextState ? 'Activate User Account' : 'Deactivate User Account';
    const description = nextState
      ? `Are you sure you want to activate the account for ${this.getUserFullName(user)} (${user.userName})? The user will regain access to the platform.`
      : `Are you sure you want to deactivate ${this.getUserFullName(user)} (${user.userName})? The user will no longer be able to log in and all active sessions will be terminated.`;

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
          this.userService.updateStatus(user.id, nextState).subscribe({
            next: (updated) => {
              this.store.updateLocalUser(updated);
              this.store.loadStats();
              this.showSuccess(
                `User '${user.userName}' was successfully ${nextState ? 'activated' : 'deactivated'}.`
              );
            },
            error: (err) => {
              alert(err.error?.detail || `Failed to ${actionWord} user.`);
            },
          });
        }
      });
  }

  deleteUser(user: User): void {
    if (this.isCurrentUser(user)) {
      alert('Administrators cannot delete their own account.');
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(100vw - 24px, 440px)',
        maxWidth: '440px',
        data: {
          title: 'Delete User?',
          description: `Are you sure you want to delete ${this.getUserFullName(user)} (${user.userName})? This action will disable the user account and terminate active sessions.`,
          confirmText: 'Delete User',
          confirmTone: 'danger',
          icon: 'delete',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.userService.deleteUser(user.id).subscribe({
            next: () => {
              this.store.removeLocalUser(user.id);
              this.store.loadStats();
              this.showSuccess(`User '${user.userName}' was successfully deleted.`);
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
