import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Chart, registerables } from 'chart.js';
import { CourseStore } from '../../store/course.store';
import { Course } from '../../models/course.model';
import { AuthService } from '../../services/auth.service';

Chart.register(...registerables);

export interface CourseItem {
  name: string;
  category: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  status: 'active' | 'upcoming' | 'completed' | 'overdue';
  statusLabel: string;
  progress: number;
  progressColor: string;
  enrolled: number;
  capacity: number;
  dueDate: string;
  trainer: string;
}

export interface ActivityItem {
  icon: string;
  iconBg: string;
  iconColor: string;
  text: string;
  time: string;
}

export interface UpcomingTrainingItem {
  day: string;
  month: string;
  title: string;
  time: string;
  trainer: string;
  avatars: Array<{ initials: string; color: string }>;
}

export interface PerformerItem {
  name: string;
  department: string;
  initials: string;
  color: string;
  score: number;
}

export interface CertificationItem {
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  expiry: string;
  status: string;
  chipClass: string;
}

export interface CalendarCell {
  day: number;
  otherMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
}

@Component({
  selector: 'app-tms-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSidenavModule,
  ],
  templateUrl: './tms-dashboard.component.html',
  styleUrl: './tms-dashboard.component.scss',
})
export class TmsDashboardComponent implements OnInit, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  readonly courseStore = inject(CourseStore);

  @ViewChild('progressCanvas') progressCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('skillsCanvas') skillsCanvas!: ElementRef<HTMLCanvasElement>;

  private progressChartInstance?: Chart;
  private categoryChartInstance?: Chart;
  private skillsChartInstance?: Chart;

  currentPage = 'dashboard';
  sidebarOpen = false;
  showCreateDialog = false;
  activeFilter = 'all';
  searchQuery = '';

  get welcomeName(): string {
    const user = this.authService.currentUser();
    const displayName = user?.displayName?.trim();
    if (!displayName) {
      return 'User';
    }

    return displayName.split(/\s+/)[0] || 'User';
  }

  pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    courses: 'Courses',
    schedule: 'Schedule',
    trainers: 'Trainers',
    employees: 'Employees',
    certifications: 'Certifications',
    assessments: 'Assessments',
    reports: 'Reports & Analytics',
    settings: 'Settings',
    help: 'Help & Support',
  };

  stats = {
    totalCourses: 24,
    totalEmployees: 156,
    certifications: 89,
    completionRate: 87,
  };

  courses: CourseItem[] = [
    {
      name: 'Cybersecurity Fundamentals',
      category: 'IT & Security',
      icon: 'security',
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: '#3b82f6',
      status: 'active',
      statusLabel: 'Active',
      progress: 72,
      progressColor: '#3b82f6',
      enrolled: 45,
      capacity: 50,
      dueDate: 'Sep 15, 2026',
      trainer: 'Sarah Miller',
    },
    {
      name: 'Leadership Excellence',
      category: 'Management',
      icon: 'emoji_events',
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#f59e0b',
      status: 'active',
      statusLabel: 'Active',
      progress: 58,
      progressColor: '#f59e0b',
      enrolled: 32,
      capacity: 40,
      dueDate: 'Sep 22, 2026',
      trainer: 'Robert Chen',
    },
    {
      name: 'Data Analytics with Python',
      category: 'Technical',
      icon: 'analytics',
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#10b981',
      status: 'upcoming',
      statusLabel: 'Upcoming',
      progress: 15,
      progressColor: '#10b981',
      enrolled: 28,
      capacity: 35,
      dueDate: 'Oct 01, 2026',
      trainer: 'Emily Watson',
    },
    {
      name: 'Workplace Safety Standards',
      category: 'Compliance',
      icon: 'health_and_safety',
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#ef4444',
      status: 'overdue',
      statusLabel: 'Overdue',
      progress: 34,
      progressColor: '#ef4444',
      enrolled: 60,
      capacity: 60,
      dueDate: 'Aug 30, 2026',
      trainer: 'Mike Johnson',
    },
    {
      name: 'Project Management Pro',
      category: 'Management',
      icon: 'assignment',
      iconBg: 'rgba(139,92,246,0.1)',
      iconColor: '#8b5cf6',
      status: 'completed',
      statusLabel: 'Completed',
      progress: 100,
      progressColor: '#8b5cf6',
      enrolled: 38,
      capacity: 40,
      dueDate: 'Aug 15, 2026',
      trainer: 'Lisa Park',
    },
    {
      name: 'Cloud Architecture (AWS)',
      category: 'Technical',
      icon: 'cloud',
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: '#3b82f6',
      status: 'active',
      statusLabel: 'Active',
      progress: 45,
      progressColor: '#3b82f6',
      enrolled: 22,
      capacity: 30,
      dueDate: 'Oct 10, 2026',
      trainer: 'David Kim',
    },
    {
      name: 'Effective Communication',
      category: 'Soft Skills',
      icon: 'forum',
      iconBg: 'rgba(236,72,153,0.1)',
      iconColor: '#ec4899',
      status: 'upcoming',
      statusLabel: 'Upcoming',
      progress: 0,
      progressColor: '#ec4899',
      enrolled: 18,
      capacity: 25,
      dueDate: 'Oct 15, 2026',
      trainer: 'Anna Lee',
    },
    {
      name: 'Agile Methodology',
      category: 'Technical',
      icon: 'speed',
      iconBg: 'rgba(20,184,166,0.1)',
      iconColor: '#14b8a6',
      status: 'completed',
      statusLabel: 'Completed',
      progress: 100,
      progressColor: '#14b8a6',
      enrolled: 50,
      capacity: 50,
      dueDate: 'Jul 30, 2026',
      trainer: 'Tom Harris',
    },
  ];

  allCourses: CourseItem[] = [];

  activities: ActivityItem[] = [
    {
      icon: 'check_circle',
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#10b981',
      text: '<strong>Sarah Miller</strong> completed <strong>Cybersecurity Module 3</strong>',
      time: '5 minutes ago',
    },
    {
      icon: 'person_add',
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: '#3b82f6',
      text: '<strong>12 employees</strong> enrolled in <strong>Data Analytics</strong>',
      time: '1 hour ago',
    },
    {
      icon: 'workspace_premium',
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#f59e0b',
      text: '<strong>Robert Chen</strong> earned <strong>Leadership Certificate</strong>',
      time: '2 hours ago',
    },
    {
      icon: 'warning',
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#ef4444',
      text: '<strong>Workplace Safety</strong> training is overdue for 8 employees',
      time: '3 hours ago',
    },
    {
      icon: 'event',
      iconBg: 'rgba(139,92,246,0.1)',
      iconColor: '#8b5cf6',
      text: 'New session scheduled: <strong>Agile Workshop</strong> on Sep 10',
      time: '5 hours ago',
    },
    {
      icon: 'quiz',
      iconBg: 'rgba(20,184,166,0.1)',
      iconColor: '#14b8a6',
      text: '<strong>Emily Watson</strong> created a new assessment for Python course',
      time: 'Yesterday',
    },
    {
      icon: 'trending_up',
      iconBg: 'rgba(99,102,241,0.1)',
      iconColor: '#6366f1',
      text: 'Team completion rate increased by <strong>5%</strong> this week',
      time: 'Yesterday',
    },
  ];

  upcomingTrainings: UpcomingTrainingItem[] = [
    {
      day: '04',
      month: 'Sep',
      title: 'Cloud Architecture Lab',
      time: '10:00 AM - 12:00 PM',
      trainer: 'David Kim',
      avatars: [
        { initials: 'DK', color: '#3b82f6' },
        { initials: 'SM', color: '#10b981' },
        { initials: 'RC', color: '#f59e0b' },
      ],
    },
    {
      day: '05',
      month: 'Sep',
      title: 'Leadership Workshop',
      time: '2:00 PM - 4:00 PM',
      trainer: 'Robert Chen',
      avatars: [
        { initials: 'RC', color: '#f59e0b' },
        { initials: 'LP', color: '#8b5cf6' },
      ],
    },
    {
      day: '08',
      month: 'Sep',
      title: 'Safety Compliance Review',
      time: '9:00 AM - 10:30 AM',
      trainer: 'Mike Johnson',
      avatars: [
        { initials: 'MJ', color: '#ef4444' },
        { initials: 'TH', color: '#14b8a6' },
        { initials: 'AL', color: '#ec4899' },
        { initials: '+5', color: '#6b7280' },
      ],
    },
    {
      day: '10',
      month: 'Sep',
      title: 'Python Data Analysis',
      time: '11:00 AM - 1:00 PM',
      trainer: 'Emily Watson',
      avatars: [
        { initials: 'EW', color: '#10b981' },
        { initials: 'DK', color: '#3b82f6' },
      ],
    },
    {
      day: '12',
      month: 'Sep',
      title: 'Communication Skills',
      time: '3:00 PM - 5:00 PM',
      trainer: 'Anna Lee',
      avatars: [
        { initials: 'AL', color: '#ec4899' },
        { initials: 'KW', color: '#f43f5e' },
        { initials: 'JW', color: '#6366f1' },
      ],
    },
  ];

  topPerformers: PerformerItem[] = [
    {
      name: 'Sarah Miller',
      department: 'Engineering',
      initials: 'SM',
      color: '#3b82f6',
      score: 98,
    },
    { name: 'David Kim', department: 'IT Operations', initials: 'DK', color: '#10b981', score: 95 },
    {
      name: 'Emily Watson',
      department: 'Data Science',
      initials: 'EW',
      color: '#8b5cf6',
      score: 93,
    },
    { name: 'Robert Chen', department: 'Management', initials: 'RC', color: '#f59e0b', score: 91 },
    { name: 'Lisa Park', department: 'Project Mgmt', initials: 'LP', color: '#ec4899', score: 89 },
  ];

  certifications: CertificationItem[] = [
    {
      name: 'OSHA Safety Certificate',
      icon: 'health_and_safety',
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#ef4444',
      expiry: 'Sep 15, 2026',
      status: 'Expiring',
      chipClass: 'chip-red',
    },
    {
      name: 'PMP Certification',
      icon: 'assignment',
      iconBg: 'rgba(139,92,246,0.1)',
      iconColor: '#8b5cf6',
      expiry: 'Dec 01, 2026',
      status: 'Valid',
      chipClass: 'chip-green',
    },
    {
      name: 'AWS Solutions Architect',
      icon: 'cloud',
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: '#3b82f6',
      expiry: 'Oct 20, 2026',
      status: 'Valid',
      chipClass: 'chip-blue',
    },
    {
      name: 'First Aid Training',
      icon: 'medical_services',
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#f59e0b',
      expiry: 'Aug 28, 2026',
      status: 'Expired',
      chipClass: 'chip-red',
    },
    {
      name: 'ISO 27001 Lead Auditor',
      icon: 'verified',
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#10b981',
      expiry: 'Mar 15, 2027',
      status: 'Valid',
      chipClass: 'chip-green',
    },
  ];

  calendarDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  calendarCells: CalendarCell[] = [];

  newTraining = {
    title: '',
    category: '',
    startDate: '',
    endDate: '',
    trainer: '',
    capacity: 30,
    description: '',
  };

  ngOnInit(): void {
    this.allCourses = [
      ...this.courses,
      {
        name: 'Financial Reporting',
        category: 'Finance',
        icon: 'account_balance',
        iconBg: 'rgba(99,102,241,0.1)',
        iconColor: '#6366f1',
        status: 'active',
        statusLabel: 'Active',
        progress: 62,
        progressColor: '#6366f1',
        enrolled: 35,
        capacity: 40,
        dueDate: 'Sep 28, 2026',
        trainer: 'James Wilson',
      },
      {
        name: 'Customer Service Mastery',
        category: 'Soft Skills',
        icon: 'support_agent',
        iconBg: 'rgba(244,63,94,0.1)',
        iconColor: '#f43f5e',
        status: 'active',
        statusLabel: 'Active',
        progress: 81,
        progressColor: '#f43f5e',
        enrolled: 42,
        capacity: 45,
        dueDate: 'Sep 18, 2026',
        trainer: 'Karen White',
      },
    ];

    this.generateCalendar();
    this.courseStore.loadCourses({ pageSize: 50 });
  }

  ngAfterViewInit(): void {
    this.initCharts();
  }

  generateCalendar(): void {
    const cells: CalendarCell[] = [];
    const startDay = 2; // September 2026 starts on Tuesday
    const daysInMonth = 30;
    const prevMonthDays = 31;

    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, otherMonth: true, isToday: false, hasEvent: false });
    }

    const today = 3;
    const eventDays = [4, 5, 8, 10, 12, 15, 18, 22, 25];
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        otherMonth: false,
        isToday: d === today,
        hasEvent: eventDays.includes(d),
      });
    }

    const remaining = 42 - cells.length;
    for (let n = 1; n <= remaining; n++) {
      cells.push({ day: n, otherMonth: true, isToday: false, hasEvent: false });
    }

    this.calendarCells = cells;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setPage(page: string): void {
    this.currentPage = page;
    this.sidebarOpen = false;
    if (page === 'dashboard') {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  get filteredCourses(): CourseItem[] {
    return this.courses.filter((course) => {
      const matchesFilter = this.activeFilter === 'all' || course.status === this.activeFilter;
      const matchesSearch =
        !this.searchQuery ||
        course.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.trainer.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }

  createTraining(): void {
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  saveTraining(): void {
    if (this.newTraining.title) {
      const newItem: CourseItem = {
        name: this.newTraining.title,
        category: this.newTraining.category || 'General',
        icon: 'menu_book',
        iconBg: 'rgba(26,35,126,0.1)',
        iconColor: '#1a237e',
        status: 'upcoming',
        statusLabel: 'Upcoming',
        progress: 0,
        progressColor: '#1a237e',
        enrolled: 0,
        capacity: this.newTraining.capacity || 30,
        dueDate: 'TBD',
        trainer: this.newTraining.trainer || 'TBD',
      };
      this.courses.unshift(newItem);
      this.allCourses.unshift(newItem);
      this.stats.totalCourses++;

      this.closeCreateDialog();
      this.newTraining = {
        title: '',
        category: '',
        startDate: '',
        endDate: '',
        trainer: '',
        capacity: 30,
        description: '',
      };
    }
  }

  showNotifications(): void {
    console.log('Open Notifications');
  }

  showProfile(): void {
    console.log('Open Profile');
  }

  private initCharts(): void {
    if (this.currentPage !== 'dashboard') return;

    if (this.progressCanvas && this.progressCanvas.nativeElement) {
      if (this.progressChartInstance) this.progressChartInstance.destroy();

      this.progressChartInstance = new Chart(this.progressCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          datasets: [
            {
              label: 'Enrolled',
              data: [45, 52, 38, 65, 48, 72, 58, 80, 68],
              backgroundColor: 'rgba(59,130,246,0.8)',
              borderRadius: 6,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.7,
            },
            {
              label: 'Completed',
              data: [38, 45, 32, 55, 42, 65, 50, 72, 58],
              backgroundColor: 'rgba(16,185,129,0.8)',
              borderRadius: 6,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: { size: 12, weight: 600 },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 12 } },
            },
            y: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { size: 12 } },
              beginAtZero: true,
            },
          },
        },
      });
    }

    if (this.categoryCanvas && this.categoryCanvas.nativeElement) {
      if (this.categoryChartInstance) this.categoryChartInstance.destroy();

      this.categoryChartInstance = new Chart(this.categoryCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Technical', 'Compliance', 'Leadership', 'Soft Skills', 'Safety'],
          datasets: [
            {
              data: [35, 25, 18, 12, 10],
              backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'],
              borderWidth: 0,
              spacing: 4,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                font: { size: 12, weight: 500 },
              },
            },
          },
        },
      });
    }

    if (this.skillsCanvas && this.skillsCanvas.nativeElement) {
      if (this.skillsChartInstance) this.skillsChartInstance.destroy();

      this.skillsChartInstance = new Chart(this.skillsCanvas.nativeElement, {
        type: 'radar',
        data: {
          labels: [
            'Technical',
            'Communication',
            'Leadership',
            'Problem Solving',
            'Teamwork',
            'Innovation',
          ],
          datasets: [
            {
              label: 'Required Level',
              data: [90, 85, 80, 85, 90, 75],
              backgroundColor: 'rgba(59,130,246,0.1)',
              borderColor: '#3b82f6',
              borderWidth: 2,
              pointBackgroundColor: '#3b82f6',
              pointRadius: 4,
            },
            {
              label: 'Current Level',
              data: [72, 78, 65, 70, 82, 60],
              backgroundColor: 'rgba(16,185,129,0.1)',
              borderColor: '#10b981',
              borderWidth: 2,
              pointBackgroundColor: '#10b981',
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: { size: 12, weight: 600 },
              },
            },
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 20, font: { size: 10 } },
              grid: { color: 'rgba(0,0,0,0.06)' },
              pointLabels: { font: { size: 11, weight: 500 } },
            },
          },
        },
      });
    }
  }
}
