import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  beforeEach,
} from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../index";
import { users } from "../routes/users";
import { markers } from "../routes/markers";
import { cleanupDatabase } from "./utils";

const api = treaty(app);

describe("Authentication", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe("Registration", () => {
    it("registers a new user successfully", async () => {
      const { response } = await api.api.v1.auth.register.post({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        name: "Test User",
      });

      expect(response.status).toBe(201);
    });

    it("rejects registration with existing email", async () => {
      // First registration
      await api.api.v1.auth.register.post({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        name: "Test User",
      });

      // Second registration with same email
      const { response } = await api.api.v1.auth.register.post({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        name: "Test User 2",
      });

      expect(response.status).toBe(409);
    });

    it("validates registration input", async () => {
      const { response } = await api.api.v1.auth.register.post({
        email: "invalid-email",
        password: "123",
        confirmPassword: "123",
        name: "A",
      });

      expect(response.status).toBe(422);
    });
  });

  describe("Login", () => {
    const email = "test@example.com";
    const password = "password123";

    beforeEach(async () => {
      await api.api.v1.auth.register.post({
        email,
        password,
        confirmPassword: password,
        name: "Test User",
      });
    });

    it("logs in with correct credentials", async () => {
      const { response, data } = await api.api.v1.auth.login.post({
        email,
        password,
      });

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("token");
      expect(data).toHaveProperty("user");
    });

    it("rejects login with wrong password", async () => {
      const { response } = await api.api.v1.auth.login.post({
        email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
    });

    it("rejects login with non-existent email", async () => {
      const { response } = await api.api.v1.auth.login.post({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
    });
  });
});
