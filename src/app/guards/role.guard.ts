import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CanActivateFn, Router } from '@angular/router';

function getFallbackRoute(auth: AuthService): string {
  const user = auth.currentUser();
  if (!user || !user.role) return '/login';
  
  let roles: string[] = [];
  if (Array.isArray(user.role)) {
    roles = user.role;
  } else {
    roles = user.role.split(',').map((r: string) => r.trim());
  }

  if (roles.includes('Admin')) return '/dashboard';
  if (roles.includes('Instructor')) return '/command-center';
  if (roles.includes('Student')) return '/student-dashboard';
  
  return '/login';
}

export const roleGuard = (requiredRole: string = 'Admin'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.hasRole(requiredRole)) {
      return true;
    }
    return router.createUrlTree([getFallbackRoute(auth)]);
  };
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole('Admin')) {
    return true;
  }
  return router.createUrlTree([getFallbackRoute(auth)]);
};

export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole('Student')) {
    return true;
  }
  return router.createUrlTree([getFallbackRoute(auth)]);
};

export const instructorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole('Instructor')) {
    return true;
  }
  return router.createUrlTree([getFallbackRoute(auth)]);
};
