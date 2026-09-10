import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Course } from '../../../models/course.model';
import { CourseService } from '../../../services/course';
import { CourseStore } from '../../../store/course.store';
import { DepartmentStore } from '../../../store/department.store';
import { ProgramStore } from '../../../store/program.store';

const nonEmptyString = (value: string | null | undefined): string => value?.trim() ?? '';
const optionalGuid = (value: string | null | undefined): string | undefined => {
  const normalized = nonEmptyString(value);
  return normalized ? normalized : undefined;
};

function selfPrerequisiteValidator(currentCourseId: number | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || !currentCourseId) {
      return null;
    }

    return Number(value) === Number(currentCourseId) ? { selfPrerequisite: true } : null;
  };
}

@Component({
  selector: 'app-add-course',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-course.component.html',
  styleUrl: './add-course.component.scss',
})
export class AddCourseComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);
  private readonly courseStore = inject(CourseStore);
  private readonly departmentStore = inject(DepartmentStore);
  private readonly programStore = inject(ProgramStore);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly isLoading = signal(false);
  readonly statusMessage = signal<string | null>(null);
  readonly statusType = signal<'success' | 'error'>('success');
  readonly courseId = signal<number | null>(null);
  readonly courseOptions = computed(() => this.courseStore.courses());
  readonly departmentOptions = computed(() =>
    this.departmentStore.entities().map((department) => ({
      id: department.id,
      label: department.name,
    })),
  );
  readonly courseTypeOptions = ['Core', 'Elective', 'Practical', 'Training'];
  readonly levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
  readonly statusOptions = ['Active', 'Inactive', 'Archived'];

  readonly form = this.fb.group({
    courseCode: [
      '',
      [Validators.required, Validators.maxLength(20), Validators.pattern('^[A-Z]{2,4}\\d{3,4}$')],
    ],
    courseName: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    credits: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    courseType: ['Core', [Validators.required, Validators.maxLength(30)]],
    level: ['Beginner', [Validators.maxLength(30)]],
    departmentId: [null as string | null, [Validators.required]],
    programId: [null as string | null],
    prerequisiteCourseId: [null as string | null, selfPrerequisiteValidator(null)],
    durationHours: [1, [Validators.min(1), Validators.max(500)]],
    status: ['Active', [Validators.required, Validators.maxLength(20)]],
    isPublished: [true],
  });

  readonly selectedDepartmentId = toSignal(this.form.get('departmentId')!.valueChanges, {
    initialValue: this.form.get('departmentId')!.value
  });

  readonly filteredPrograms = computed(() => {
    const departmentId = this.selectedDepartmentId();
    if (!departmentId) return [];
    
    return this.programStore.entities()
      .filter((program) => program.departmentId === departmentId)
      .map((program) => ({
        id: program.id,
        label: program.name,
      }));
  });

  readonly availablePrerequisites = computed(() => {
    const currentId = this.courseId();
    return this.courseOptions().filter((course) => Number(course.id) !== Number(currentId));
  });

  constructor() {
    this.departmentStore.loadDepartments();
    this.programStore.loadAllPrograms();
    this.loadCourses();

    this.route.paramMap.subscribe((params) => {
      const rawId = params.get('id');
      const id = rawId ? Number(rawId) : null;

      if (id) {
        this.isEditMode.set(true);
        this.courseId.set(id);
        this.loadCourseById(id);
        return;
      }

      this.route.queryParamMap.subscribe((queryParams) => {
        const editId = queryParams.get('editId');
        const parsedEditId = editId ? Number(editId) : null;

        if (parsedEditId) {
          this.isEditMode.set(true);
          this.courseId.set(parsedEditId);
          this.loadCourseById(parsedEditId);
          return;
        }

        this.isEditMode.set(false);
        this.courseId.set(null);
        this.form.get('prerequisiteCourseId')?.setValidators(selfPrerequisiteValidator(null));
      });
    });

    this.form.get('departmentId')?.valueChanges.subscribe((value) => {
      const programControl = this.form.get('programId');
      if (!value || !String(value).trim()) {
        programControl?.reset(null);
        return;
      }
      const isValid = this.programStore.entities().some(
        p => p.departmentId === value && p.id === programControl?.value
      );
      if (!isValid) {
        programControl?.reset(null);
      }
    });

    this.form.get('prerequisiteCourseId')?.valueChanges.subscribe((value) => {
      const currentId = this.courseId();
      const control = this.form.get('prerequisiteCourseId');
      control?.setValidators(selfPrerequisiteValidator(currentId));
      control?.updateValueAndValidity();
    });
  }

  private loadCourses(): void {
    this.courseStore.loadCourses({ pageIndex: 1, pageSize: 200 });
    const currentId = this.courseId();
    const control = this.form.get('prerequisiteCourseId');
    control?.setValidators(selfPrerequisiteValidator(currentId));
    control?.updateValueAndValidity();
  }

  private loadCourseById(courseId: number): void {
    const storedCourse = this.courseStore.courses().find((course) => course.id === courseId);
    if (storedCourse) {
      this.applyCourseToForm(storedCourse);
      return;
    }

    this.isLoading.set(true);
    this.courseService
      .getById(courseId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (course) => {
          this.applyCourseToForm(course);
        },
        error: () => {
          this.statusType.set('error');
          this.statusMessage.set('Unable to load the selected course. Please try again.');
        },
      });
  }

  private applyCourseToForm(course: Course): void {
    const formValue = {
      courseCode: course.courseCode ?? '',
      courseName: course.courseName ?? '',
      description: course.description ?? '',
      credits: course.credits ?? 0,
      courseType: course.courseType ?? '',
      level: course.level ?? 'Beginner',
      departmentId: course.departmentId ?? null,
      programId: course.programId ?? null,
      prerequisiteCourseId: course.prerequisiteCourseId ?? null,
      durationHours: course.durationHours ?? 0,
      status: course.status ?? 'Active',
      isPublished: !!course.isPublished,
    };

    this.form.patchValue(formValue);
    this.form.get('prerequisiteCourseId')?.setValidators(selfPrerequisiteValidator(course.id));
    this.form.get('prerequisiteCourseId')?.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.statusType.set('error');
      this.statusMessage.set('Please correct the highlighted fields before submitting.');
      return;
    }

    const payload: Partial<Course> = {
      courseCode: nonEmptyString(this.form.get('courseCode')?.value).toUpperCase(),
      courseName: nonEmptyString(this.form.get('courseName')?.value),
      description: nonEmptyString(this.form.get('description')?.value) || undefined,
      credits: Number(this.form.get('credits')?.value ?? 0),
      courseType: nonEmptyString(this.form.get('courseType')?.value),
      level: nonEmptyString(this.form.get('level')?.value) || undefined,
      departmentId: optionalGuid(this.form.get('departmentId')?.value),
      programId: optionalGuid(this.form.get('programId')?.value),
      prerequisiteCourseId: optionalGuid(this.form.get('prerequisiteCourseId')?.value),
      durationHours: Number(this.form.get('durationHours')?.value ?? 0),
      status: nonEmptyString(this.form.get('status')?.value),
      isPublished: !!this.form.get('isPublished')?.value,
    };

    this.isSubmitting.set(true);
    this.statusMessage.set(null);

    if (this.isEditMode() && this.courseId()) {
      this.courseStore.updateCourse({ id: this.courseId()!, payload });
      this.statusType.set('success');
      this.statusMessage.set('Course updated successfully.');
      this.isSubmitting.set(false);
      void this.router.navigate(['/courses']);
      return;
    }

    this.courseStore.createCourse(payload);
    this.statusType.set('success');
    this.statusMessage.set('Course created successfully.');
    this.isSubmitting.set(false);
    void this.router.navigate(['/courses']);
  }

  cancel(): void {
    void this.router.navigate(['/courses']);
  }
}
