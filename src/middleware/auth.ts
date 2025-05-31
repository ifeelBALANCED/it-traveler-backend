import { Elysia } from "elysia";
import { AuthService } from "../services/auth.service";

export const authMiddleware = (app: Elysia) =>
  app.derive(async ({ headers, set }) => {
    const authorization = headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Unauthorized");
    }

    const token = authorization.slice(7);
    const userId = await AuthService.verifyToken(token);

    if (!userId) {
      set.status = 401;
      throw new Error("Invalid or expired token");
    }

    return {
      userId,
      token,
    };
  });
