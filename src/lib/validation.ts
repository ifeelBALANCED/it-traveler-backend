import { t } from "elysia";

// Auth schemas
export const registerSchema = t.Object({
  name: t.String({ minLength: 2, maxLength: 50 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6, maxLength: 100 }),
  confirmPassword: t.String({ minLength: 6, maxLength: 100 }),
});

export const loginSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6, maxLength: 100 }),
});

// Marker schemas
export const createMarkerSchema = t.Object({
  description: t.Optional(t.String({ maxLength: 500 })),
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  title: t.String({ minLength: 1, maxLength: 100 }),
});

export const updateMarkerSchema = t.Object({
  description: t.Optional(t.String({ maxLength: 500 })),
  latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
  longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
  title: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
});

// Query schemas
export const paginationSchema = t.Object({
  limit: t.Optional(t.String()),
  page: t.Optional(t.String()),
});

export const markerQuerySchema = t.Object({
  latitude: t.Optional(
    t.String({ pattern: "^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?)$" })
  ),
  longitude: t.Optional(
    t.String({
      pattern: "^[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$",
    })
  ),
  radius: t.Optional(t.String()),
});

// Param schemas
export const idParamSchema = t.Object({
  id: t.String(),
});

export const updateProfileSchema = t.Object({
  avatar: t.Optional(t.String({ format: "uri" })),
  name: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
});

export const changePasswordSchema = t.Object({
  confirmPassword: t.String({ minLength: 6, maxLength: 100 }),
  currentPassword: t.String({ minLength: 1 }),
  newPassword: t.String({ minLength: 6, maxLength: 100 }),
});

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
