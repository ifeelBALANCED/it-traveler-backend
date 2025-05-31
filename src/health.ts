import { Elysia } from "elysia";

const healthApp = new Elysia().get("/health", () => ({
  status: "OK",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

const HEALTH_PORT = process.env.HEALTH_PORT || 5000;
healthApp.listen(HEALTH_PORT, () => {
  console.log(`💚 Health Check: http://localhost:${HEALTH_PORT}/health`);
});
