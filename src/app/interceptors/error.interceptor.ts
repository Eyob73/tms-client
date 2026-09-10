import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, from } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Extract C# RFC 7807 ProblemDetails detail property
      const detailMessage = err.error?.detail ?? 'A system error occurred. Please try again.';
      
      if (err.status === 401) {
        // If it's a login or refresh request, don't try to refresh
        if (req.url.toLowerCase().includes('/auth/login') || req.url.toLowerCase().includes('/auth/refresh')) {
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => err);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return from(authService.refresh()).pipe(
            switchMap((newToken) => {
              isRefreshing = false;
              refreshTokenSubject.next(newToken);
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              }));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((token) => {
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
              }));
            })
          );
        }
      } else {
        // Surface structured error to developer console / UI notification
        console.error('API Error Response:', detailMessage);
      }
      return throwError(() => err);
    }),
  );
};
