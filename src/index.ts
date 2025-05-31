import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { jwt } from "@elysiajs/jwt";
import { users } from "./routes/users";
import { markers } from "./routes/markers";
import { auth } from "./routes/auth";

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "secret" }));

// Define routes on separate Elysia instances first
const authRoutes = new Elysia().use(auth);
const userRoutes = new Elysia().use(users);
const markerRoutes = new Elysia().use(markers);

// Then mount them under the /api/v1 group
app
  .group("/api/v1", (group) =>
    group.use(authRoutes).use(userRoutes).use(markerRoutes)
  )
  .get("/", () => ({
    name: "Markers API",
    version: "1.0.0",
  }))
  .listen(3000);

console.log(
  `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`
);

export { app };
