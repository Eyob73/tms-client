export interface User {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  department?: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserQueryParameters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean | null;
  orderBy?: string;
  descending?: boolean;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  department?: string | null;
  password: string;
  roles?: string[] | null;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  department?: string | null;
  isActive?: boolean;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  instructorCount: number;
  studentCount: number;
}
