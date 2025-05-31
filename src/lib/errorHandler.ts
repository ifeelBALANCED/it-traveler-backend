import { Elysia } from "elysia";

export const errorHandler = new Elysia().onError(({ code, error, set }) => {
  console.error(`Error [${code}]:`, error);

  switch (code) {
    case "VALIDATION":
      set.status = 400;
      return {
        error: "Validation failed",
        details: error.message,
      };

    case "NOT_FOUND":
      set.status = 404;
      return {
        error: "Route not found",
      };

    case "PARSE":
      set.status = 400;
      return {
        error: "Invalid JSON format",
      };

    case "INTERNAL_SERVER_ERROR":
      set.status = 500;
      return {
        error: "Internal server error",
      };

    default:
      set.status = 500;
      return {
        error: "Something went wrong",
      };
  }
});
