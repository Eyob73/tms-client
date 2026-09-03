import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CourseService } from '../../services/course';

@Component({
  selector: 'app-admin-course-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-course-list.component.html',
  styleUrl: './admin-course-list.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminCourseListComponent {
  private courseService = inject(CourseService);

  coursesResource = rxResource({
    stream: () => this.courseService.getAll().pipe(map((res) => res.items)),
  });

  readonly courses = computed(() => this.coursesResource.value() ?? []);
  readonly totalCourses = computed(() => this.courses().length);
  readonly openCourses = computed(
    () => this.courses().filter((course) => course.enrollmentCount < course.maxCapacity).length,
  );
  readonly fullCourses = computed(
    () => this.courses().filter((course) => course.enrollmentCount >= course.maxCapacity).length,
  );
}
