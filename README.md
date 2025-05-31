# Markers API

A fully functional REST API built with **ElysiaJS**, **Prisma**, and **SQLite** for managing location markers and users.

## 🚀 Features

- **Authentication & Authorization** with JWT tokens
- **User Management** (registration, login, profile updates)
- **Marker CRUD Operations** with location-based filtering
- **Pagination & Search** functionality
- **Input Validation** with comprehensive schemas
- **Error Handling** with detailed responses
- **API Documentation** with Swagger UI
- **Database Relations** with Prisma ORM
- **Session Management** with automatic cleanup
- **CORS Configuration** for frontend integration

## 📋 Prerequisites

- [Bun](https://bun.sh/) runtime
- Node.js 18+ (alternative to Bun)

## 🛠️ Installation

1. **Clone and setup the project:**

```bash
mkdir markers-api && cd markers-api
bun init -y
```

2. **Install dependencies:**

```bash
bun add elysia @elysiajs/cors @elysiajs/jwt @elysiajs/swagger @prisma/client prisma
bun add -d @types/bun typescript
```

3. **Setup environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your configuration.

4. **Initialize and setup database:**

```bash
# Initialize Prisma
bunx prisma init --datasource-provider sqlite

# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev --name init

# Seed the database (optional)
bun run db:seed
```

5. **Start the development server:**

```bash
bun run dev
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/swagger
- **Health Check**: http://localhost:3000/health

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Sample Users (after seeding):

- **Email**: john@example.com | **Password**: password123
- **Email**: jane@example.com | **Password**: password123

## 📖 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user (requires auth)
- `GET /api/v1/auth/me` - Get current user (requires auth)

### Users

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/:id/markers` - Get user's markers
- `PUT /api/v1/users/profile` - Update profile (requires auth)
- `PUT /api/v1/users/password` - Change password (requires auth)
- `DELETE /api/v1/users/account` - Delete account (requires auth)

### Markers

- `GET /api/v1/markers` - Get all markers (with pagination & filters)
- `GET /api/v1/markers/:id` - Get marker by ID
- `POST /api/v1/markers` - Create marker (requires auth)
- `PUT /api/v1/markers/:id` - Update marker (requires auth)
- `DELETE /api/v1/markers/:id` - Delete marker (requires auth)
- `GET /api/v1/markers/my/markers` - Get current user's markers (requires auth)

## 🔍 Query Parameters

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Markers Filtering

- `search` - Search in title, description, address
- `lat` - Latitude for location-based search
- `lng` - Longitude for location-based search
- `radius` - Search radius in kilometers

Example:

```
GET /api/v1/markers?page=1&limit=10&search=palace&lat=50.4501&lng=30.5234&radius=5
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── auth.ts          # Authentication middleware & JWT config
│   ├── cors.ts          # CORS configuration
│   ├── database.ts      # Prisma client setup
│   ├── errorHandler.ts  # Global error handling
│   └── validation.ts    # Request validation schemas
├── routes/
│   ├── auth.ts          # Authentication routes
│   ├── markers.ts       # Marker management routes
│   └── users.ts         # User management routes
└── index.ts             # Main server file

prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Database seeding script
```

## 🗄️ Database Schema

### Users

- `id` - Unique identifier (CUID)
- `email` - Unique email address
- `name` - User's display name
- `password` - Hashed password
- `avatar` - Profile picture URL (optional)
- `createdAt` / `updatedAt` - Timestamps

### Sessions

- `id` - Unique identifier
- `userId` - Reference to user
- `token` - JWT token
- `expiresAt` - Token expiration date

### Markers

- `id` - Unique identifier (CUID)
- `title` - Marker title
- `description` - Marker description (optional)
- `latitude` / `longitude` - GPS coordinates
- `address` - Human-readable address (optional)
- `imageUrl` - Marker image URL (optional)
- `userId` - Reference to creator
- `createdAt` / `updatedAt` - Timestamps

## 🔧 Available Scripts

```bash
# Development
bun run dev              # Start development server with hot reload
bun run build           # Build for production
bun run start           # Start production server

# Database
bun run db:generate     # Generate Prisma client
bun run db:migrate      # Run database migrations
bun run db:studio       # Open Prisma Studio
bun run db:seed         # Seed database with sample data
bun run db:reset        # Reset database

# Utilities
bun run type-check      # Check TypeScript types
```

## 🔒 Security Features

- **Password Hashing** with Bun's built-in bcrypt
- **JWT Authentication** with configurable expiration
- **Session Management** with automatic cleanup
- **Input Validation** with comprehensive schemas
- **CORS Protection** with configurable origins
- **Rate Limiting** ready (can be added with middleware)

## 🌐 Production Deployment

1. **Set production environment variables:**

```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-secret
DATABASE_URL=file:./production.db
FRONTEND_URL=https://yourdomain.com
```

2. **Build and deploy:**

```bash
bun run build
bun run db:migrate:prod
bun run start
```

## 🤝 API Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Create Marker

```bash
curl -X POST http://localhost:3000/api/v1/markers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My Location",
    "description": "A great place to visit",
    "latitude": 50.4501,
    "longitude": 30.5234,
    "address": "Kyiv, Ukraine"
  }'
```

## 📄 License

MIT License - feel free to use this project for your own applications!

---

**Built with ❤️ using ElysiaJS, Prisma, and SQLite**
