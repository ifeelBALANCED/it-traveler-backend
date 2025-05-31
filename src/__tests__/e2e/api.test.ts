import { describe, test, expect } from "bun:test";
import { app } from "../../index";
import { db } from "../../lib/db";

describe("E2E API Tests", () => {
  test("complete user journey", async () => {
    // 1. Register a new user
    const registerResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "securepassword123",
          confirmPassword: "securepassword123",
        }),
      })
    );

    expect(registerResponse.status).toBe(201);
    const { data: registerData } = await registerResponse.json();
    const token = registerData.token;
    const userId = registerData.user.id;

    // 2. Get current user info
    const meResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    expect(meResponse.status).toBe(200);
    const { data: userData } = await meResponse.json();
    expect(userData.email).toBe("john@example.com");
    expect(userData.name).toBe("John Doe");

    // 3. Create markers
    const marker1Response = await app.handle(
      new Request("http://localhost/api/v1/markers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Favorite Coffee Shop",
          description: "Best coffee in town",
          latitude: 40.7589,
          longitude: -73.9851,
          address: "Times Square, NY",
          imageUrl: "https://example.com/coffee.jpg",
        }),
      })
    );

    expect(marker1Response.status).toBe(201);
    const { data: marker1 } = await marker1Response.json();

    const marker2Response = await app.handle(
      new Request("http://localhost/api/v1/markers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Central Park",
          description: "Nice place for a walk",
          latitude: 40.7829,
          longitude: -73.9654,
          address: "Central Park, NY",
        }),
      })
    );

    expect(marker2Response.status).toBe(201);
    const { data: marker2 } = await marker2Response.json();

    // 4. Get all markers
    const allMarkersResponse = await app.handle(
      new Request("http://localhost/api/v1/markers")
    );

    expect(allMarkersResponse.status).toBe(200);
    const { data: allMarkers } = await allMarkersResponse.json();
    // Should have at least the 2 markers we created
    expect(allMarkers.length).toBeGreaterThanOrEqual(2);
    const ourMarkers = allMarkers.filter((m: any) => m.userId === userId);
    expect(ourMarkers).toBeArrayOfSize(2);

    // 5. Get user's markers
    const myMarkersResponse = await app.handle(
      new Request("http://localhost/api/v1/markers/my/markers", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    expect(myMarkersResponse.status).toBe(200);
    const { data: myMarkers } = await myMarkersResponse.json();
    expect(myMarkers).toBeArrayOfSize(2);

    // 6. Update a marker
    const updateResponse = await app.handle(
      new Request(`http://localhost/api/v1/markers/${marker1.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Amazing Coffee Shop",
          description: "Updated: Still the best coffee in town!",
        }),
      })
    );

    expect(updateResponse.status).toBe(200);
    const { data: updatedMarker } = await updateResponse.json();
    expect(updatedMarker.title).toBe("Amazing Coffee Shop");

    // 7. Update user profile
    const profileUpdateResponse = await app.handle(
      new Request("http://localhost/api/v1/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "John Smith",
          avatar: "https://example.com/john.jpg",
        }),
      })
    );

    expect(profileUpdateResponse.status).toBe(200);
    const { data: updatedProfile } = await profileUpdateResponse.json();
    expect(updatedProfile.name).toBe("John Smith");
    expect(updatedProfile.avatar).toBe("https://example.com/john.jpg");

    // 8. Get all users
    const usersResponse = await app.handle(
      new Request("http://localhost/api/v1/users")
    );

    expect(usersResponse.status).toBe(200);
    const { data: users, total } = await usersResponse.json();
    expect(total).toBeGreaterThanOrEqual(1);

    // 9. Get user by ID
    const userByIdResponse = await app.handle(
      new Request(`http://localhost/api/v1/users/${userId}`)
    );

    expect(userByIdResponse.status).toBe(200);
    const { data: userById } = await userByIdResponse.json();
    expect(userById.id).toBe(userId);
    expect(userById.name).toBe("John Smith");

    // 10. Get user's markers by user ID
    const userMarkersResponse = await app.handle(
      new Request(`http://localhost/api/v1/users/${userId}/markers`)
    );

    expect(userMarkersResponse.status).toBe(200);
    const { data: userMarkers } = await userMarkersResponse.json();
    expect(userMarkers).toBeArrayOfSize(2);

    // 11. Delete a marker
    const deleteMarkerResponse = await app.handle(
      new Request(`http://localhost/api/v1/markers/${marker2.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    expect(deleteMarkerResponse.status).toBe(200);

    // Verify marker is deleted
    const getDeletedMarkerResponse = await app.handle(
      new Request(`http://localhost/api/v1/markers/${marker2.id}`)
    );
    expect(getDeletedMarkerResponse.status).toBe(404);

    // 12. Change password
    const changePasswordResponse = await app.handle(
      new Request("http://localhost/api/v1/users/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: "securepassword123",
          newPassword: "newsecurepassword123",
          confirmPassword: "newsecurepassword123",
        }),
      })
    );

    expect(changePasswordResponse.status).toBe(200);

    // 13. Logout
    const logoutResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    expect(logoutResponse.status).toBe(200);

    // Verify token is invalidated
    const invalidTokenResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(invalidTokenResponse.status).toBe(401);

    // 14. Login with new password
    const loginResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "newsecurepassword123",
        }),
      })
    );

    expect(loginResponse.status).toBe(200);
    const { data: loginData } = await loginResponse.json();
    const newToken = loginData.token;

    // 15. Delete account
    const deleteAccountResponse = await app.handle(
      new Request("http://localhost/api/v1/users/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${newToken}` },
      })
    );

    expect(deleteAccountResponse.status).toBe(200);

    // Verify everything is deleted
    const deletedUser = await db.user.findUnique({ where: { id: userId } });
    expect(deletedUser).toBeNull();

    const deletedMarkers = await db.marker.findMany({ where: { userId } });
    expect(deletedMarkers).toBeArrayOfSize(0);
  });

  test("API health check", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/health")
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeTruthy();
  });

  test("API root endpoint", async () => {
    const response = await app.handle(new Request("http://localhost/"));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Markers API");
    expect(data.version).toBe("1.0.0");
  });

  test("concurrent user operations", async () => {
    // Create multiple users concurrently
    const userPromises = Array.from({ length: 3 }, (_, i) =>
      app.handle(
        new Request("http://localhost/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `User ${i + 1}`,
            email: `user${i + 1}_${Date.now()}_${Math.random()}@example.com`,
            password: "password123",
            confirmPassword: "password123",
          }),
        })
      )
    );

    const responses = await Promise.all(userPromises);
    responses.forEach((response) => expect(response.status).toBe(201));

    // Get all users data
    const userData = await Promise.all(
      responses.map((r) => r.json().then((d) => d.data))
    );

    // Create markers for each user concurrently
    const markerPromises = userData.flatMap((user, userIndex) =>
      Array.from({ length: 2 }, (_, markerIndex) =>
        app.handle(
          new Request("http://localhost/api/v1/markers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              title: `User ${userIndex + 1} Marker ${markerIndex + 1}`,
              latitude: 40.7128 + userIndex,
              longitude: -74.006 + markerIndex,
            }),
          })
        )
      )
    );

    const markerResponses = await Promise.all(markerPromises);
    markerResponses.forEach((response) => expect(response.status).toBe(201));

    // Verify total markers
    const allMarkersResponse = await app.handle(
      new Request("http://localhost/api/v1/markers")
    );
    const { data: allMarkers } = await allMarkersResponse.json();
    // There may be more markers from other tests, so just check we have at least 6
    expect(allMarkers.length).toBeGreaterThanOrEqual(6);
    // Verify each user created their markers
    for (const { user } of userData) {
      const userMarkers = allMarkers.filter((m: any) => m.userId === user.id);
      expect(userMarkers).toBeArrayOfSize(2);
    }

    // Verify each user has their own markers
    const userMarkerChecks = userData.map((user) =>
      app.handle(
        new Request("http://localhost/api/v1/markers/my/markers", {
          headers: { Authorization: `Bearer ${user.token}` },
        })
      )
    );

    const userMarkerResponses = await Promise.all(userMarkerChecks);
    for (const response of userMarkerResponses) {
      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data).toBeArrayOfSize(2);
    }
  });

  test("error handling and validation", async () => {
    // Test various error scenarios

    // 1. Invalid email format
    const invalidEmailResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "invalid-email",
          password: "password123",
          confirmPassword: "password123",
        }),
      })
    );
    expect(invalidEmailResponse.status).toBe(422);

    // 2. Short password
    const shortPasswordResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "12345",
          confirmPassword: "12345",
        }),
      })
    );
    expect(shortPasswordResponse.status).toBe(422);

    // 3. Invalid coordinates
    const { token } = await createTestUser();
    const invalidCoordinatesResponse = await app.handle(
      new Request("http://localhost/api/v1/markers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Invalid Marker",
          latitude: 91, // Invalid
          longitude: -181, // Invalid
        }),
      })
    );
    expect(invalidCoordinatesResponse.status).toBe(422);

    // 4. Unauthorized access
    const unauthorizedResponse = await app.handle(
      new Request("http://localhost/api/v1/markers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Unauthorized Marker",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      })
    );
    expect(unauthorizedResponse.status).toBe(401);

    // 5. Non-existent resource
    const notFoundResponse = await app.handle(
      new Request("http://localhost/api/v1/markers/non-existent-id")
    );
    expect(notFoundResponse.status).toBe(404);
  });
});

// Helper function to create a test user
async function createTestUser() {
  const response = await app.handle(
    new Request("http://localhost/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "password123",
        confirmPassword: "password123",
      }),
    })
  );
  const data = await response.json();
  return data.data;
}
