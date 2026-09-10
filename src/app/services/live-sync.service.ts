import { isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, PLATFORM_ID, signal, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { EnrollmentStatus } from '../models/enrollment.model';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';

export interface EnrollmentStatusEvent {
  id: string;
  status: EnrollmentStatus;
  studentId?: number;
  courseId?: number;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class LiveSyncService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);
  private connection: HubConnection | null = null;
  private readonly eventsSubject = new Subject<EnrollmentStatusEvent>();
  private readonly notificationSubject = new Subject<Notification>();

  // Expose events as observables
  readonly events$ = this.eventsSubject.asObservable();
  readonly notification$ = this.notificationSubject.asObservable();

  // Connection state signal for UI status feedback
  readonly connectionState = signal<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  connect(): void {
    if (this.connection) return;
    if (!isPlatformBrowser(this.platformId)) return;

    // Build connection outside NgZone to avoid triggering change detection on internal timers
    this.ngZone.runOutsideAngular(() => {
      this.connection = new HubConnectionBuilder()
        .withUrl(environment.signalrUrl, {
          accessTokenFactory: () => {
            const t = this.authService.getAccessToken();
            return t || '';
          }
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // Event 1: Status updated
      this.connection.on(
        'ReceiveEnrollmentStatusUpdated',
        (enrollmentId: string | number, status: EnrollmentStatus) => {
          this.ngZone.run(() => {
            this.eventsSubject.next({ id: enrollmentId.toString(), status });
          });
        },
      );

      // Event 2: Enrollment created
      this.connection.on(
        'ReceiveEnrollmentCreated',
        (enrollmentId: number, studentId: number, courseId: number, status: EnrollmentStatus) => {
          this.ngZone.run(() => {
            this.eventsSubject.next({
              id: enrollmentId.toString(),
              status: status || 'Pending',
              studentId,
              courseId,
            });
          });
        },
      );

      // Event 3: Enrollment approved
      this.connection.on('ReceiveEnrollmentApproved', (enrollmentId: number) => {
        this.ngZone.run(() => {
          this.eventsSubject.next({ id: enrollmentId.toString(), status: 'Approved' });
        });
      });

      // Event 4: Enrollment rejected
      this.connection.on('ReceiveEnrollmentRejected', (enrollmentId: number, reason?: string) => {
        this.ngZone.run(() => {
          this.eventsSubject.next({ id: enrollmentId.toString(), status: 'Rejected', reason });
        });
      });

      // Event 5: Enrollment cancelled
      this.connection.on('ReceiveEnrollmentCancelled', (enrollmentId: number) => {
        this.ngZone.run(() => {
          this.eventsSubject.next({ id: enrollmentId.toString(), status: 'Cancelled' });
        });
      });

      // Event 6: Real-time notification push
      this.connection.on('ReceiveNotification', (notification: Notification) => {
        this.ngZone.run(() => {
          this.notificationSubject.next(notification);
        });
      });

      this.connection.onreconnecting(() => {
        this.ngZone.run(() => this.connectionState.set('reconnecting'));
      });
      this.connection.onreconnected(() => {
        this.ngZone.run(() => this.connectionState.set('connected'));
      });
      this.connection.onclose(() => {
        this.ngZone.run(() => this.connectionState.set('disconnected'));
      });

      this.connection
        .start()
        .then(() => {
          this.ngZone.run(() => this.connectionState.set('connected'));
        })
        .catch((err) => console.error('SignalR connection error:', err));
    });
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
      this.connectionState.set('disconnected');
    }
  }
}
