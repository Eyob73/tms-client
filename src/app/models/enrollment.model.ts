export interface Enrollment {
  id: string;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  isArchived: 'true' | 'false';
  enrolledAt: string;
}
