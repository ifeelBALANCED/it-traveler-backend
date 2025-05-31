import { Elysia, t } from "elysia";
import { AuthService } from "../services/auth.service";
import { authMiddleware } from "../middleware/auth";

export const auth = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await AuthService.register(body);
        const token = await AuthService.generateToken(user.id);

        set.status = 201;
        return {
          success: true,
          data: {
            user,
            token,
          },
        };
      } catch (error) {
        set.status = 400;
        throw error;
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 50 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6, maxLength: 100 }),
        confirmPassword: t.String({ minLength: 6, maxLength: 100 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await AuthService.login(body);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        set.status = 401;
        throw error;
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .group("", (app) =>
    app
      .use(authMiddleware)
      .post("/logout", async (context) => {
        const { token } = context;
        await AuthService.logout(token);
        return {
          success: true,
          message: "Logged out successfully",
        };
      })
      .get("/me", async (context) => {
        const { userId } = context;
        const user = await AuthService.getUser(userId);

        if (!user) {
          throw new Error("User not found");
        }

        return {
          success: true,
          data: user,
        };
      })
  );
