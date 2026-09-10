import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  tooltip?: string;
  exact?: boolean;
  adminOnly?: boolean;
  studentOnly?: boolean;
  instructorOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive, 
    RouterOutlet, 
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatButtonModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  isCollapsed = false;

  readonly currentUser = this.authService.currentUser;

  get userDisplayName(): string {
    return this.currentUser()?.displayName || 'Training User';
  }

  get userRole(): string {
    const role = this.currentUser()?.role;
    if (Array.isArray(role)) return role.join(', ');
    return role || '';
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('Admin');
  }

  get isStudent(): boolean {
    const role = this.currentUser()?.role;
    if (!role) return false;
    const roles = Array.isArray(role) ? role : role.split(',').map(r => r.trim());
    return roles.includes('Student');
  }

  get isInstructor(): boolean {
    const role = this.currentUser()?.role;
    if (!role) return false;
    const roles = Array.isArray(role) ? role : role.split(',').map(r => r.trim());
    return roles.includes('Instructor');
  }



  get userInitials(): string {
    const name = this.userDisplayName.trim();
    if (!name) {
      return 'TU';
    }

    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'TU';
  }

  iconMap: Record<string, string> = {
    Dashboard: 'dashboard',
    'Training Programs': 'view_module',
    Courses: 'menu_book',
    Schedule: 'calendar_month',
    Instructors: 'school',
    Trainees: 'groups',
    Assessments: 'assignment_turned_in',
    Certifications: 'workspace_premium',
    Reports: 'bar_chart',
    Compliance: 'security',
    Users: 'manage_accounts',
    Settings: 'settings',
    'Help & Support': 'help_outline',
    'Available Courses': 'school',
    'My Enrollments': 'assignment',
    Enrollments: 'how_to_reg',
  };

  navGroups: NavGroup[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', icon: 'fas fa-th-large', route: '/dashboard', tooltip: 'Dashboard', exact: true, adminOnly: true },
        { label: 'Dashboard', icon: 'fas fa-th-large', route: '/command-center', tooltip: 'Dashboard', exact: true, instructorOnly: true },
        { label: 'Dashboard', icon: 'fas fa-th-large', route: '/student-dashboard', tooltip: 'Dashboard', exact: true, studentOnly: true },
        {
          label: 'Training Programs',
          icon: 'fas fa-layer-group',
          route: '/programs',
          tooltip: 'Training Programs',
          adminOnly: true,
        },
        {
          label: 'Courses',
          icon: 'fas fa-book-open',
          route: '/courses',
          tooltip: 'Course Management',
          adminOnly: true,
        },
        {
          label: 'Available Courses',
          icon: 'fas fa-graduation-cap',
          route: '/enrollments/available',
          tooltip: 'Course Registration',
          exact: true,
          studentOnly: true,
        },
        {
          label: 'My Enrollments',
          icon: 'fas fa-id-card',
          route: '/enrollments/my',
          tooltip: 'My Enrollment Records',
          exact: true,
          studentOnly: true,
        },
        {
          label: 'Schedule',
          icon: 'fas fa-calendar-alt',
          route: '#',
          tooltip: 'Schedule',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          label: 'Users',
          icon: 'fas fa-user-shield',
          route: '/users',
          tooltip: 'User Management',
          adminOnly: true,
        },
        {
          label: 'Instructors',
          icon: 'fas fa-chalkboard-teacher',
          route: '/instructor',
          tooltip: 'Instructors',
          instructorOnly: true,
        },
        {
          label: 'Assessments',
          icon: 'fas fa-tasks',
          route: '/assessments',
          tooltip: 'Assessments',
          instructorOnly: true,
        },
        {
          label: 'Enrollments',
          icon: 'fas fa-user-check',
          route: '/enrollments',
          tooltip: 'Enrollment Requests & Review',
          exact: true,
          adminOnly: true,
        },
        {
          label: 'Certifications',
          icon: 'fas fa-certificate',
          route: '#',
          tooltip: 'Certifications',
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Reports', icon: 'fas fa-chart-bar', route: '#', tooltip: 'Reports' },
        {
          label: 'Compliance',
          icon: 'fas fa-shield-alt',
          route: '#',
          tooltip: 'Compliance',
        },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', icon: 'fas fa-cog', route: '#', tooltip: 'Settings' },
        {
          label: 'Help & Support',
          icon: 'fas fa-question-circle',
          route: '#',
          tooltip: 'Help & Support',
        },
      ],
    },
  ];

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  // Mock Notifications Data
  notifications = [
    { id: 1, title: 'New Enrollment', message: 'John Doe enrolled in Advanced Web Dev', time: '5m ago', read: false },
    { id: 2, title: 'System Update', message: 'TMS has been updated to v2.1.0', time: '1h ago', read: false },
    { id: 3, title: 'Assignment Graded', message: 'Your assignment has been graded.', time: '2h ago', read: true }
  ];

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  logout(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(100vw - 24px, 420px)',
        maxWidth: '420px',
        panelClass: 'logout-dialog-panel',
        disableClose: false,
        autoFocus: true,
        restoreFocus: true,
        hasBackdrop: true,
        data: {
          title: 'Sign out?',
          description: 'Are you sure you want to sign out of your account?',
          confirmText: 'Sign out',
          cancelText: 'Cancel',
          confirmTone: 'primary',
          icon: 'logout',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.authService.logout();
          void this.router.navigateByUrl('/login');
        }
      });
  }
}
