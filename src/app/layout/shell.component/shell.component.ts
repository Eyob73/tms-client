import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
  isCollapsed = false;

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
          route: '/programs',
          tooltip: 'Training Programs',
        },
        { label: 'Courses', icon: 'fas fa-book-open', route: '/courses', tooltip: 'Courses' },
        {
          label: 'Schedule',
          icon: 'fas fa-calendar-alt',
          route: '/schedule',
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
          route: '/instructors',
          tooltip: 'Instructors',
        },
        { label: 'Trainees', icon: 'fas fa-users', route: '/trainees', tooltip: 'Trainees' },
        {
          label: 'Assessments',
          icon: 'fas fa-clipboard-check',
          route: '/assessments',
          tooltip: 'Assessments',
        },
        {
          label: 'Certifications',
          icon: 'fas fa-certificate',
          route: '/certifications',
          tooltip: 'Certifications',
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Reports', icon: 'fas fa-chart-bar', route: '/reports', tooltip: 'Reports' },
        {
          label: 'Compliance',
          icon: 'fas fa-shield-alt',
          route: '/compliance',
          tooltip: 'Compliance',
        },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', icon: 'fas fa-cog', route: '/settings', tooltip: 'Settings' },
        {
          label: 'Help & Support',
          icon: 'fas fa-question-circle',
          route: '/help',
          tooltip: 'Help & Support',
        },
      ],
    },
  ];

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
