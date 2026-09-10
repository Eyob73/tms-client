import { Routes } from '@angular/router';
import { roleGuard, adminGuard, studentGuard, instructorGuard } from './guards/role.guard';
import { ShellComponent } from './layout/shell.component/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/tms-dashboard/tms-dashboard.component').then(
            (m) => m.TmsDashboardComponent,
          ),
      },
      {
        path: 'tms-dashboard',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/tms-dashboard/tms-dashboard.component').then(
            (m) => m.TmsDashboardComponent,
          ),
      },
      {
        path: 'student-dashboard',
        loadComponent: () =>
          import('./features/student-dashboard/student-dashboard.component').then(
            (m) => m.StudentDashboardComponent,
          ),
        canActivate: [studentGuard],
      },
      {
        path: 'command-center',
        loadComponent: () =>
          import('./features/instructor-dashboard/instructor-dashboard.component').then(
            (m) => m.InstructorDashboardComponent,
          ),
        canActivate: [instructorGuard],
      },
      {
        path: 'programs',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/programs/programs.component').then((m) => m.ProgramsComponent),
      },
      {
        path: 'courses',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/course/course').then((m) => m.CourseComponent),
      },
      {
        path: 'courses/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/course/add-course/add-course.component').then(
            (m) => m.AddCourseComponent,
          ),
      },
      {
        path: 'courses/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/course-detail/course-detail.component').then(
            (m) => m.CourseDetailComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/components/user-management/user-management.component').then(
            (m) => m.UserManagementComponent,
          ),
      },
      {
        path: 'users/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/components/user-form/user-form.component').then(
            (m) => m.UserFormComponent,
          ),
      },
      {
        path: 'users/edit/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/components/user-form/user-form.component').then(
            (m) => m.UserFormComponent,
          ),
      },
      {
        path: 'users/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/components/user-detail/user-detail.component').then(
            (m) => m.UserDetailComponent,
          ),
      },
      {
        path: 'enrollments/available',
        canActivate: [studentGuard],
        loadComponent: () =>
          import(
            './features/enrollments/available-courses/available-courses.component'
          ).then((m) => m.AvailableCoursesComponent),
      },
      {
        path: 'enrollments/my',
        canActivate: [studentGuard],
        loadComponent: () =>
          import(
            './features/enrollments/my-enrollments/my-enrollments.component'
          ).then((m) => m.MyEnrollmentsComponent),
      },

      {
        path: 'enrollments',
        canActivate: [adminGuard],
        loadComponent: () =>
          import(
            './features/enrollments/admin-enrollments/admin-enrollments.component'
          ).then((m) => m.AdminEnrollmentsComponent),
      },
      {
        path: 'admin/enrollments',
        canActivate: [adminGuard],
        loadComponent: () =>
          import(
            './features/enrollments/admin-enrollments/admin-enrollments.component'
          ).then((m) => m.AdminEnrollmentsComponent),
      },
      {
        path: 'enroll',
        redirectTo: 'enrollments/available',
        pathMatch: 'full',
      },
      {
        path: 'instructor',
        canActivate: [instructorGuard],
        loadComponent: () =>
          import('./features/instructor-course/instructor-course').then(
            (m) => m.InstructorCourseComponent,
          ),
      },
      {
        path: 'teaching/:id',
        loadComponent: () =>
          import('./features/course-teaching/course-teaching.component').then(
            (m) => m.CourseTeachingComponent,
          ),
        canActivate: [instructorGuard],
      },
      {
        path: 'assessments',
        loadComponent: () => import('./features/assessments/assessments.component').then(m => m.AssessmentsComponent),
        canActivate: [instructorGuard]
      },
      {
        path: 'assessments/:id',
        loadComponent: () => import('./features/assessments/assessment-detail.component').then(m => m.AssessmentDetailComponent),
        canActivate: [instructorGuard]
      },
      {
        path: 'grade-submission',
        loadComponent: () =>
          import('./features/grade-submission/grade-submission.component').then(
            (m) => m.GradeSubmissionComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
