import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { users } from "./routes/users";
import { markers } from "./routes/markers";
import { auth } from "./routes/auth";

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .group("/api", (app) => app.use(auth).use(users).use(markers));

// Auto-start server if script is run directly
if (import.meta.main) {
  app.listen(3000);
  console.log(`🦊 Elysia server is running at localhost:3000`);
}

export { app };
