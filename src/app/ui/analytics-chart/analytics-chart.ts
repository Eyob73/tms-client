import { Component, input } from '@angular/core';

@Component({
  selector: 'tms-analytics-chart',
  standalone: true,
  imports: [],
  templateUrl: './analytics-chart.html',
  styleUrls: ['./analytics-chart.scss'],
})
export class AnalyticsChart {
  data = input.required<any[]>();
}
