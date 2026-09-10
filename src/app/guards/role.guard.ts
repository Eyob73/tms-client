import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard = (requiredRole: string = 'Admin'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.hasRole(requiredRole)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole('Admin')) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};

export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  
  if (user && user.role) {
    let roles: string[] = [];
    if (Array.isArray(user.role)) {
      roles = user.role;
    } else {
      roles = user.role.split(',').map((r: string) => r.trim());
    }
    
    if (roles.includes('Student')) {
      return true;
    }
  }
  return router.createUrlTree(['/dashboard']);
};

export const instructorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  
  if (user && user.role) {
    let roles: string[] = [];
    if (Array.isArray(user.role)) {
      roles = user.role;
    } else {
      roles = user.role.split(',').map((r: string) => r.trim());
    }
    
    if (roles.includes('Instructor')) {
      return true;
    }
  }
  return router.createUrlTree(['/dashboard']);
};
