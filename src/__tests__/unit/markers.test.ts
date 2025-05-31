import { describe, test, expect } from "bun:test";
import { app } from "../../index";
import { db } from "../../lib/db";

// Helper function to create a user and get auth token
async function createUserAndGetToken(
  email = `test${Date.now()}${Math.random()}@example.com`,
  name = "Test User",
  password = "password123"
) {
  const response = await app.handle(
    new Request("http://localhost/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword: password,
      }),
    })
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create user: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return { token: data.data.token, userId: data.data.user.id };
}

describe("Marker Endpoints", () => {
  describe("GET /api/v1/markers", () => {
    test("should return empty array when no markers exist", async () => {
      // This test needs to clean the database to ensure no markers exist
      await db.marker.deleteMany();

      const response = await app.handle(
        new Request("http://localhost/api/v1/markers")
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeArrayOfSize(0);
    });

    test("should return all markers", async () => {
      const { token } = await createUserAndGetToken();

      // Create markers
      await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Test Marker 1",
            description: "Description 1",
            latitude: 40.7128,
            longitude: -74.006,
            address: "New York, NY",
          }),
        })
      );

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Test Marker 2",
            description: "Description 2",
            latitude: 51.5074,
            longitude: -0.1278,
            address: "London, UK",
          }),
        })
      );

      const response = await app.handle(
        new Request("http://localhost/api/v1/markers")
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeArrayOfSize(2);
      expect(data.data[0].title).toBe("Test Marker 2"); // Ordered by createdAt desc
      expect(data.data[1].title).toBe("Test Marker 1");
    });
  });

  describe("POST /api/v1/markers", () => {
    test("should create a new marker", async () => {
      const email = `test${Date.now()}${Math.random()}@example.com`;
      const { token } = await createUserAndGetToken(email);

      const response = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Test Marker",
            description: "Test Description",
            latitude: 40.7128,
            longitude: -74.006,
            address: "New York, NY",
            imageUrl: "https://example.com/image.jpg",
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Test Marker");
      expect(data.data.description).toBe("Test Description");
      expect(data.data.latitude).toBe(40.7128);
      expect(data.data.longitude).toBe(-74.006);
      expect(data.data.user.email).toBe(email);
    });

    test("should fail without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Test Marker",
            latitude: 40.7128,
            longitude: -74.006,
          }),
        })
      );

      expect(response.status).toBe(401);
    });

    test("should fail with invalid latitude", async () => {
      const { token } = await createUserAndGetToken();

      const response = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Test Marker",
            latitude: 91, // Invalid - max is 90
            longitude: -74.006,
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    test("should fail with missing required fields", async () => {
      const { token } = await createUserAndGetToken();

      const response = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Test Marker",
            // Missing latitude and longitude
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("GET /api/v1/markers/:id", () => {
    test("should return a specific marker", async () => {
      const { token } = await createUserAndGetToken();

      // Create a marker
      const createResponse = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Test Marker",
            latitude: 40.7128,
            longitude: -74.006,
          }),
        })
      );

      const { data: marker } = await createResponse.json();

      // Get the marker
      const response = await app.handle(
        new Request(`http://localhost/api/v1/markers/${marker.id}`)
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(marker.id);
      expect(data.data.title).toBe("Test Marker");
    });

    test("should return 404 for non-existent marker", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/markers/non-existent-id")
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/v1/markers/:id", () => {
    test("should update a marker", async () => {
      const { token } = await createUserAndGetToken();

      // Create a marker
      const createResponse = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Original Title",
            latitude: 40.7128,
            longitude: -74.006,
          }),
        })
      );

      const { data: marker } = await createResponse.json();

      // Update the marker
      const response = await app.handle(
        new Request(`http://localhost/api/v1/markers/${marker.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Updated Title",
            description: "New Description",
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Updated Title");
      expect(data.data.description).toBe("New Description");
      expect(data.data.latitude).toBe(40.7128); // Unchanged
    });

    test("should not allow updating another user's marker", async () => {
      const { token: token1 } = await createUserAndGetToken();
      const { token: token2 } = await createUserAndGetToken(
        `other_${Date.now()}_${Math.random()}@example.com`,
        "Other User"
      );

      // Create a marker with first user
      const createResponse = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            title: "User 1 Marker",
            latitude: 40.7128,
            longitude: -74.006,
          }),
        })
      );

      const { data: marker } = await createResponse.json();

      // Try to update with second user
      const response = await app.handle(
        new Request(`http://localhost/api/v1/markers/${marker.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token2}`,
          },
          body: JSON.stringify({
            title: "Hacked Title",
          }),
        })
      );

      expect(response.status).toBe(403);
    });

    test("should return 404 for non-existent marker", async () => {
      const { token } = await createUserAndGetToken();

      const response = await app.handle(
        new Request("http://localhost/api/v1/markers/non-existent-id", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Updated Title",
          }),
        })
      );

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/markers/:id", () => {
    test("should delete a marker", async () => {
      const { token } = await createUserAndGetToken();

      // Create a marker
      const createResponse = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "To Be Deleted",
            latitude: 40.7128,
            longitude: -74.006,
          }),
        })
      );

      const { data: marker } = await createResponse.json();

      // Delete the marker
      const response = await app.handle(
        new Request(`http://localhost/api/v1/markers/${marker.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);

      // Verify it's deleted
      const getResponse = await app.handle(
        new Request(`http://localhost/api/v1/markers/${marker.id}`)
      );

      expect(getResponse.status).toBe(404);
    });

    test("should not allow deleting another user's marker", async () => {
      const { token: token1 } = await createUserAndGetToken();
      const { token: token2 } = await createUserAndGetToken(
        `other_${Date.now()}_${Math.random()}@example.com`,
        "Other User"
      );

      // Create a marker with first user
      const createResponse = await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            title: "User 1 Marker",
            latitude: 40.7128,
            longitude: -74.006,
          }),
        })
      );

      const { data: marker } = await createResponse.json();

      // Try to delete with second user
      const response = await app.handle(
        new Request(`http://localhost/api/v1/markers/${marker.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token2}`,
          },
        })
      );

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/v1/markers/my/markers", () => {
    test("should return only current user's markers", async () => {
      const { token: token1 } = await createUserAndGetToken();
      const { token: token2 } = await createUserAndGetToken(
        `other_${Date.now()}_${Math.random()}@example.com`,
        "Other User"
      );

      // Create markers for both users
      await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token1}`,
          },
          body: JSON.stringify({
            title: "User 1 Marker",
            latitude: 40.7128,
            longitude: -74.006,
          }),
        })
      );

      await app.handle(
        new Request("http://localhost/api/v1/markers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token2}`,
          },
          body: JSON.stringify({
            title: "User 2 Marker",
            latitude: 51.5074,
            longitude: -0.1278,
          }),
        })
      );

      // Get user 1's markers
      const response = await app.handle(
        new Request("http://localhost/api/v1/markers/my/markers", {
          headers: {
            Authorization: `Bearer ${token1}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeArrayOfSize(1);
      expect(data.data[0].title).toBe("User 1 Marker");
    });

    test("should return empty array for user with no markers", async () => {
      const { token } = await createUserAndGetToken();

      const response = await app.handle(
        new Request("http://localhost/api/v1/markers/my/markers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeArrayOfSize(0);
    });
  });
});
