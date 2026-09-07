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
  updateEntity,
  removeEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap } from 'rxjs';
import { UserService } from '../services/user.service';
import {
  User,
  UserQueryParameters,
  CreateUserRequest,
  UpdateUserRequest,
  UserStats,
} from '../models/user.model';
import { PagedResponse } from '../models/course.model';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState({
    isLoading: false,
    isSubmitting: false,
    error: null as string | null,
    totalCount: 0,
    pageIndex: 0, // 0-based for MatPaginator
    pageSize: 10,
    search: '',
    roleFilter: 'all',
    statusFilter: 'all' as 'all' | 'active' | 'inactive',
    selectedUser: null as User | null,
    availableRoles: [] as string[],
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      instructorCount: 0,
      studentCount: 0,
    } as UserStats,
  }),
  withEntities<User>(),
  withComputed((store) => ({
    users: computed(() => store.entities()),
    hasActiveFilters: computed(
      () =>
        !!store.search().trim() ||
        store.roleFilter() !== 'all' ||
        store.statusFilter() !== 'all'
    ),
  })),
  withMethods((store, userService = inject(UserService)) => ({
    loadUsers: rxMethod<{
      pageIndex?: number;
      pageSize?: number;
      search?: string;
      role?: string;
      status?: 'all' | 'active' | 'inactive';
    } | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((params) => {
          const reqPageIndex = params?.pageIndex ?? store.pageIndex();
          const reqPageSize = params?.pageSize ?? store.pageSize();
          const search = params?.search !== undefined ? params.search : store.search();
          const role = params?.role !== undefined ? params.role : store.roleFilter();
          const status = params?.status !== undefined ? params.status : store.statusFilter();

          const query: UserQueryParameters = {
            page: reqPageIndex + 1, // Backend is 1-indexed
            pageSize: reqPageSize,
            search: search || undefined,
            role: role !== 'all' ? role : undefined,
            isActive: status === 'all' ? null : status === 'active',
          };

          return userService.getUsers(query).pipe(
            tap((res: PagedResponse<User>) => {
              patchState(
                store,
                setAllEntities(res.items || []),
                {
                  isLoading: false,
                  totalCount: res.totalCount || 0,
                  pageIndex: reqPageIndex,
                  pageSize: reqPageSize,
                  search,
                  roleFilter: role,
                  statusFilter: status,
                }
              );
            }),
            catchError((err) => {
              const message = err.error?.detail || err.message || 'Failed to load users';
              patchState(store, {
                isLoading: false,
                error: message,
              });
              return EMPTY;
            })
          );
        })
      )
    ),

    loadStats: rxMethod<void>(
      pipe(
        switchMap(() =>
          userService.getUserStats().pipe(
            tap((stats: UserStats) => {
              patchState(store, { stats });
            }),
            catchError(() => EMPTY)
          )
        )
      )
    ),

    loadAvailableRoles: rxMethod<void>(
      pipe(
        switchMap(() =>
          userService.getAvailableRoles().pipe(
            tap((availableRoles: string[]) => {
              patchState(store, { availableRoles });
            }),
            catchError(() => EMPTY)
          )
        )
      )
    ),

    loadUserById: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((id) =>
          userService.getUserById(id).pipe(
            tap((user: User) => {
              patchState(store, { selectedUser: user, isLoading: false });
            }),
            catchError((err) => {
              const message = err.error?.detail || err.message || 'Failed to load user details';
              patchState(store, { isLoading: false, error: message });
              return EMPTY;
            })
          )
        )
      )
    ),

    clearSelectedUser(): void {
      patchState(store, { selectedUser: null });
    },

    clearFilters(): void {
      patchState(store, {
        search: '',
        roleFilter: 'all',
        statusFilter: 'all',
        pageIndex: 0,
      });
    },

    updateLocalUser(user: User): void {
      patchState(store, updateEntity({ id: user.id, changes: user }));
      if (store.selectedUser()?.id === user.id) {
        patchState(store, { selectedUser: user });
      }
    },

    removeLocalUser(id: string): void {
      patchState(store, removeEntity(id), {
        totalCount: Math.max(0, store.totalCount() - 1),
      });
      if (store.selectedUser()?.id === id) {
        patchState(store, { selectedUser: null });
      }
    },
  }))
);
