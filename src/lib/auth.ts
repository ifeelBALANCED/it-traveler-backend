import { db } from "./database";
import { jwt } from "@elysiajs/jwt";
import type { Elysia } from "elysia";
import { compare, hash } from "bcryptjs";

const jwtConfig = {
  name: "jwt",
  secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
};

// Simple auth middleware that adds user to context
const authMiddleware = (app: Elysia) =>
  app.use(jwt(jwtConfig)).derive(async ({ jwt, headers }) => {
    const authorization = headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return { user: undefined };
    }

    const token = authorization.slice(7);

    try {
      const payload = await jwt.verify(token);

      if (!payload || "object" !== typeof payload || !payload.userId) {
        return { user: undefined };
      }

      const user = await db.user.findUnique({
        where: { id: payload.userId.toString() },
        select: {
          avatar: true,
          email: true,
          id: true,
          name: true,
        },
      });

      if (!user) {
        return { user: undefined };
      }

      // Check valid session
      const validSession = await db.session.findFirst({
        where: {
          expiresAt: { gt: new Date() },
          token,
          userId: user.id,
        },
      });

      if (!validSession) {
        return { user: undefined };
      }

      return { user };
    } catch {
      return { user: undefined };
    }
  });

// Require auth middleware that checks if user exists
const requireAuth = (app: Elysia) =>
  app.use(jwt(jwtConfig)).derive(async ({ jwt, headers, set }) => {
    const authorization = headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authorization.slice(7);

    try {
      const payload = await jwt.verify(token);

      if (!payload || "object" !== typeof payload || !payload.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const user = await db.user.findUnique({
        where: { id: payload.userId.toString() },
        select: {
          avatar: true,
          email: true,
          id: true,
          name: true,
        },
      });

      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      // Check valid session
      const validSession = await db.session.findFirst({
        where: {
          expiresAt: { gt: new Date() },
          token,
          userId: user.id,
        },
      });

      if (!validSession) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      return { user };
    } catch {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });

const hashPassword = (password: string) => hash(password, 10);
const comparePassword = (password: string, hash: string) =>
  compare(password, hash);

// JWT helper functions (not used in the plugin, but kept for compatibility)
const signToken = (_payload: object, _secret: string) => {
  // This is just for compatibility, not used in the actual auth flow
  return "";
};

const verifyToken = (_token: string, _secret: string) => {
  // This is just for compatibility, not used in the actual auth flow
  return {};
};

export {
  authMiddleware,
  comparePassword,
  hashPassword,
  jwtConfig,
  requireAuth,
  signToken,
  verifyToken,
  jwt,
};
