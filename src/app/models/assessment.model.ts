export interface AssessmentDto {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  title: string;
  description?: string;
  assessmentType: string;
  totalMarks: number;
  weightPercentage: number;
  assessmentDate: string;
  startDate?: string;
  dueDate?: string;
  isPublished: boolean;
  isActive: boolean;
}

export interface CreateAssessmentDto {
  courseId: number;
  title: string;
  description?: string;
  assessmentType: string | number;
  totalMarks: number;
  weightPercentage: number;
  assessmentDate: string;
  startDate?: string;
  dueDate?: string;
  isPublished: boolean;
}

export interface UpdateAssessmentDto extends CreateAssessmentDto {}

export interface AssessmentResultDto {
  id: number;
  assessmentId: number;
  studentId: number;
  studentName: string;
  registrationNumber: string;
  marksObtained: number;
  percentage: number;
  grade?: string;
  status: string;
  feedback?: string;
}

export interface BulkMarksEntryDto {
  studentId: number;
  marksObtained: number;
  feedback?: string;
}

export interface BulkMarksEntryRequest {
  marks: BulkMarksEntryDto[];
}

export interface AssessmentStatisticsDto {
  totalStudents: number;
  gradedCount: number;
  pendingCount: number;
  averageMark: number;
  highestMark: number;
  lowestMark: number;
  passRate: number;
}
