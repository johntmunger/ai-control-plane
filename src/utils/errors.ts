import { ZodError } from "zod";

export class ToolTimeoutError extends Error {
  constructor(ms: number) {
    super(`Tool execution exceeded ${ms}ms`);
    this.name = "ToolTimeoutError";
  }
}

export class UnknownToolError extends Error {
  constructor(tool: string) {
    super(`Unknown tool: ${tool}`);
    this.name = "UnknownToolError";
  }
}

export class ValidationError extends Error {
  details: unknown;

  constructor(details: unknown) {
    super("Invalid input");
    this.name = "ValidationError";
    this.details = details;
  }
}

export function normalizeError(err: unknown) {
  if (err instanceof ZodError) {
    return {
      type: "validation_error",
      message: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    };
  }

  if (err instanceof ToolTimeoutError) {
    return {
      type: "timeout",
      message: err.message,
    };
  }

  if (err instanceof UnknownToolError) {
    return {
      type: "unknown_tool",
      message: err.message,
    };
  }

  if (err instanceof ValidationError) {
    return {
      type: "validation_error",
      message: err.message,
      details: err.details,
    };
  }

  if (err instanceof Error) {
    return {
      type: "execution_error",
      message: err.message,
    };
  }

  return {
    type: "execution_error",
    message: "Unknown error",
  };
}
