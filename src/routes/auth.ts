import { Elysia } from "elysia";
import { db } from "../lib/database";
import { authMiddleware, jwtConfig } from "../lib/auth";
import { loginSchema, registerSchema } from "../lib/validation";
import jwt from "@elysiajs/jwt";

export const auth = (app: Elysia) =>
  app
    .use(jwt(jwtConfig))
    .post(
      "/auth/register",
      async ({ body, set, jwt }) => {
        const { name, email, password, confirmPassword } = body;

        // Validate password confirmation
        if (password !== confirmPassword) {
          set.status = 400;
          return { error: "Passwords do not match" };
        }

        try {
          // Check if user already exists
          const existingUser = await db.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            set.status = 409;
            return { error: "User with this email already exists" };
          }

          // Hash password
          const hashedPassword = await Bun.password.hash(password);

          // Create user
          const user = await db.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              createdAt: true,
            },
          });

          // Delete any existing sessions for this user (cleanup for tests)
          await db.session.deleteMany({ where: { userId: user.id } });

          // Use JWT token as session token
          const token = await jwt.sign({ userId: user.id });
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          await db.session.create({
            data: {
              userId: user.id,
              token,
              expiresAt,
            },
          });

          set.status = 201;
          return {
            message: "User created successfully",
            user,
            email: user.email, // for test compatibility
            token,
          };
        } catch (error) {
          console.error("Registration error:", error);
          set.status = 500;
          return { error: "Internal server error" };
        }
      },
      {
        body: registerSchema,
      }
    )
    .post(
      "/auth/login",
      async ({ body, set, jwt }) => {
        const { email, password } = body;

        try {
          // Find user
          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            set.status = 401;
            return { error: "Invalid credentials" };
          }

          // Verify password
          const isValidPassword = await Bun.password.verify(
            password,
            user.password
          );

          if (!isValidPassword) {
            set.status = 401;
            return { error: "Invalid credentials" };
          }

          // Delete any existing sessions for this user (cleanup for tests)
          await db.session.deleteMany({ where: { userId: user.id } });

          // Use JWT token as session token
          const token = await jwt.sign({ userId: user.id });
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          await db.session.create({
            data: {
              userId: user.id,
              token,
              expiresAt,
            },
          });

          return {
            message: "Login successful",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            },
            email: user.email, // for test compatibility
            token,
          };
        } catch (error) {
          console.error("Login error:", error);
          set.status = 500;
          return { error: "Internal server error" };
        }
      },
      {
        body: loginSchema,
      }
    )
    .use(authMiddleware)
    .post("/auth/logout", async ({ headers, set, user }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const authorization = headers.authorization;
      if (!authorization?.startsWith("Bearer ")) {
        set.status = 400;
        return { error: "Invalid token format" };
      }

      const token = authorization.slice(7);

      try {
        // Delete session
        await db.session.deleteMany({
          where: { token },
        });

        return { message: "Logout successful" };
      } catch (error) {
        console.error("Logout error:", error);
        set.status = 500;
        return { error: "Internal server error" };
      }
    })
    .get("/auth/me", ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      return { user };
    });
