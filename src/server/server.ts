import { z } from "zod";
import readline from "node:readline";

// -----------------------------
// Tool Schemas
// -----------------------------

const EchoSchema = z.object({
  message: z.string(),
  fail: z.boolean().optional(),
});

const AddSchema = z.object({
  a: z.number(),
  b: z.number(),
});

const SleepSchema = z.object({
  ms: z.number().max(5000),
});

// -----------------------------
// Tool Implementations
// -----------------------------

async function echoTool(input: z.infer<typeof EchoSchema>) {
  if (input.fail) {
    throw new Error("Simulated failure from echoTool");
  }

  return {
    echoed: input.message,
    timestamp: Date.now(),
  };
}

async function addTool(input: z.infer<typeof AddSchema>) {
  return {
    result: input.a + input.b,
  };
}

async function sleepTool(input: z.infer<typeof SleepSchema>) {
  await new Promise((resolve) => setTimeout(resolve, input.ms));
  return { slept: input.ms };
}

// -----------------------------
// Tool Definitions
// -----------------------------

type ToolDefinition<T> = {
  schema: z.ZodType<T>;
  execute: (input: T) => Promise<unknown>;
};

// Define Tools Individually With Inferred Types
const echoToolDef: ToolDefinition<z.infer<typeof EchoSchema>> = {
  schema: EchoSchema,
  execute: echoTool,
};

const addToolDef: ToolDefinition<z.infer<typeof AddSchema>> = {
  schema: AddSchema,
  execute: addTool,
};

const sleepToolDef: ToolDefinition<z.infer<typeof SleepSchema>> = {
  schema: SleepSchema,
  execute: sleepTool,
};

// Define Tools Object
const tools = {
  echo: echoToolDef,
  add: addToolDef,
  sleep: sleepToolDef,
} as const;

type ToolName = keyof typeof tools;

// -----------------------------
// Error Classes
// -----------------------------

class ToolTimeoutError extends Error {
  constructor(ms: number) {
    super(`Tool execution exceeded ${ms}ms`);
    this.name = "ToolTimeoutError";
  }
}

class UnknownToolError extends Error {
  constructor(tool: string) {
    super(`Unknown tool: ${tool}`);
    this.name = "UnknownToolError";
  }
}

class ValidationError extends Error {
  details: unknown;
  constructor(details: unknown) {
    super("Invalid input");
    this.name = "ValidationError";
    this.details = details;
  }
}

function normalizeError(err: unknown) {
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

// -----------------------------
// Timeout Wrapper
// -----------------------------

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new ToolTimeoutError(ms)), ms),
    ),
  ]);
}

// -----------------------------
// Logging
// -----------------------------

function logInvocation(id: string, tool: string, args: unknown) {
  console.error(
    JSON.stringify({
      type: "invocation",
      id,
      tool,
      args,
      timestamp: Date.now(),
    }),
  );
}

// -----------------------------
// Stdio Interface
// -----------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// -----------------------------
// Kernel Request Schema
// -----------------------------

// Schema
const KernelRequestSchema = z.object({
  id: z.string().nullable(),
  tool: z.string(),
  arguments: z.unknown(),
});

// -----------------------------
// Kernel Handle Request
// -----------------------------

async function handleKernelRequest(request: unknown) {
  let id: string | null = null;

  try {
    const parsedRequest = KernelRequestSchema.parse(request);
    id = parsedRequest.id ?? null;

    const { tool, arguments: args } = parsedRequest;

    if (!(tool in tools)) {
      throw new UnknownToolError(tool);
    }

    const toolName = tool as ToolName;
    const toolDef = tools[toolName];
    const parsedArgs = toolDef.schema.parse(args);

    logInvocation(id ?? "unknown", toolName, parsedArgs);

    // @ts-ignore
    const result = await withTimeout(toolDef.execute(parsedArgs), 2000);

    return { id, result };
  } catch (err) {
    return {
      id,
      error: normalizeError(err),
    };
  }
}

// -----------------------------
// Entry Policy Layer
// -----------------------------

const ALLOWED_TOOLS = new Set(["echo", "add", "sleep"]);
let SAFE_MODE = false;

async function handlePolicyRequest(request: unknown) {
  try {
    const parsed = KernelRequestSchema.parse(request);

    const { tool } = parsed;

    // Tool allowlist
    if (!ALLOWED_TOOLS.has(tool)) {
      return {
        id: parsed.id ?? null,
        error: {
          type: "policy_violation",
          message: `Tool not allowed: ${tool}`,
        },
      };
    }

    // Safe mode guard
    if (SAFE_MODE && tool !== "echo") {
      return {
        id: parsed.id ?? null,
        error: {
          type: "policy_violation",
          message: "System is in safe mode",
        },
      };
    }

    // If policy passes → call kernel
    return await handleKernelRequest(parsed);
  } catch (err) {
    return {
      id: null,
      error: normalizeError(err),
    };
  }
}

// -----------------------------
// Orchestrator (Agent Loop)
// -----------------------------

type ToolCall = {
  tool: string;
  arguments: unknown;
};

async function mockLLM(
  prompt: string,
  history: unknown[],
): Promise<string | ToolCall> {
  // Very simple reasoning demo

  if (history.length === 0 && prompt.includes("add")) {
    return {
      tool: "add",
      arguments: { a: 3, b: 5 },
    };
  }

  if (history.length === 1 && prompt.includes("sleep")) {
    return {
      tool: "sleep",
      arguments: { ms: 1000 },
    };
  }

  return "Task complete.";
}

async function orchestrate(prompt: string) {
  const history: unknown[] = [];

  while (true) {
    const decision = await mockLLM(prompt, history);

    // Model produced final response
    if (typeof decision === "string") {
      return {
        type: "final",
        message: decision,
        history,
      };
    }

    // Model requested tool
    const toolRequest = {
      id: crypto.randomUUID(),
      tool: decision.tool,
      arguments: decision.arguments,
    };

    const result = await handlePolicyRequest(toolRequest);

    history.push({
      tool: decision.tool,
      result,
    });
  }
}

// -----------------------------
// STDIO HANDLER
// -----------------------------

rl.on("line", async (line) => {
  let input;

  try {
    input = JSON.parse(line);
  } catch {
    process.stdout.write(
      JSON.stringify({
        error: {
          type: "invalid_json",
          message: "Malformed JSON request",
        },
      }) + "\n",
    );
    return;
  }

  // If this looks like a tool request → go through policy/kernel
  if ("tool" in input) {
    const response = await handlePolicyRequest(input);
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  // Otherwise treat as user prompt → orchestrator
  if ("prompt" in input) {
    const response = await orchestrate(input.prompt);
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  process.stdout.write(
    JSON.stringify({
      error: {
        type: "invalid_request",
        message: "Unknown request type",
      },
    }) + "\n",
  );
});
