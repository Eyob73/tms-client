// These are the Angular functions we need. signal() and computed() come from Angular's core.
import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CourseCardComponent } from '../../ui/course-card/course-card.component';
import { Course } from '../../models/course.model';
import { EnrollmentFormComponent } from '../enrollment-form/enrollment-form';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { resource } from '@angular/core';
import { CourseService } from '../../services/course';
import { map } from 'rxjs/operators';

// The @Component decorator tells Angular: "This class is a visual component."
// It is metadata it describes how this class connects to the HTML template.
@Component({
  selector: 'app-student-dashboard', // The HTML tag name: <app-student- dashboard />
  standalone: true, // This component manages its own imports (no NgModule)
  imports: [CourseCardComponent, RouterLink], // This tells Angular: "I use CourseCardComponent in my template"
  templateUrl: './student-dashboard.component.html', // Points to the HTML file
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './student-dashboard.component.scss', // Points to the styles file
})
export class StudentDashboardComponent {
  // signal<Course | null>(null) means: "This signal holds either a Course or nothing."
  // The | null syntax is TypeScript's way of saying a value can be absent.
  selectedCourse = signal<Course | null>(null);

  handleEnroll(course: Course) {
    this.selectedCourse.set(course);
    console.log('Enrollment requested for:', course.title);
  }

  private api = inject(CourseService);
  // signal('Liya Kebede') creates a reactive variable. Angular watchesit.
  // When its value changes, Angular automatically updates the part ofthe screen that displays it.
  studentName = signal('Liya Kebede');
  earnedCredits = signal(45);
  // computed() creates a read-only signal that derives its value fromother signals.
  // It recalculates automatically whenever earnedCredits() changes nomanual refresh.
  graduationStatus = computed(() =>
    this.earnedCredits() >= 120 ? 'Eligible for Graduation' : 'In Progress',
  );

  // rxResource wraps the HTTP call into three managed signals:
  // - coursesResource.isLoading() → true while waiting for the serverresponse
  // - coursesResource.error() → the error object if the request fails
  // - coursesResource.value() → the Course[] array when the requestsucceeds
  //
  // It handles subscribing (starting the request) and unsubscribing(cleaning up
  // if the user navigates away before the response arrives) automatically.
  // You never write .subscribe() or .unsubscribe() with rxResource.

  coursesResource = rxResource({
    stream: () => this.api.getAll().pipe(map((res) => res.items)),
  });

  // A regular method. When called, it updates the earnedCredits signal.
  // The .update() method receives the current value (c) and returns the new value(c + 3).
  registerForClass() {
    this.earnedCredits.update((c) => c + 3);
  }
}
