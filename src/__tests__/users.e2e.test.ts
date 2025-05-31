import { beforeAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../index";
import { users } from "../routes/users";
import { cleanupDatabase } from "./utils";
import { PrismaClient } from "@prisma/client";

const api = treaty(app);
const db = new PrismaClient();

let token: string;
let userId: string;
let markerId: string;

beforeAll(async () => {
  await db.session.deleteMany();
  await db.marker.deleteMany();
  await db.user.deleteMany();

  // Create test user
  const user = await db.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      password: await Bun.password.hash("password123"),
    },
  });
  userId = user.id;

  // Get auth token
  const { data } = await api.api.v1.auth.login.post({
    email: "test@example.com",
    password: "password123",
  });
  token = data.token;

  // Create another user
  await api.api.v1.auth.register.post({
    name: "Another User",
    email: "another@example.com",
    password: "password123",
    confirmPassword: "password123",
  });

  // Create a marker for the test user
  const marker = await api.api.v1.markers.post(
    {
      title: "User's Marker",
      latitude: 50.4501,
      longitude: 30.5234,
      description: "Test marker",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  markerId = marker.data?.marker?.id ?? "";
});

describe("Users E2E Tests", () => {
  describe("Public endpoints", () => {
    it("lists all users", async () => {
      const { data, response } = await api.api.v1.users.get({ query: {} });
      expect(response.status).toBe(200);
      expect(data?.users).toBeInstanceOf(Array);
    });

    it("lists users with pagination", async () => {
      const { data, response } = await api.api.v1.users.get({
        query: { page: "1", limit: "1" },
      });
      expect(response.status).toBe(200);
      expect(data?.users).toBeInstanceOf(Array);
      expect(data?.pagination?.page).toBe(1);
    });

    it("gets user by ID", async () => {
      const { data, response } = await api.api.v1.users({ id: userId }).get();
      expect(response.status).toBe(200);
      expect(data?.id).toBe(userId);
    });

    it("handles non-existent user", async () => {
      const { response } = await api.api.v1.users({ id: "non-existent" }).get();
      expect(response.status).toBe(404);
    });

    it("gets user markers", async () => {
      const { data, response } = await api.api.v1
        .users({ id: userId })
        .markers.get({
          query: {},
        });
      expect(response.status).toBe(200);
      expect(data?.markers).toBeInstanceOf(Array);
    });

    it("handles markers for non-existent user", async () => {
      const { response } = await api.api.v1
        .users({ id: "non-existent" })
        .markers.get();
      expect(response.status).toBe(404);
    });
  });

  describe("Protected endpoints", () => {
    it("gets current user profile", async () => {
      const { data, response } = await api.api.v1.users.me.get({
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      expect(data && "name" in data && data.name).toBe("Test User");
    });

    it("requires auth for profile", async () => {
      const { response } = await api.api.v1.users.me.get();
      expect(response.status).toBe(401);
    });

    it("updates user profile", async () => {
      const { data, response } = await api.api.v1.users.me.put(
        {
          name: "Updated Name",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(response.status).toBe(200);
      expect(data?.name).toBe("Updated Name");
    });

    it("validates profile update", async () => {
      const { response } = await api.api.v1.users.me.put(
        {
          name: "A", // Too short
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(response.status).toBe(422);
    });

    it("changes password successfully", async () => {
      const { response } = await api.api.v1.users.me.password.put(
        {
          currentPassword: "password123",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(response.status).toBe(200);
    });

    it("rejects wrong current password", async () => {
      const { response } = await api.api.v1.users.me.password.put(
        {
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(response.status).toBe(400);
    });

    it("validates password mismatch", async () => {
      const { response } = await api.api.v1.users.me.password.put(
        {
          currentPassword: "password123",
          newPassword: "newpassword123",
          confirmPassword: "differentpassword",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(response.status).toBe(400);
    });

    it("gets current user's markers", async () => {
      const { data, response } = await api.api.v1.markers.me.get({
        query: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      expect(data?.markers).toBeInstanceOf(Array);
    });

    it("deletes user account", async () => {
      const { response } = await api.api.v1.users.me.delete(
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(response.status).toBe(200);

      // Verify user is deleted
      const { response: getResponse } = await api.api.v1.users.me.get({
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(getResponse.status).toBe(401);
    });
  });
});
