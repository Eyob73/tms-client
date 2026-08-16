import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withXhr,
  withXsrfConfiguration,
} from '@angular/common/http';
import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([credentialsInterceptor, errorInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN', // Cookie name set by .NET server
        headerName: 'X-XSRF-TOKEN', // Header expected by .NET server
      }),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withXhr()),
  ],
};
