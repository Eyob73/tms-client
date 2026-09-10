import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  inject,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Chart, registerables } from 'chart.js';
import { CourseStore } from '../../store/course.store';
import { Course } from '../../models/course.model';
import { AuthService } from '../../services/auth.service';
import { UserStore } from '../../store/user.store';
import { EnrollmentStore } from '../../store/enrollment.store';
import { Enrollment } from '../../models/enrollment.model';

Chart.register(...registerables);

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
  readonly userStore = inject(UserStore);
  readonly enrollmentStore = inject(EnrollmentStore);

  @ViewChild('progressCanvas') progressCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  private progressChartInstance?: Chart;
  private categoryChartInstance?: Chart;

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

  // Real Stats computed from Stores
  stats = computed(() => {
    const enrollments = this.enrollmentStore.entities();
    const completedCount = enrollments.filter(e => e.status === 'Completed').length;
    const approvedCount = enrollments.filter(e => e.status === 'Approved').length;
    // Total active/approved enrollments
    const activeEnrollments = approvedCount; 
    const totalForRate = approvedCount + completedCount;
    const completionRate = totalForRate > 0 ? Math.round((completedCount / totalForRate) * 100) : 0;
    
    return {
      totalCourses: this.courseStore.totalCount(),
      activeLearners: this.userStore.stats().studentCount || 0,
      totalEnrollments: activeEnrollments,
      completionRate: completionRate,
    };
  });

  recentActivities = computed(() => {
    const enrollments = [...this.enrollmentStore.entities()];
    // Sort descending by enrolledAt
    enrollments.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
    return enrollments.map(e => {
      let icon = 'person_add';
      let iconBg = 'rgba(59,130,246,0.1)';
      let iconColor = '#3b82f6';
      let actionText = 'enrolled in a course';

      if (e.status === 'Completed') {
        icon = 'check_circle';
        iconBg = 'rgba(16,185,129,0.1)';
        iconColor = '#10b981';
        actionText = 'completed a course';
      } else if (e.status === 'Rejected') {
        icon = 'cancel';
        iconBg = 'rgba(239,68,68,0.1)';
        iconColor = '#ef4444';
        actionText = 'was rejected from a course';
      } else if (e.status === 'Approved') {
        icon = 'verified';
        iconBg = 'rgba(16,185,129,0.1)';
        iconColor = '#10b981';
        actionText = 'was approved for a course';
      }

      return {
        icon,
        iconBg,
        iconColor,
        text: `<strong>${e.studentName || 'A student'}</strong> ${actionText}`,
        time: new Date(e.enrolledAt).toLocaleDateString()
      };
    });
  });

  filteredCourses = computed(() => {
    const enrollments = this.enrollmentStore.entities();
    const approvedCounts = enrollments.reduce((acc, e) => {
      if (e.status === 'Approved') {
        acc[e.courseId] = (acc[e.courseId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string | number, number>);

    return this.courseStore.entities().filter((course) => {
      const matchesFilter = this.activeFilter === 'all' || course.status?.toLowerCase() === this.activeFilter;
      const matchesSearch =
        !this.searchQuery ||
        course.courseName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.courseType?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    }).map(c => ({
      ...c,
      displayEnrollmentCount: approvedCounts[c.id] || 0
    }));
  });

  // Keep static arrays for bottom sections empty to comply with "Remove all mock data"
  upcomingTrainings: UpcomingTrainingItem[] = [];
  topPerformers: PerformerItem[] = [];
  certifications: CertificationItem[] = [];
  
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

  constructor() {
    effect(() => {
      const courses = this.courseStore.entities();
      const enrollments = this.enrollmentStore.entities();
      if (this.currentPage === 'dashboard') {
        setTimeout(() => this.initCharts(courses, enrollments), 100);
      }
    });
  }

  ngOnInit(): void {
    this.generateCalendar();
    this.userStore.loadStats();
    this.courseStore.loadCourses({ pageSize: 100 });
    this.enrollmentStore.loadEnrollments();
  }

  ngAfterViewInit(): void {
    this.initCharts(this.courseStore.entities(), this.enrollmentStore.entities());
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
      setTimeout(() => this.initCharts(this.courseStore.entities(), this.enrollmentStore.entities()), 100);
    }
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  private readonly router = inject(Router);

  createTraining(): void {
    this.router.navigate(['/programs']);
  }

  showNotifications(): void {
    console.log('Open Notifications');
  }

  showProfile(): void {
    console.log('Open Profile');
  }

  private initCharts(courses: Course[], enrollments: Enrollment[]): void {
    if (this.currentPage !== 'dashboard') return;

    if (this.progressCanvas && this.progressCanvas.nativeElement) {
      if (this.progressChartInstance) this.progressChartInstance.destroy();

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const last6Months: { label: string, month: number, year: number, enrolled: number, completed: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
           label: monthNames[d.getMonth()],
           month: d.getMonth(),
           year: d.getFullYear(),
           enrolled: 0,
           completed: 0
        });
      }

      enrollments.forEach(e => {
        // Only count active/approved and completed towards 'enrolled' to keep it consistent
        const isApprovedOrCompleted = e.status === 'Approved' || e.status === 'Completed';
        if (!isApprovedOrCompleted) return;

        const dateStr = e.enrollmentDate || e.enrolledAt;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
             const match = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
             if (match) {
               match.enrolled++;
             }
          }
        }
        
        if (e.status === 'Completed') {
           const cDateStr = e.completionDate || dateStr;
           if (cDateStr) {
             const c = new Date(cDateStr);
             if (!isNaN(c.getTime())) {
               const matchC = last6Months.find(m => m.month === c.getMonth() && m.year === c.getFullYear());
               if (matchC) {
                 matchC.completed++;
               }
             }
           }
        }
      });

      const displayLabels = last6Months.map(m => m.label);
      const displayEnrolled = last6Months.map(m => m.enrolled);
      const displayCompleted = last6Months.map(m => m.completed);

      this.progressChartInstance = new Chart(this.progressCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: displayLabels,
          datasets: [
            {
              label: 'Enrolled',
              data: displayEnrolled,
              backgroundColor: 'rgba(59,130,246,0.8)',
              borderRadius: 6,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.7,
            },
            {
              label: 'Completed',
              data: displayCompleted,
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
              suggestedMax: 10
            },
          },
        },
      });
    }

    if (this.categoryCanvas && this.categoryCanvas.nativeElement) {
      if (this.categoryChartInstance) this.categoryChartInstance.destroy();

      const categoryCounts: Record<string, number> = {};
      courses.forEach(c => {
         const cat = c.courseType || 'Other';
         categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const labels = Object.keys(categoryCounts);
      const data = Object.values(categoryCounts);
      const bgColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#6366f1'];

      this.categoryChartInstance = new Chart(this.categoryCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No Courses'],
          datasets: [
            {
              data: data.length ? data : [1],
              backgroundColor: labels.length ? bgColors.slice(0, labels.length) : ['#e5e7eb'],
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
  }
}

