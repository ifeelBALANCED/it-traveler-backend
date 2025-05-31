import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../index";
import { users } from "../routes/users";
import { markers } from "../routes/markers";
import { cleanupDatabase, createTestUser, getAuthHeader } from "./utils";

const api = treaty(app);

type TestUserType = Awaited<ReturnType<typeof createTestUser>>;

let testUser: TestUserType;
let testMarkerId: string;
let otherUser: TestUserType;

beforeAll(async () => {
  await cleanupDatabase();
  testUser = await createTestUser();
  otherUser = await createTestUser("other@example.com");

  // Create a test marker
  const { data, response } = await api.api.v1.markers.post(
    {
      title: "Test Marker",
      latitude: 50.4501,
      longitude: 30.5234,
      description: "Test description",
    },
    {
      headers: getAuthHeader(testUser.token),
    }
  );

  if (400 <= response.status) {
    throw new Error(`Failed to create test marker: ${response.status}`);
  }

  testMarkerId = data?.marker?.id ?? "";
});

afterAll(async () => {
  await cleanupDatabase();
});

describe("Markers", () => {
  describe("CRUD Operations", () => {
    it("creates a marker", async () => {
      const { data, response } = await api.api.v1.markers.post(
        {
          title: "Test Marker",
          latitude: 51.4501,
          longitude: 31.5234,
          description: "Test description",
        },
        {
          headers: getAuthHeader(testUser.token),
        }
      );

      expect(response.status).toBe(201);
      expect(data?.marker?.title).toBe("Test Marker");
      testMarkerId = data?.marker?.id;
    });

    it("lists markers", async () => {
      const { data, response } = await api.api.v1.markers.get();
      expect(response.status).toBe(200);
      expect(data?.markers).toBeInstanceOf(Array);
    });

    it("gets a marker by id", async () => {
      const { data, response } = await api.api.v1
        .markers({ id: testMarkerId })
        .get();
      expect(response.status).toBe(200);
      expect(data?.title).toBe("Test Marker");
    });

    it("updates a marker", async () => {
      const { data, response } = await api.api.v1
        .markers({ id: testMarkerId })
        .put(
          {
            title: "Updated Marker",
            description: "Updated description",
          },
          {
            headers: getAuthHeader(testUser.token),
          }
        );
      expect(response.status).toBe(200);
      expect(data?.marker?.title).toBe("Updated Marker");
      expect(data?.marker?.description).toBe("Updated description");
    });

    it("deletes a marker", async () => {
      const { response } = await api.api.v1
        .markers({ id: testMarkerId })
        .delete({
          headers: getAuthHeader(testUser.token),
        });
      expect(response.status).toBe(200);

      // Verify marker is deleted
      const { response: getResponse } = await api.api.v1
        .markers({ id: testMarkerId })
        .get();
      expect(getResponse.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("prevents unauthorized marker creation", async () => {
      const { response } = await api.api.v1.markers.post(
        {
          title: "Test Marker",
          latitude: 51.4501,
          longitude: 31.5234,
          description: "Test description",
        },
        {
          headers: {},
        }
      );
      expect(response.status).toBe(401);
    });

    it("prevents unauthorized marker update", async () => {
      const { response } = await api.api.v1.markers({ id: testMarkerId }).put(
        {
          title: "Unauthorized Update",
        },
        {
          headers: getAuthHeader(otherUser.token),
        }
      );
      expect(response.status).toBe(403);
    });

    it("prevents unauthorized marker deletion", async () => {
      const { response } = await api.api.v1
        .markers({ id: testMarkerId })
        .delete({
          headers: getAuthHeader(otherUser.token),
        });
      expect(response.status).toBe(403);
    });
  });

  describe("Validation", () => {
    it("validates marker creation input", async () => {
      const { response } = await api.api.v1.markers.post(
        {
          title: "", // Invalid empty title
          latitude: 200, // Invalid latitude
          longitude: 30.5234,
        },
        {
          headers: getAuthHeader(testUser.token),
        }
      );
      expect(response.status).toBe(422);
    });

    it("validates marker update input", async () => {
      const { response } = await api.api.v1.markers({ id: testMarkerId }).put(
        {
          latitude: 200, // Invalid latitude
        },
        {
          headers: getAuthHeader(testUser.token),
        }
      );
      expect(response.status).toBe(422);
    });
  });
});
