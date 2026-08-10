import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EnrollmentStore } from '../../store/enrollment.store';
import { AnalyticsChart } from '../../ui/analytics-chart/analytics-chart';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [AnalyticsChart],
  templateUrl: './instructor-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./instructor-dashboard.scss'],
})
export class InstructorDashboard {
  store = inject(EnrollmentStore);
}
