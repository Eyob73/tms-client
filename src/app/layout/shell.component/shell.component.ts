import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  tooltip?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
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
    return this.currentUser()?.role || 'Administrator';
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
    Settings: 'settings',
    'Help & Support': 'help_outline',
  };

  navGroups: NavGroup[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', icon: 'fas fa-th-large', route: '/dashboard', tooltip: 'Dashboard' },
        {
          label: 'Training Programs',
          icon: 'fas fa-layer-group',
          route: '#',
          tooltip: 'Training Programs',
        },
        {
          label: 'Courses',
          icon: 'fas fa-book-open',
          route: '/courses',
          tooltip: 'Course Management',
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
          label: 'Instructors',
          icon: 'fas fa-chalkboard-teacher',
          route: '/instructor',
          tooltip: 'Instructors',
        },
        { label: 'Trainees', icon: 'fas fa-users', route: '/enrollments', tooltip: 'Trainees' },
        {
          label: 'Assessments',
          icon: 'fas fa-clipboard-check',
          route: '/grade-submission',
          tooltip: 'Assessments',
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
