import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { withEntities, setAllEntities, updateEntity, addEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, concatMap, tap, catchError, EMPTY, switchMap } from 'rxjs';
import { EnrollmentService } from '../services/enrollment';
import { Enrollment } from '../models/enrollment.model';
import { LiveSyncService } from '../services/live-sync.service';

export const EnrollmentStore = signalStore(
  { providedIn: 'root' },
  withState({ isLoading: false, error: null as string | null }),
  withEntities<Enrollment>(),
  withComputed((store) => ({
    pendingCount: computed(() => store.entities().filter((e) => e.status === 'Pending').length),
    approvedCount: computed(() => store.entities().filter((e) => e.status === 'Approved').length),
    rejectedCount: computed(() => store.entities().filter((e) => e.status === 'Rejected').length),
  })),
  withMethods((store, api = inject(EnrollmentService), sync = inject(LiveSyncService)) => ({
    listenForLiveUpdates: rxMethod<void>(
      pipe(
        tap(() => sync.connect()),
        switchMap(() => sync.events$),
        tap((event) => {
          const existing = store.entityMap()[event.id];
          if (existing) {
            patchState(store, updateEntity({
              id: event.id,
              changes: {
                status: event.status,
                rejectionReason: event.reason ?? existing.rejectionReason,
              },
            }));
          }
        }),
      ),
    ),

    loadEnrollments: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        concatMap(() =>
          api.getAll().pipe(
            tap((rows) => patchState(store, setAllEntities(rows), { isLoading: false })),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    approveEnrollment: rxMethod<string>(
      pipe(
        tap((id) => {
          patchState(store, updateEntity({ id, changes: { status: 'Approved' } }));
        }),
        concatMap((id) =>
          api.approveEnrollment(id).pipe(
            catchError((err) => {
              patchState(store, updateEntity({ id, changes: { status: 'Pending' } }));
              patchState(store, {
                error: err.error?.detail || 'Server rejected the approval. Check enrollment constraints.',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    rejectEnrollment: rxMethod<{ id: string; reason?: string }>(
      pipe(
        tap(({ id, reason }) => {
          patchState(store, updateEntity({ id, changes: { status: 'Rejected', rejectionReason: reason } }));
        }),
        concatMap(({ id, reason }) =>
          api.rejectEnrollment(id, reason).pipe(
            catchError((err) => {
              patchState(store, updateEntity({ id, changes: { status: 'Pending' } }));
              patchState(store, {
                error: err.error?.detail || 'Server rejected the operation.',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    archiveEnrollment: rxMethod<string>(
      pipe(
        tap((id) => {
          patchState(store, updateEntity({ id, changes: { status: 'Archived', isArchived: true } }));
        }),
        concatMap((id) =>
          api.archiveEnrollment(id).pipe(
            catchError((err) => {
              patchState(store, {
                error: err.error?.detail || 'Failed to archive enrollment.',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
