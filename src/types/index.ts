import { User } from "@prisma/client";

export type UserWithoutPassword = Omit<User, "password">;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateMarkerRequest {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
}

export interface UpdateMarkerRequest {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  imageUrl?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface AuthContext {
  userId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
