import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../services/user.service';
import { UserStore } from '../../../../store/user.store';
import { CreateUserRequest, UpdateUserRequest, User } from '../../../../models/user.model';

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (!password || !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly store = inject(UserStore);

  readonly isEditMode = signal(false);
  readonly userId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly availableRoles = signal<string[]>(['Admin', 'Instructor', 'Student']);
  readonly selectedRoles = signal<Set<string>>(new Set<string>(['Student']));

  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  readonly form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.maxLength(20)]],
      department: ['', [Validators.maxLength(100)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      password: [''],
      confirmPassword: [''],
      isActive: [true],
    },
    { validators: passwordMatchValidator() }
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.userService.getAvailableRoles().subscribe({
      next: (roles) => {
        if (roles.length > 0) {
          this.availableRoles.set(roles);
        }
      },
    });

    if (id) {
      this.isEditMode.set(true);
      this.userId.set(id);
      this.loadUserForEdit(id);
    } else {
      // Add mode - configure password validators
      this.form.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(12),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/),
      ]);
      this.form.get('confirmPassword')?.setValidators([Validators.required]);
      this.form.updateValueAndValidity();
    }
  }

  loadUserForEdit(id: string): void {
    this.isLoading.set(true);
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          department: user.department || '',
          userName: user.userName,
          isActive: user.isActive,
        });

        if (user.roles && user.roles.length > 0) {
          this.selectedRoles.set(new Set<string>(user.roles));
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Failed to load user.');
      },
    });
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().has(role);
  }

  toggleRole(role: string, isChecked: boolean): void {
    const current = new Set(this.selectedRoles());
    if (isChecked) {
      current.add(role);
    } else {
      current.delete(role);
    }
    this.selectedRoles.set(current);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  toggleConfirmVisibility(): void {
    this.hideConfirmPassword.update((v) => !v);
  }

  submit(): void {
    if (this.selectedRoles().size === 0) {
      this.errorMessage.set('Please select at least one role for the user.');
      return;
    }

    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formVal = this.form.getRawValue();

    if (this.isEditMode()) {
      const id = this.userId()!;
      const updateRequest: UpdateUserRequest = {
        firstName: formVal.firstName?.trim(),
        lastName: formVal.lastName?.trim(),
        email: formVal.email?.trim(),
        phoneNumber: formVal.phoneNumber?.trim() || null,
        department: formVal.department?.trim() || null,
        userName: formVal.userName?.trim(),
        isActive: formVal.isActive ?? true,
      };

      this.userService.updateUser(id, updateRequest).subscribe({
        next: (updated) => {
          // Sync roles if needed
          const rolesList = Array.from(this.selectedRoles());
          this.userService.updateUserRoles(id, rolesList).subscribe({
            next: (finalRoles) => {
              this.store.updateLocalUser({ ...updated, roles: finalRoles });
              this.store.loadStats();
              this.isSubmitting.set(false);
              void this.router.navigate(['/users', id]);
            },
            error: () => {
              this.store.updateLocalUser(updated);
              this.isSubmitting.set(false);
              void this.router.navigate(['/users', id]);
            },
          });
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.detail || 'Failed to update user.');
        },
      });
    } else {
      const createRequest: CreateUserRequest = {
        userName: formVal.userName!.trim(),
        email: formVal.email!.trim(),
        firstName: formVal.firstName!.trim(),
        lastName: formVal.lastName!.trim(),
        phoneNumber: formVal.phoneNumber?.trim() || null,
        department: formVal.department?.trim() || null,
        password: formVal.password!,
        roles: Array.from(this.selectedRoles()),
        isActive: formVal.isActive ?? true,
      };

      this.userService.createUser(createRequest).subscribe({
        next: (created) => {
          this.store.loadUsers({ pageIndex: 0 });
          this.store.loadStats();
          this.isSubmitting.set(false);
          void this.router.navigate(['/users', created.id]);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.detail || 'Failed to create user.');
        },
      });
    }
  }
}
