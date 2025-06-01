import { describe, test, expect } from 'bun:test'
import { app } from '../../index'
import { db } from '../../lib/db'

// Helper function to create a user and get auth token
async function createUserAndGetToken(
  email = `test${Date.now()}${Math.random()}@example.com`,
  name = 'Test User',
  password = 'password123',
) {
  const response = await app.handle(
    new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword: password,
      }),
    }),
  )
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create user: ${response.status} - ${errorText}`)
  }
  const data = await response.json()
  return { token: data.data.token, userId: data.data.user.id }
}

describe('User Endpoints', () => {
  describe('GET /api/v1/users', () => {
    test('should return paginated users', async () => {
      // Clear existing users first to ensure consistent test
      await db.session.deleteMany()
      await db.user.deleteMany()

      // Create multiple users
      const timestamp = Date.now()
      await createUserAndGetToken(`user1_${timestamp}@example.com`, 'User One')
      await createUserAndGetToken(`user2_${timestamp}@example.com`, 'User Two')
      await createUserAndGetToken(`user3_${timestamp}@example.com`, 'User Three')

      const response = await app.handle(new Request('http://localhost/api/users?page=1&limit=2'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeArrayOfSize(2)
      expect(data.total).toBe(3)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(2)
      expect(data.totalPages).toBe(2)
    })

    test('should return all users with default pagination', async () => {
      // Clear existing users first to ensure consistent test
      await db.session.deleteMany()
      await db.user.deleteMany()

      const timestamp = Date.now()
      await createUserAndGetToken(`user1_${timestamp}@example.com`, 'User One')
      await createUserAndGetToken(`user2_${timestamp}@example.com`, 'User Two')

      const response = await app.handle(new Request('http://localhost/api/users'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeArrayOfSize(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
    })

    test('should validate pagination parameters', async () => {
      const response = await app.handle(new Request('http://localhost/api/users?page=0&limit=150'))

      expect(response.status).toBe(422)
    })
  })

  describe('GET /api/v1/users/:id', () => {
    test('should return a specific user', async () => {
      const email = `test${Date.now()}${Math.random()}@example.com`
      const { userId } = await createUserAndGetToken(email)

      const response = await app.handle(new Request(`http://localhost/api/users/${userId}`))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(userId)
      expect(data.data.email).toBe(email)
      expect(data.data.name).toBe('Test User')
      expect(data.data.password).toBeUndefined()
    })

    test('should return 404 for non-existent user', async () => {
      const response = await app.handle(new Request('http://localhost/api/users/non-existent-id'))

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/v1/users/:id/markers', () => {
    test('should return user markers with pagination', async () => {
      const { token, userId } = await createUserAndGetToken()

      // Create markers
      for (let i = 0; i < 5; i++) {
        await app.handle(
          new Request('http://localhost/api/markers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: `Marker ${i + 1}`,
              latitude: 40.7128 + i,
              longitude: -74.006 + i,
            }),
          }),
        )
      }

      const response = await app.handle(
        new Request(`http://localhost/api/users/${userId}/markers?page=1&limit=3`),
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeArrayOfSize(3)
      expect(data.total).toBe(5)
      expect(data.totalPages).toBe(2)
    })

    test('should return 404 for non-existent user', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/non-existent-id/markers'),
      )

      expect(response.status).toBe(404)
    })

    test('should return empty array for user with no markers', async () => {
      const { userId } = await createUserAndGetToken()

      const response = await app.handle(new Request(`http://localhost/api/users/${userId}/markers`))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeArrayOfSize(0)
    })
  })

  describe('PUT /api/v1/users/profile', () => {
    test('should update user profile', async () => {
      const { token } = await createUserAndGetToken()

      const response = await app.handle(
        new Request('http://localhost/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Updated Name',
            avatar: 'https://example.com/avatar.jpg',
          }),
        }),
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated Name')
      expect(data.data.avatar).toBe('https://example.com/avatar.jpg')
    })

    test('should update only provided fields', async () => {
      const email = `test${Date.now()}${Math.random()}@example.com`
      const { token } = await createUserAndGetToken(email)

      const response = await app.handle(
        new Request('http://localhost/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Only Name Updated',
          }),
        }),
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Only Name Updated')
      expect(data.data.email).toBe(email) // Unchanged
    })

    test('should fail without authentication', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Name',
          }),
        }),
      )

      expect(response.status).toBe(401)
    })

    test('should validate name length', async () => {
      const { token } = await createUserAndGetToken()

      const response = await app.handle(
        new Request('http://localhost/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'A', // Too short
          }),
        }),
      )

      expect(response.status).toBe(422)
    })
  })

  describe('PUT /api/v1/users/password', () => {
    test('should update password successfully', async () => {
      const email = `test${Date.now()}${Math.random()}@example.com`
      const { token } = await createUserAndGetToken(email)

      const response = await app.handle(
        new Request('http://localhost/api/users/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: 'password123',
            newPassword: 'newpassword123',
            confirmPassword: 'newpassword123',
          }),
        }),
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password updated successfully')

      // Verify can login with new password
      const loginResponse = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'newpassword123',
          }),
        }),
      )

      expect(loginResponse.status).toBe(200)
    })

    test('should fail with incorrect current password', async () => {
      const { token } = await createUserAndGetToken()

      const response = await app.handle(
        new Request('http://localhost/api/users/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123',
            confirmPassword: 'newpassword123',
          }),
        }),
      )

      expect(response.status).toBe(400)
    })

    test("should fail when new passwords don't match", async () => {
      const { token } = await createUserAndGetToken()

      const response = await app.handle(
        new Request('http://localhost/api/users/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: 'password123',
            newPassword: 'newpassword123',
            confirmPassword: 'differentpassword123',
          }),
        }),
      )

      expect(response.status).toBe(400)
    })

    test('should validate new password length', async () => {
      const { token } = await createUserAndGetToken()

      const response = await app.handle(
        new Request('http://localhost/api/users/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: 'password123',
            newPassword: '12345', // Too short
            confirmPassword: '12345',
          }),
        }),
      )

      expect(response.status).toBe(422)
    })
  })

  describe('DELETE /api/v1/users/account', () => {
    test('should delete user account and all related data', async () => {
      const { token, userId } = await createUserAndGetToken()

      // Create a marker
      await app.handle(
        new Request('http://localhost/api/markers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: 'User Marker',
            latitude: 40.7128,
            longitude: -74.006,
          }),
        }),
      )

      // Delete account
      const response = await app.handle(
        new Request('http://localhost/api/users/account', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Account deleted successfully')

      // Verify user is deleted
      const user = await db.user.findUnique({ where: { id: userId } })
      expect(user).toBeNull()

      // Verify markers are deleted (cascade)
      const markers = await db.marker.findMany({ where: { userId } })
      expect(markers).toBeArrayOfSize(0)

      // Verify sessions are deleted
      const sessions = await db.session.findMany({ where: { userId } })
      expect(sessions).toBeArrayOfSize(0)

      // Verify can't use token anymore
      const meResponse = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )

      expect(meResponse.status).toBe(401)
    })

    test('should fail without authentication', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/account', {
          method: 'DELETE',
        }),
      )

      expect(response.status).toBe(401)
    })
  })
})
