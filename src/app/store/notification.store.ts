import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { NotificationService } from '../services/notification.service';
import { LiveSyncService } from '../services/live-sync.service';
import { Notification } from '../models/notification.model';
import { firstValueFrom } from 'rxjs';

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((
    store,
    notificationService = inject(NotificationService),
    liveSyncService = inject(LiveSyncService)
  ) => ({
    async loadInitial() {
      patchState(store, { loading: true, error: null });
      try {
        const notifications = await firstValueFrom(notificationService.getNotifications());
        const unreadCountRes = await firstValueFrom(notificationService.getUnreadCount());
        patchState(store, {
          notifications,
          unreadCount: unreadCountRes.count,
          loading: false,
        });
      } catch (err: any) {
        patchState(store, { loading: false, error: err.message || 'Failed to load notifications' });
      }
    },

    async markAllAsRead() {
      try {
        await firstValueFrom(notificationService.markAllAsRead());
        patchState(store, (state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      } catch (err: any) {
        console.error('Failed to mark all as read:', err);
      }
    },

    async markAsRead(id: number) {
      try {
        await firstValueFrom(notificationService.markAsRead(id));
        patchState(store, (state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications,
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      } catch (err: any) {
        console.error('Failed to mark as read:', err);
      }
    },

    addNotification(notification: Notification) {
      patchState(store, (state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      }));
    }
  })),
  withHooks({
    onInit(store) {
      const liveSyncService = inject(LiveSyncService);
      store.loadInitial();

      // Subscribe to real-time notification pushes
      liveSyncService.notification$.subscribe((notification) => {
        store.addNotification(notification);
      });
    },
  })
);
