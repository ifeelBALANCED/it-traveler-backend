import { Elysia } from "elysia";
import { db } from "../lib/database";
import { requireAuth } from "../lib/auth";
import {
  updateProfileSchema,
  changePasswordSchema,
  paginationSchema,
  idParamSchema,
} from "../lib/validation";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

interface UserContext {
  user: { id: string; name: string; email: string; avatar: string };
}

interface SetContext {
  set: {
    status: number;
  };
}

export const users = (app: Elysia) => {
  // Public endpoints
  app.get("/users", async ({ query }) => {
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(
      parseInt(query.limit as string) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      }),
      db.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  });

  app.get("/users/:id", async ({ params: { id }, set }) => {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    return user;
  });

  app.get("/users/:id/markers", async ({ params: { id }, query, set }) => {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(
      parseInt(query.limit as string) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );
    const skip = (page - 1) * limit;

    const [markers, total] = await Promise.all([
      db.marker.findMany({
        where: { userId: id },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
      db.marker.count({ where: { userId: id } }),
    ]);

    return {
      markers: markers.map((marker) => ({
        ...marker,
        latitude: marker.latitude,
        longitude: marker.longitude,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  });

  // Protected endpoints
  app
    .use(requireAuth)
    .get("/users/me", async (ctx: UserContext) => {
      const { user } = ctx;
      if (!user) {
        return { error: "Unauthorized" };
      }
      return user;
    })
    .put(
      "/users/me",
      async (ctx: UserContext & SetContext & { body: unknown }) => {
        const { user, body, set } = ctx;
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        try {
          const updatedUser = await db.user.update({
            where: { id: user.id },
            data: {
              name: (body as any).name,
              avatar: (body as any).avatar,
            },
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          });
          return updatedUser;
        } catch (error) {
          set.status = 500;
          return { error: "Failed to update profile" };
        }
      },
      {
        body: updateProfileSchema,
      }
    )
    .put(
      "/users/me/password",
      async (ctx: UserContext & SetContext & { body: unknown }) => {
        const { user, body, set } = ctx;
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const dbUser = await db.user.findUnique({ where: { id: user.id } });
        if (!dbUser) {
          set.status = 404;
          return { error: "User not found" };
        }
        const isValid = await Bun.password.verify(
          (body as any).currentPassword,
          dbUser.password
        );
        if (!isValid) {
          set.status = 400;
          return { error: "Current password is incorrect" };
        }
        if ((body as any).newPassword !== (body as any).confirmPassword) {
          set.status = 400;
          return { error: "New passwords do not match" };
        }
        try {
          await db.user.update({
            where: { id: user.id },
            data: {
              password: await Bun.password.hash((body as any).newPassword),
            },
          });
          return { message: "Password updated successfully" };
        } catch (error) {
          set.status = 500;
          return { error: "Failed to update password" };
        }
      },
      {
        body: changePasswordSchema,
      }
    )
    .delete("/users/me", async (ctx: UserContext & SetContext) => {
      const { user, set } = ctx;
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      try {
        await db.user.delete({ where: { id: user.id } });
        set.status = 200;
        return { message: "User deleted successfully" };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to delete user" };
      }
    });

  return app;
};
