import { describe, test, expect } from 'bun:test'
import { app } from '../../index'

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully', async () => {
      const email = `test_${Date.now()}_${Math.random()}@example.com`
      const response = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email,
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(email)
      expect(data.data.user.name).toBe('Test User')
      expect(data.data.token).toBeTruthy()
      expect(data.data.user.password).toBeUndefined()
    })

    test('should fail with mismatched passwords', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'password123',
            confirmPassword: 'password456',
          }),
        }),
      )

      expect(response.status).toBe(400)
    })

    test('should fail with duplicate email', async () => {
      const email = `test_${Date.now()}_${Math.random()}@example.com`
      // First registration
      await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email,
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      // Second registration with same email
      const response = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Another User',
            email,
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      expect(response.status).toBe(400)
    })

    test('should fail with invalid email format', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'invalid-email',
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      expect(response.status).toBe(422)
    })

    test('should fail with short password', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: '12345',
            confirmPassword: '12345',
          }),
        }),
      )

      expect(response.status).toBe(422)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      const email = `test_${Date.now()}_${Math.random()}@example.com`
      // Register a user first
      await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email,
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      // Login
      const response = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'password123',
          }),
        }),
      )

      // Add debug logging
      if (response.status !== 200) {
        const errorText = await response.text()
        console.log('Login failed with status:', response.status)
        console.log('Error response:', errorText)
      }

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(email)
      expect(data.data.token).toBeTruthy()
    })

    test('should fail with incorrect password', async () => {
      const email = `test_${Date.now()}_${Math.random()}@example.com`
      // Register a user first
      await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email,
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      // Login with wrong password
      const response = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'wrongpassword',
          }),
        }),
      )

      expect(response.status).toBe(401)
    })

    test('should fail with non-existent email', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `nonexistent_${Date.now()}_${Math.random()}@example.com`,
            password: 'password123',
          }),
        }),
      )

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    test('should return current user data', async () => {
      const email = `test_${Date.now()}_${Math.random()}@example.com`
      // Register and get token
      const registerResponse = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email,
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      const { data } = await registerResponse.json()
      const token = data.token

      // Get current user
      const response = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )

      expect(response.status).toBe(200)
      const meData = await response.json()
      expect(meData.success).toBe(true)
      expect(meData.data.email).toBe(email)
      expect(meData.data.name).toBe('Test User')
    })

    test('should fail without authentication', async () => {
      const response = await app.handle(new Request('http://localhost/api/auth/me'))

      // Add debug logging
      if (response.status !== 401) {
        const errorText = await response.text()
        console.log('Auth check failed with status:', response.status)
        console.log('Error response:', errorText)
      }

      expect(response.status).toBe(401)
    })

    test('should fail with invalid token', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'Bearer invalid-token' },
        }),
      )

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    test('should logout successfully', async () => {
      const email = `test_${Date.now()}_${Math.random()}@example.com`
      // Register and get token
      const registerResponse = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email,
            password: 'password123',
            confirmPassword: 'password123',
          }),
        }),
      )

      const { data } = await registerResponse.json()
      const token = data.token

      // Logout
      const response = await app.handle(
        new Request('http://localhost/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }),
      )

      expect(response.status).toBe(200)

      // Verify token is invalidated
      const meResponse = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )

      expect(meResponse.status).toBe(401)
    })
  })
})
