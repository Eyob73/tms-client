import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, signal, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { EnrollmentStatus } from '../models/enrollment.model';

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
  private connection: HubConnection | null = null;
  private readonly eventsSubject = new Subject<EnrollmentStatusEvent>();

  // Expose events as an observable
  readonly events$ = this.eventsSubject.asObservable();

  // Connection state signal for UI status feedback
  readonly connectionState = signal<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  connect(): void {
    if (this.connection) return;
    if (!isPlatformBrowser(this.platformId)) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(environment.signalrUrl)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    // Event 1: Status updated
    this.connection.on(
      'ReceiveEnrollmentStatusUpdated',
      (enrollmentId: string | number, status: EnrollmentStatus) => {
        this.eventsSubject.next({ id: enrollmentId.toString(), status });
      },
    );

    // Event 2: Enrollment created
    this.connection.on(
      'ReceiveEnrollmentCreated',
      (enrollmentId: number, studentId: number, courseId: number, status: EnrollmentStatus) => {
        this.eventsSubject.next({
          id: enrollmentId.toString(),
          status: status || 'Pending',
          studentId,
          courseId,
        });
      },
    );

    // Event 3: Enrollment approved
    this.connection.on('ReceiveEnrollmentApproved', (enrollmentId: number) => {
      this.eventsSubject.next({ id: enrollmentId.toString(), status: 'Approved' });
    });

    // Event 4: Enrollment rejected
    this.connection.on('ReceiveEnrollmentRejected', (enrollmentId: number, reason?: string) => {
      this.eventsSubject.next({ id: enrollmentId.toString(), status: 'Rejected', reason });
    });

    // Event 5: Enrollment cancelled
    this.connection.on('ReceiveEnrollmentCancelled', (enrollmentId: number) => {
      this.eventsSubject.next({ id: enrollmentId.toString(), status: 'Cancelled' });
    });

    this.connection.onreconnecting(() => this.connectionState.set('reconnecting'));
    this.connection.onreconnected(() => this.connectionState.set('connected'));
    this.connection.onclose(() => this.connectionState.set('disconnected'));

    this.connection
      .start()
      .then(() => this.connectionState.set('connected'))
      .catch((err) => console.error('SignalR connection error:', err));
  }
}
