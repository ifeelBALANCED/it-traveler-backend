import { Elysia } from "elysia";
import { db } from "../lib/database";
import { requireAuth } from "../lib/auth";
import {
  createMarkerSchema,
  updateMarkerSchema,
  paginationSchema,
  markerQuerySchema,
  idParamSchema,
} from "../lib/validation";
import { jwtConfig } from "../lib/auth";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;
const KM_TO_DEGREE = 111; // 1 degree of latitude is approximately 111 km
const DEGREES_IN_CIRCLE = 360;

interface WhereClause {
  latitude?: { gte: number; lte: number };
  longitude?: { gte: number; lte: number };
  userId?: string;
}

interface UserContext {
  user: { id: string; name: string; email: string; avatar: string };
}

interface SetContext {
  set: {
    status: number;
  };
}

export const markers = (app: Elysia) => {
  // Public endpoints
  app.get("/markers", async ({ query }) => {
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(
      parseInt(query.limit as string) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );
    const skip = (page - 1) * limit;

    const where: WhereClause = {};

    if (query.lat && query.lng && query.radius) {
      const lat = parseFloat(query.lat as string);
      const lng = parseFloat(query.lng as string);
      const radius = parseFloat(query.radius as string);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
        const latDelta = radius / KM_TO_DEGREE;
        const lngDelta =
          radius / (KM_TO_DEGREE * Math.cos((lat * Math.PI) / 180));

        where.latitude = {
          gte: lat - latDelta,
          lte: lat + latDelta,
        };
        where.longitude = {
          gte: lng - lngDelta,
          lte: lng + lngDelta,
        };
      }
    }

    const [markers, total] = await Promise.all([
      db.marker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      db.marker.count({ where }),
    ]);

    return {
      markers,
      pagination: {
        page,
        limit,
        total,
      },
    };
  });

  app.get(
    "/markers/:id",
    async ({
      params: { id },
      set,
    }: SetContext & { params: { id: string } }) => {
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
        return { error: "Marker not found" };
      }
      return marker;
    }
  );

  // Protected endpoints
  app
    .use(requireAuth)
    .post(
      "/markers",
      async (ctx: UserContext & SetContext & { body: unknown }) => {
        const { user, body, set } = ctx;
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        try {
          const createdMarker = await db.marker.create({
            data: {
              title: (body as any).title,
              description: (body as any).description,
              latitude: (body as any).latitude,
              longitude: (body as any).longitude,
              address: (body as any).address,
              imageUrl: (body as any).imageUrl,
              userId: user.id,
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
          return { marker: createdMarker };
        } catch {
          set.status = 500;
          return { error: "Failed to create marker" };
        }
      },
      {
        body: createMarkerSchema,
      }
    )
    .put(
      "/markers/:id",
      async (
        ctx: UserContext &
          SetContext & { params: { id: string }; body: unknown }
      ) => {
        const {
          user,
          params: { id },
          body,
          set,
        } = ctx;
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const marker = await db.marker.findUnique({ where: { id } });
        if (!marker) {
          set.status = 404;
          return { error: "Marker not found" };
        }
        if (marker.userId !== user.id) {
          set.status = 403;
          return { error: "Forbidden" };
        }
        try {
          const updatedMarker = await db.marker.update({
            where: { id },
            data: {
              title: (body as any).title,
              description: (body as any).description,
              latitude: (body as any).latitude,
              longitude: (body as any).longitude,
              address: (body as any).address,
              imageUrl: (body as any).imageUrl,
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
          return { marker: updatedMarker };
        } catch {
          set.status = 500;
          return { error: "Failed to update marker" };
        }
      },
      {
        params: idParamSchema,
        body: updateMarkerSchema,
      }
    )
    .get(
      "/markers/me",
      async (ctx: UserContext & SetContext & { query: unknown }) => {
        const { user, query, set } = ctx;
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const page = parseInt((query as any).page as string) || 1;
        const limit = Math.min(
          parseInt((query as any).limit as string) || DEFAULT_PAGE_SIZE,
          MAX_PAGE_SIZE
        );
        const skip = (page - 1) * limit;

        const [markers, total] = await Promise.all([
          db.marker.findMany({
            where: { userId: user.id },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          db.marker.count({ where: { userId: user.id } }),
        ]);

        return {
          markers,
          pagination: {
            page,
            limit,
            total,
          },
        };
      }
    )
    .delete(
      "/markers/:id",
      async (ctx: UserContext & SetContext & { params: { id: string } }) => {
        const {
          user,
          params: { id },
          set,
        } = ctx;
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const marker = await db.marker.findUnique({ where: { id } });
        if (!marker) {
          set.status = 404;
          return { error: "Marker not found" };
        }
        if (marker.userId !== user.id) {
          set.status = 403;
          return { error: "Forbidden" };
        }
        try {
          await db.marker.delete({ where: { id } });
          set.status = 200;
          return { message: "Marker deleted successfully" };
        } catch {
          set.status = 500;
          return { error: "Failed to delete marker" };
        }
      },
      { params: idParamSchema }
    );

  return app;
};
