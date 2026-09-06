import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { Course } from '../../models/course.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'tms-course-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './course-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './course-card.component.scss',
})
export class CourseCardComponent {
  course = input.required<Course>();
  enrollClicked = output<Course>();

  readonly maxCapacityLimit = Number.MAX_SAFE_INTEGER;

  readonly isFull = computed(() => {
    const c = this.course();
    const capacity = c.maxCapacity ?? this.maxCapacityLimit;
    const enrolled = c.enrollmentCount ?? 0;
    return enrolled >= capacity;
  });

  readonly enrollmentText = computed(() => {
    const c = this.course();
    const capacity = c.maxCapacity;
    const enrolled = c.enrollmentCount ?? 0;
    return `Enrolled ${enrolled} of ${capacity ?? 'unlimited'} seats`;
  });
}
