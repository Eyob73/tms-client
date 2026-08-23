import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { AdminCourseListComponent } from './features/admin-course-list/admin-course-list.component';
import { LoginComponent } from './features/login/login.component';
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/student-dashboard/student-dashboard.component').then(
        (m) => m.StudentDashboardComponent,
      ),
  },
  {
    path: 'admin/courses',
    component: AdminCourseListComponent,
    canActivate: [roleGuard('Admin')],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
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
      import('./features/enrollment-form/enrollment-form').then((m) => m.EnrollmentFormComponent),
  },
  {
    path: 'enrollments',
    loadComponent: () =>
      import('./features/enrollment-list/enrollment-list').then((m) => m.EnrollmentListComponent),
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
];
