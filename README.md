# IT Traveler Backend - Markers API

A fully functional REST API for managing location markers, built with ElysiaJS, Prisma, SQLite, and Bun runtime.

## Features

- **User Authentication**: JWT-based authentication with session management
- **Marker Management**: Create, read, update, and delete location markers
- **User Management**: Profile updates, password changes, and account deletion
- **Pagination**: Built-in pagination for list endpoints
- **Validation**: Request validation using ElysiaJS's built-in schema validation
- **Type Safety**: Full TypeScript support with Prisma-generated types
- **Testing**: Comprehensive unit and E2E tests

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Testing**: Bun test runner

## Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Node.js 18+ (for some tooling compatibility)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd it-traveler-backend
```

2. Install dependencies:

```bash
bun install
```

3. Set up the database:

```bash
# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# (Optional) Seed the database
bun run db:seed
```

4. Create a `.env` file:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"
```

## Running the Application

### Development mode:

```bash
bun run dev
```

### Production mode:

```bash
bun run build
bun run start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

### Endpoints

#### Authentication (`/auth`)

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email and password
- `POST /auth/logout` - Logout (requires auth)
- `GET /auth/me` - Get current user info (requires auth)

#### Markers (`/markers`)

- `GET /markers` - Get all markers (public)
- `GET /markers/:id` - Get a specific marker (public)
- `POST /markers` - Create a new marker (requires auth)
- `PUT /markers/:id` - Update a marker (requires auth, owner only)
- `DELETE /markers/:id` - Delete a marker (requires auth, owner only)
- `GET /markers/my/markers` - Get current user's markers (requires auth)

#### Users (`/users`)

- `GET /users` - Get all users with pagination
- `GET /users/:id` - Get a specific user
- `GET /users/:id/markers` - Get user's markers with pagination
- `PUT /users/profile` - Update user profile (requires auth)
- `PUT /users/password` - Change password (requires auth)
- `DELETE /users/account` - Delete account (requires auth)

### Request/Response Examples

#### Register User

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "confirmPassword": "securepassword123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGc..."
  }
}
```

#### Create Marker

```bash
POST /api/v1/markers
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Favorite Coffee Shop",
  "description": "Best coffee in town",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "address": "Times Square, NY",
  "imageUrl": "https://example.com/image.jpg"
}

Response:
{
  "success": true,
  "data": {
    "id": "clyyy...",
    "title": "Favorite Coffee Shop",
    "description": "Best coffee in town",
    "latitude": 40.7589,
    "longitude": -73.9851,
    "address": "Times Square, NY",
    "imageUrl": "https://example.com/image.jpg",
    "userId": "clxxx...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "clxxx...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null
    }
  }
}
```

## Testing

Run all tests:

```bash
bun test
```

Run specific test file:

```bash
bun test src/__tests__/unit/auth.test.ts
```

Run tests in watch mode:

```bash
bun test --watch
```

## Database Management

```bash
# Open Prisma Studio
bun run db:studio

# Reset database (WARNING: deletes all data)
bun run db:reset

# Generate Prisma client
bun run db:generate

# Create a new migration
bun run db:migrate
```

## Project Structure

```
it-traveler-backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── dev.db          # SQLite database file
├── src/
│   ├── __tests__/      # Test files
│   │   ├── unit/       # Unit tests
│   │   ├── e2e/        # End-to-end tests
│   │   └── setup.ts    # Test setup
│   ├── lib/            # Utilities and database connection
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── index.ts        # Application entry point
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Development Tips

1. **Type Safety**: Leverage Prisma's generated types for full type safety
2. **Validation**: Use ElysiaJS's built-in schema validation for request validation
3. **Error Handling**: Always wrap async operations in try-catch blocks
4. **Testing**: Write tests for new features before implementing them
5. **Security**: Never commit sensitive data like JWT secrets to version control

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

**Built with ❤️ using ElysiaJS, Prisma, and SQLite**
