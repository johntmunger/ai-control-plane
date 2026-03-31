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
