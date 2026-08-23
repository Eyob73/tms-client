import { isPlatformBrowser } from '@angular/common';
import { Service, PLATFORM_ID, signal, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../environments/environment';

export interface EnrollmentStatusEvent {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}
@Service()
export class LiveSyncService {
  private platformId = inject(PLATFORM_ID);
  private connection: HubConnection | null = null;
  private eventsSubject = new Subject<EnrollmentStatusEvent>();
  // Expose events as an observable — the store will subscribe to this
  events$ = this.eventsSubject.asObservable();
  // Connection state signal for UI status feedback
  connectionState = signal<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  connect() {
    // Guard against duplicate connections if called more than once
    if (this.connection) return;
    // SignalR uses WebSocket which only exists in browsers, not on theNode.js server.
    // If SSR is enabled (Extension 1), this method runs during server render — skip it.
    if (!isPlatformBrowser(this.platformId)) return;
    // Use the actual backend SignalR endpoint instead of the Angular dev-server origin.
    // The browser was negotiating against http://localhost:4200/hubs/tms, which caused the 404.
    this.connection = new HubConnectionBuilder()
      .withUrl(environment.signalrUrl)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();
    // The event name matches the ITmsHubClient method you just addedon the backend.
    // SignalR strongly-typed hubs send the method name as the eventname automatically.
    this.connection.on(
      'ReceiveEnrollmentStatusUpdated',
      (enrollmentId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
        this.eventsSubject.next({ id: enrollmentId, status });
      },
    );
    this.connection.onreconnecting(() => this.connectionState.set('reconnecting'));
    this.connection.onreconnected(() => this.connectionState.set('connected'));
    this.connection.onclose(() => this.connectionState.set('disconnected'));
    this.connection
      .start()
      .then(() => this.connectionState.set('connected'))
      .catch((err) => console.error('SignalR connection error:', err));
  }
}
