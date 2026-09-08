export type EnrollmentStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed'
  | 'Archived';

export interface Enrollment {
  id: string;
  studentId: number;
  studentName?: string;
  courseId: number;
  courseCode?: string;
  courseName: string;
  status: EnrollmentStatus;
  enrollmentDate?: string;
  enrolledAt: string;
  approvedDate?: string | null;
  approvedBy?: string | null;
  rejectedDate?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  cancellationDate?: string | null;
  cancelledBy?: string | null;
  completionDate?: string | null;
  isArchived: boolean | 'true' | 'false';
  grade?: number | null;
}

export interface StudentDetailInfo {
  id: number;
  registrationNumber: string;
  name: string;
  email?: string;
  gpa: number;
  isActive: boolean;
}

export interface CourseDetailInfo {
  id: number;
  courseCode: string;
  courseName: string;
  description?: string;
  credits: number;
  departmentName?: string;
  programName?: string;
  level?: string;
  semester?: string;
  courseType: string;
  durationHours?: number;
  status: string;
  maxCapacity?: number;
  enrolledCount: number;
  availableSeats?: number;
  instructorId?: string;
}

export interface EnrollmentDetails {
  id: number;
  status: EnrollmentStatus;
  enrollmentDate: string;
  approvedDate?: string | null;
  approvedBy?: string | null;
  rejectedDate?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  cancellationDate?: string | null;
  cancelledBy?: string | null;
  completionDate?: string | null;
  isArchived: boolean;
  grade?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  student: StudentDetailInfo;
  course: CourseDetailInfo;
}

export interface AvailableCourse {
  id: number;
  courseCode: string;
  courseName: string;
  description?: string;
  credits: number;
  departmentName?: string;
  programName?: string;
  level?: string;
  semester?: string;
  courseType: string;
  durationHours?: number;
  instructorId?: string;
  maxCapacity?: number;
  enrolledCount: number;
  availableSeats?: number;
  isEnrollmentOpen: boolean;
  enrollmentStartDate?: string | null;
  enrollmentEndDate?: string | null;
  availabilityStatus: 'Available' | 'Almost Full' | 'Full' | 'Closed';
  studentEnrollmentStatus?: string | null;
  canEnroll: boolean;
}

export interface EnrollmentFilterRequest {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  courseId?: number;
  studentId?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  descending?: boolean;
  includeArchived?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateEnrollmentPayload {
  courseId: number;
}

export interface RejectEnrollmentPayload {
  reason?: string;
}
