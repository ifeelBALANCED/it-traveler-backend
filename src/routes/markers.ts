import { Elysia, t } from "elysia";
import { db } from "../lib/db";
import { authMiddleware } from "../middleware/auth";

export const markers = new Elysia({ prefix: "/markers" })
  .get("/", async () => {
    const markers = await db.marker.findMany({
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
    });

    return {
      success: true,
      data: markers,
    };
  })
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const marker = await db.marker.findUnique({
        where: { id },
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
      });

      if (!marker) {
        set.status = 404;
        throw new Error("Marker not found");
      }

      return {
        success: true,
        data: marker,
      };
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  .group("", (app) =>
    app
      .use(authMiddleware)
      .post(
        "/",
        async (context) => {
          const { body, userId, set } = context;
          const marker = await db.marker.create({
            data: {
              ...body,
              userId,
            },
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
          });

          set.status = 201;
          return {
            success: true,
            data: marker,
          };
        },
        {
          body: t.Object({
            title: t.String({ minLength: 1, maxLength: 200 }),
            description: t.Optional(t.String({ maxLength: 1000 })),
            latitude: t.Number({ minimum: -90, maximum: 90 }),
            longitude: t.Number({ minimum: -180, maximum: 180 }),
            address: t.Optional(t.String({ maxLength: 500 })),
            imageUrl: t.Optional(t.String({ format: "uri" })),
          }),
        }
      )
      .get("/my/markers", async (context) => {
        const { userId } = context;
        const markers = await db.marker.findMany({
          where: { userId },
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
        });

        return {
          success: true,
          data: markers,
        };
      })
      .put(
        "/:id",
        async (context) => {
          const {
            params: { id },
            body,
            userId,
            set,
          } = context;
          // Check if marker exists and belongs to user
          const existingMarker = await db.marker.findUnique({
            where: { id },
          });

          if (!existingMarker) {
            set.status = 404;
            throw new Error("Marker not found");
          }

          if (existingMarker.userId !== userId) {
            set.status = 403;
            throw new Error("You don't have permission to update this marker");
          }

          const marker = await db.marker.update({
            where: { id },
            data: body,
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
          });

          return {
            success: true,
            data: marker,
          };
        },
        {
          params: t.Object({
            id: t.String({ minLength: 1 }),
          }),
          body: t.Object({
            title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
            description: t.Optional(t.String({ maxLength: 1000 })),
            latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
            longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
            address: t.Optional(t.String({ maxLength: 500 })),
            imageUrl: t.Optional(t.String({ format: "uri" })),
          }),
        }
      )
      .delete(
        "/:id",
        async (context) => {
          const {
            params: { id },
            userId,
            set,
          } = context;
          // Check if marker exists and belongs to user
          const existingMarker = await db.marker.findUnique({
            where: { id },
          });

          if (!existingMarker) {
            set.status = 404;
            throw new Error("Marker not found");
          }

          if (existingMarker.userId !== userId) {
            set.status = 403;
            throw new Error("You don't have permission to delete this marker");
          }

          await db.marker.delete({
            where: { id },
          });

          return {
            success: true,
            message: "Marker deleted successfully",
          };
        },
        {
          params: t.Object({
            id: t.String({ minLength: 1 }),
          }),
        }
      )
  );
