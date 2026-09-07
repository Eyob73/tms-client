import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../services/user.service';

export interface UserRolesDialogData {
  userId: string;
  userName: string;
  fullName: string;
  currentRoles: string[];
  isSelf: boolean;
}

@Component({
  selector: 'app-user-roles-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-roles-dialog.component.html',
  styleUrl: './user-roles-dialog.component.scss',
})
export class UserRolesDialogComponent implements OnInit {
  readonly data: UserRolesDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserRolesDialogComponent>);
  private readonly userService = inject(UserService);

  readonly availableRoles = signal<string[]>([]);
  readonly selectedRoles = signal<Set<string>>(new Set<string>());
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const initial = new Set<string>(this.data.currentRoles);
    this.selectedRoles.set(initial);

    this.userService.getAvailableRoles().subscribe({
      next: (roles) => {
        this.availableRoles.set(roles.length > 0 ? roles : ['Admin', 'Instructor', 'Student']);
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback to standard system roles
        this.availableRoles.set(['Admin', 'Instructor', 'Student']);
        this.isLoading.set(false);
      },
    });
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().has(role);
  }

  isRoleDisabled(role: string): boolean {
    if (this.isSubmitting()) {
      return true;
    }
    // Prevent admin from removing Admin role from self
    if (this.data.isSelf && role.toLowerCase() === 'admin') {
      return true;
    }
    return false;
  }

  toggleRole(role: string, isChecked: boolean): void {
    if (this.isRoleDisabled(role)) {
      return;
    }

    const current = new Set(this.selectedRoles());
    if (isChecked) {
      current.add(role);
    } else {
      current.delete(role);
    }
    this.selectedRoles.set(current);
  }

  cancel(): void {
    if (!this.isSubmitting()) {
      this.dialogRef.close(null);
    }
  }

  submit(): void {
    const rolesList = Array.from(this.selectedRoles());
    if (rolesList.length === 0) {
      this.errorMessage.set('At least one role must be assigned.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.userService.updateUserRoles(this.data.userId, rolesList).subscribe({
      next: (updatedRoles) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(updatedRoles);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const detail = err.error?.detail || err.message || 'Failed to update roles.';
        this.errorMessage.set(detail);
      },
    });
  }

  getRoleDescription(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super admin':
        return 'Full system access, manage all users, courses, and platform configurations.';
      case 'instructor':
        return 'Can manage designated courses, grade submissions, and view trainee enrollments.';
      case 'student':
        return 'Can enroll in courses, access learning materials, and view grades.';
      default:
        return 'Standard system permissions.';
    }
  }
}
