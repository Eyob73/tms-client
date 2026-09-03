import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { AdminCourseListComponent } from './features/admin-course-list/admin-course-list.component';
import { LoginComponent } from './auth/login/login.component';
import { InstructorDashboard } from './features/instructor-dashboard/instructor-dashboard';
import { ShellComponent } from './layout/shell.component/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/tms-dashboard/tms-dashboard.component').then(
            (m) => m.TmsDashboardComponent,
          ),
      },
      {
        path: 'tms-dashboard',
        loadComponent: () =>
          import('./features/tms-dashboard/tms-dashboard.component').then(
            (m) => m.TmsDashboardComponent,
          ),
      },
      { path: 'command-center', component: InstructorDashboard, canActivate: [roleGuard] },
      {
        path: 'admin/courses',
        component: AdminCourseListComponent,
        canActivate: [roleGuard('Admin')],
      },
      {
        path: 'courses/:id',
        loadComponent: () =>
          import('./features/course-detail/course-detail.component').then(
            (m) => m.CourseDetailComponent,
          ),
      },
      {
        path: 'enroll',
        loadComponent: () =>
          import('./features/enrollment-form/enrollment-form').then(
            (m) => m.EnrollmentFormComponent,
          ),
      },
      {
        path: 'enrollments',
        loadComponent: () =>
          import('./features/enrollment-list/enrollment-list').then(
            (m) => m.EnrollmentListComponent,
          ),
      },
      {
        path: 'instructor',
        loadComponent: () =>
          import('./features/instructor-dashboard/instructor-dashboard').then(
            (m) => m.InstructorDashboard,
          ),
      },
      {
        path: 'grade-submission',
        loadComponent: () =>
          import('./features/grade-submission/grade-submission.component').then(
            (m) => m.GradeSubmissionComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
