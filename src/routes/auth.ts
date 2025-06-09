import { Elysia, t } from 'elysia'
import { AuthService } from '../services/auth.service'
import { authMiddleware } from '../middleware/auth'
import {
  UserWithTokenResponse,
  LoginResponse,
  MessageResponse,
  UserDataResponse,
  ErrorResponse,
  ValidationError,
} from '../types'

export const auth = new Elysia({ prefix: '/auth' })
  .post(
    '/register',
    async ({ body, set }) => {
      try {
        const user = await AuthService.register(body)
        const token = await AuthService.generateToken(user.id)

        set.status = 201
        return {
          success: true,
          data: {
            user,
            token,
          },
        }
      } catch (error) {
        set.status = 400
        const message = error instanceof Error ? error.message : 'Unknown error'
        const field = message.toLowerCase().includes('email')
          ? 'email'
          : message.toLowerCase().includes('password')
            ? 'password'
            : message.toLowerCase().includes('confirm')
              ? 'confirmPassword'
              : message.toLowerCase().includes('name')
                ? 'name'
                : 'general'

        throw new ValidationError(field, message)
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 50 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6, maxLength: 100 }),
        confirmPassword: t.String({ minLength: 6, maxLength: 100 }),
      }),
      response: {
        201: UserWithTokenResponse,
        400: ErrorResponse,
      },
    },
  )
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        const result = await AuthService.login(body)
        return {
          success: true,
          data: result,
        }
      } catch (error) {
        set.status = 400
        const message = error instanceof Error ? error.message : 'Unknown error'
        const field = message.toLowerCase().includes('email')
          ? 'email'
          : message.toLowerCase().includes('password')
            ? 'password'
            : 'general'

        throw new ValidationError(field, message)
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
      response: {
        200: LoginResponse,
        400: ErrorResponse,
      },
    },
  )
  .group('', (app) =>
    app
      .use(authMiddleware)
      .post(
        '/logout',
        async (context) => {
          const { token } = context
          await AuthService.logout(token)
          return {
            success: true,
            message: 'Logged out successfully',
          }
        },
        {
          response: {
            200: MessageResponse,
          },
        },
      )
      .get(
        '/me',
        async (context) => {
          const { userId } = context
          const user = await AuthService.getUser(userId)

          if (!user) {
            throw new ValidationError('general', 'User not found')
          }

          return {
            success: true,
            data: user,
          }
        },
        {
          response: {
            200: UserDataResponse,
            404: ErrorResponse,
          },
        },
      ),
  )
