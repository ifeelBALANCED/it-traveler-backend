import { cors } from "@elysiajs/cors";

export const corsConfig = cors({
  origin:
    "production" === process.env.NODE_ENV
      ? process.env.FRONTEND_URL || false
      : true, // Allow all origins in development
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
