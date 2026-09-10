export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string; // 'Enrollment' | 'Grade' | 'System' | 'Course'
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
