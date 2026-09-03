import { computed, inject } from '@angular/core';
import {
    signalStore,
    withComputed,
    withMethods,
    patchState,
    withState,
} from '@ngrx/signals';
import {
    withEntities,
    setAllEntities,
    addEntity,
    updateEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap, exhaustMap } from 'rxjs';
import { CourseService } from '../services/course';
import { Course, PagedResponse } from '../models/course.model';

export const CourseStore = signalStore(
    { providedIn: 'root' },
    withState({
        isLoading: false,
        error: null as string | null,
        totalCount: 0,
        pageIndex: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        search: '',
    }),
    withEntities<Course>(),
    withComputed((store) => ({
        courses: computed(() => store.entities()),
        totalCourses: computed(() => store.totalCount()),
        openCourses: computed(
            () => store.entities().filter((c) => c.enrollmentCount < c.maxCapacity).length
        ),
        fullCourses: computed(
            () => store.entities().filter((c) => c.enrollmentCount >= c.maxCapacity).length
        ),
        averageEnrollmentRate: computed(() => {
            const entities = store.entities();
            if (entities.length === 0) return 0;
            const total = entities.reduce(
                (sum, c) => sum + (c.maxCapacity > 0 ? (c.enrollmentCount / c.maxCapacity) * 100 : 0),
                0
            );
            return Math.round(total / entities.length);
        }),
    })),
    withMethods((store, api = inject(CourseService)) => ({
        loadCourses: rxMethod<{ pageIndex?: number; pageSize?: number; search?: string } | void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((params) => {
                    const query = params || {};
                    const reqPageIndex = query.pageIndex ?? store.pageIndex();
                    const reqPageSize = query.pageSize ?? store.pageSize();
                    const search = query.search ?? store.search();

                    return api.getAll(reqPageIndex, reqPageSize, search || undefined).pipe(
                        tap((res: PagedResponse<Course>) => {
                            patchState(
                                store,
                                setAllEntities(res.items || []),
                                {
                                    isLoading: false,
                                    totalCount: res.totalCount || 0,
                                    pageIndex: res.page || reqPageIndex,
                                    pageSize: res.pageSize || reqPageSize,
                                    totalPages: res.totalPages || 1,
                                    hasPreviousPage: res.hasPrevious || false,
                                    hasNextPage: res.hasNext || false,
                                    search,
                                }
                            );
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to load courses',
                            });
                            return EMPTY;
                        })
                    );
                })
            )
        ),

        createCourse: rxMethod<Partial<Course>>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap((payload) =>
                    api.create(payload).pipe(
                        tap((newCourse) => {
                            patchState(store, addEntity(newCourse), { isLoading: false });
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to create course',
                            });
                            return EMPTY;
                        })
                    )
                )
            )
        ),

        updateCourse: rxMethod<{ id: number; payload: Partial<Course> }>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap(({ id, payload }) =>
                    api.update(id, payload).pipe(
                        tap((updated) => {
                            patchState(store, updateEntity({ id, changes: updated }), { isLoading: false });
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to update course',
                            });
                            return EMPTY;
                        })
                    )
                )
            )
        ),

        deleteCourse: rxMethod<number>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap((id) =>
                    api.delete(id).pipe(
                        switchMap(() => {
                            const pageIndex =
                                store.entities().length <= 1 && store.pageIndex() > 1
                                    ? store.pageIndex() - 1
                                    : store.pageIndex();
                            return api.getAll(pageIndex, store.pageSize(), store.search() || undefined).pipe(
                                tap((res: PagedResponse<Course>) => {
                                    patchState(store, setAllEntities(res.items || []), {
                                        isLoading: false,
                                        totalCount: res.totalCount || 0,
                                        pageIndex: res.page || pageIndex,
                                        pageSize: res.pageSize || store.pageSize(),
                                        totalPages: res.totalPages || 1,
                                        hasPreviousPage: res.hasPrevious || false,
                                        hasNextPage: res.hasNext || false,
                                    });
                                })
                            );
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to delete course',
                            });
                            return EMPTY;
                        })
                    )
                )
            )
        ),
    }))
);
