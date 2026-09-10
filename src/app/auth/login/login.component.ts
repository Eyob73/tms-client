import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.authService.login({
        email: this.email.trim(),
        password: this.password,
      });

      const user = this.authService.currentUser();
      let roles: string[] = [];
      if (user && user.role) {
        roles = Array.isArray(user.role) ? user.role : user.role.split(',').map(r => r.trim());
      }

      if (roles.includes('Admin')) {
        this.router.navigate(['/dashboard']);
      } else if (roles.includes('Instructor')) {
        this.router.navigate(['/command-center']);
      } else if (roles.includes('Student')) {
        this.router.navigate(['/student-dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      this.errorMessage = 'Invalid email or password. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
