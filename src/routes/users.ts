import { Elysia, t } from "elysia";
import { db } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { AuthService } from "../services/auth.service";
import * as bcrypt from "bcryptjs";
import {
  UsersListResponse,
  UserDataResponse,
  MarkersWithPaginationResponse,
  MessageResponse,
  ErrorResponse,
} from "../types";

export const users = new Elysia({ prefix: "/users" })
  .get(
    "/",
    async ({ query }) => {
      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "10");
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
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        db.user.count(),
      ]);

      return {
        success: true,
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String({ pattern: "^[1-9]\\d*$" })),
        limit: t.Optional(t.String({ pattern: "^(?:[1-9]|[1-9]\\d|100)$" })),
      }),
      response: {
        200: UsersListResponse,
      },
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }

      return {
        success: true,
        data: user,
      };
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      response: {
        200: UserDataResponse,
        404: ErrorResponse,
      },
    }
  )
  .get(
    "/:id/markers",
    async ({ params: { id }, query, set }) => {
      const userExists = await db.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!userExists) {
        set.status = 404;
        throw new Error("User not found");
      }

      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "10");
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
          orderBy: { createdAt: "desc" },
        }),
        db.marker.count({ where: { userId: id } }),
      ]);

      return {
        success: true,
        data: markers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      query: t.Object({
        page: t.Optional(t.String({ pattern: "^[1-9]\\d*$" })),
        limit: t.Optional(t.String({ pattern: "^(?:[1-9]|[1-9]\\d|100)$" })),
      }),
      response: {
        200: MarkersWithPaginationResponse,
        404: ErrorResponse,
      },
    }
  )
  .group("", (app) =>
    app
      .use(authMiddleware)
      .put(
        "/profile",
        async (context) => {
          const { body, userId } = context;
          const user = await db.user.update({
            where: { id: userId },
            data: body,
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return {
            success: true,
            data: user,
          };
        },
        {
          body: t.Object({
            name: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
            avatar: t.Optional(t.String({ format: "uri" })),
          }),
          response: {
            200: UserDataResponse,
            404: ErrorResponse,
          },
        }
      )
      .put(
        "/password",
        async (context) => {
          const { body, userId, set } = context;
          const user = await db.user.findUnique({
            where: { id: userId },
          });

          if (!user) {
            set.status = 404;
            throw new Error("User not found");
          }

          const isValidPassword = await bcrypt.compare(
            body.currentPassword,
            user.password
          );
          if (!isValidPassword) {
            set.status = 400;
            throw new Error("Current password is incorrect");
          }

          if (body.newPassword !== body.confirmPassword) {
            set.status = 400;
            throw new Error("New passwords do not match");
          }

          const hashedPassword = await AuthService.hashPassword(
            body.newPassword
          );
          await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
          });

          return {
            success: true,
            message: "Password updated successfully",
          };
        },
        {
          body: t.Object({
            currentPassword: t.String({ minLength: 1 }),
            newPassword: t.String({ minLength: 6, maxLength: 100 }),
            confirmPassword: t.String({ minLength: 6, maxLength: 100 }),
          }),
          response: {
            200: MessageResponse,
            400: ErrorResponse,
            404: ErrorResponse,
          },
        }
      )
      .delete(
        "/account",
        async (context) => {
          const { userId } = context;

          await db.session.deleteMany({
            where: { userId },
          });

          await db.user.delete({
            where: { id: userId },
          });

          return {
            success: true,
            message: "Account deleted successfully",
          };
        },
        {
          response: {
            200: MessageResponse,
          },
        }
      )
  );
