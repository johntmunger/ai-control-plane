import { ZodError } from "zod";
import { ToolTimeoutError, UnknownToolError, ValidationError } from "./types";

export function normalizeError(err: unknown) {
  if (err instanceof ZodError) {
    return {
      type: "deterministic",
      subtype: "validation",
      message: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    };
  }

  if (err instanceof ValidationError) {
    return {
      type: "deterministic",
      subtype: "validation",
      message: err.message,
      details: err.details,
    };
  }

  if (err instanceof UnknownToolError) {
    return {
      type: "deterministic",
      subtype: "unknown_tool",
      message: err.message,
    };
  }

  if (err instanceof ToolTimeoutError) {
    return {
      type: "transient",
      subtype: "timeout",
      message: err.message,
    };
  }

  if (err instanceof Error) {
    return {
      type: "transient",
      subtype: "execution",
      message: err.message,
    };
  }

  return {
    type: "transient",
    subtype: "unknown",
    message: "Unknown error",
  };
}
