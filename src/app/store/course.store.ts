import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { withEntities, setAllEntities, updateEntity, removeEntity } from '@ngrx/signals/entities';
import { Course } from '../models/course.model';
import { pipe, concatMap, tap, catchError, EMPTY, switchMap } from 'rxjs';
import { CourseService } from '../services/course';

export const CourseStore = signalStore(
  { providedIn: 'root' },
  withEntities<Course>(),
  withState({ error: null as string | null }),
  withMethods((store, svc = inject(CourseService)) => ({
    deleteCourse(id: number) {
      // 1. Take snapshot of current entities BEFORE mutating localstate
      const previousSnapshot = store.entities();
      // 2. Instant visual feedback — remove entity immediately fromlocal UI
      patchState(store, removeEntity(id));
      // 3. Dispatch API call to backend server
      svc
        .delete(id)
        .pipe(
          catchError((err) => {
            // 4. Server rejected request — restore previous snapshotand set error message
            patchState(store, setAllEntities(previousSnapshot));
            patchState(store, {
              error: 'Cannot delete course: active student enrollmentsexist.',
            });
            return EMPTY;
          }),
        )
        .subscribe();
    },
  })),
);
