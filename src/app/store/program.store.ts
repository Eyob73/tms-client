import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, pipe, switchMap, tap } from 'rxjs';
import { Program, ProgramService } from '../services/program';

export const ProgramStore = signalStore(
  { providedIn: 'root' },
  withState({
    isLoading: false,
    error: null as string | null,
    activeDepartmentId: null as string | null,
  }),
  withEntities<Program>(),
  withMethods((store, api = inject(ProgramService)) => ({
    setDepartment(departmentId: string | null) {
      patchState(store, { activeDepartmentId: departmentId });
      if (!departmentId) {
        patchState(store, setAllEntities([] as Program[]), { activeDepartmentId: null });
        return;
      }

      api
        .getByDepartment(departmentId)
        .pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          tap((programs) => {
            patchState(store, setAllEntities(programs as Program[]), {
              isLoading: false,
              activeDepartmentId: departmentId,
            });
          }),
          catchError((err) => {
            patchState(store, {
              isLoading: false,
              error: err?.message || 'Failed to load programs',
              activeDepartmentId: departmentId,
            });
            return EMPTY;
          }),
        )
        .subscribe();
    },

    loadProgramsForDepartment: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((departmentId) =>
          api.getByDepartment(departmentId).pipe(
            tap((programs) => {
              patchState(store, setAllEntities(programs as Program[]), {
                isLoading: false,
                activeDepartmentId: departmentId,
              });
            }),
            catchError((err) => {
              patchState(store, {
                isLoading: false,
                error: err?.message || 'Failed to load programs',
                activeDepartmentId: departmentId,
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    loadAllPrograms: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          api.getAll().pipe(
            tap((programs) => {
              patchState(store, setAllEntities(programs as Program[]), { isLoading: false });
            }),
            catchError((err) => {
              patchState(store, {
                isLoading: false,
                error: err?.message || 'Failed to load all programs',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
