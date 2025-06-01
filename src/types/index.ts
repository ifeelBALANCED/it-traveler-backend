import { Static, t } from 'elysia'

// Base response types
export const BaseResponse = t.Object({
  success: t.Boolean(),
})

export const ErrorResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
})

// User types
export const UserResponse = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  avatar: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

export const UserWithTokenResponse = t.Object({
  success: t.Boolean(),
  data: t.Object({
    user: UserResponse,
    token: t.String(),
  }),
})

export const UserDataResponse = t.Object({
  success: t.Boolean(),
  data: UserResponse,
})

export const UsersListResponse = t.Object({
  success: t.Boolean(),
  data: t.Array(UserResponse),
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  totalPages: t.Number(),
})

// Marker types
export const MarkerResponse = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  latitude: t.Number(),
  longitude: t.Number(),
  address: t.Union([t.String(), t.Null()]),
  imageUrl: t.Union([t.String(), t.Null()]),
  userId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  user: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    avatar: t.Union([t.String(), t.Null()]),
  }),
})

export const MarkerDataResponse = t.Object({
  success: t.Boolean(),
  data: MarkerResponse,
})

export const MarkersListResponse = t.Object({
  success: t.Boolean(),
  data: t.Array(MarkerResponse),
})

export const MarkersWithPaginationResponse = t.Object({
  success: t.Boolean(),
  data: t.Array(MarkerResponse),
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  totalPages: t.Number(),
})

// Auth response types
export const LoginResponse = t.Object({
  success: t.Boolean(),
  data: t.Object({
    user: UserResponse,
    token: t.String(),
  }),
})

export const MessageResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
})

export type UserWithoutPassword = Omit<Static<typeof UserResponse>, 'password'>

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface CreateMarkerRequest {
  title: string
  description?: string
  latitude: number
  longitude: number
  address?: string
  imageUrl?: string
}

export interface UpdateMarkerRequest {
  title?: string
  description?: string
  latitude?: number
  longitude?: number
  address?: string
  imageUrl?: string
}

export interface UpdateProfileRequest {
  name?: string
  avatar?: string
}

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface PaginationQuery {
  page?: string
  limit?: string
}

export interface AuthContext {
  userId: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
