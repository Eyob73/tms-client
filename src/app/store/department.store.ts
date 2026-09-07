import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, pipe, switchMap, tap } from 'rxjs';
import { Department, DepartmentService } from '../services/department';

export const DepartmentStore = signalStore(
  { providedIn: 'root' },
  withState({
    isLoading: false,
    error: null as string | null,
  }),
  withEntities<Department>(),
  withMethods((store, api = inject(DepartmentService)) => ({
    loadDepartments: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          api.getAll().pipe(
            tap((departments) => {
              patchState(store, setAllEntities(departments as Department[]), { isLoading: false });
            }),
            catchError((err) => {
              patchState(store, {
                isLoading: false,
                error: err?.message || 'Failed to load departments',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
