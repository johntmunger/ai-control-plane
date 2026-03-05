"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const node_readline_1 = __importDefault(require("node:readline"));
// -----------------------------
// Tool Schemas
// -----------------------------
const EchoSchema = zod_1.z.object({
    message: zod_1.z.string(),
    fail: zod_1.z.boolean().optional(),
});
const AddSchema = zod_1.z.object({
    a: zod_1.z.number(),
    b: zod_1.z.number(),
});
const SleepSchema = zod_1.z.object({
    ms: zod_1.z.number().max(5000),
});
// -----------------------------
// Tool Implementations
// -----------------------------
async function echoTool(input) {
    if (input.fail) {
        throw new Error("Simulated failure from echoTool");
    }
    return {
        echoed: input.message,
        timestamp: Date.now(),
    };
}
async function addTool(input) {
    return {
        result: input.a + input.b,
    };
}
async function sleepTool(input) {
    await new Promise((resolve) => setTimeout(resolve, input.ms));
    return { slept: input.ms };
}
// Define Tools Individually With Inferred Types
const echoToolDef = {
    schema: EchoSchema,
    execute: echoTool,
};
const addToolDef = {
    schema: AddSchema,
    execute: addTool,
};
const sleepToolDef = {
    schema: SleepSchema,
    execute: sleepTool,
};
// Define Tools Object
const tools = {
    echo: echoToolDef,
    add: addToolDef,
    sleep: sleepToolDef,
};
// -----------------------------
// Error Classes
// -----------------------------
class ToolTimeoutError extends Error {
    constructor(ms) {
        super(`Tool execution exceeded ${ms}ms`);
        this.name = "ToolTimeoutError";
    }
}
class UnknownToolError extends Error {
    constructor(tool) {
        super(`Unknown tool: ${tool}`);
        this.name = "UnknownToolError";
    }
}
class ValidationError extends Error {
    constructor(details) {
        super("Invalid input");
        this.name = "ValidationError";
        this.details = details;
    }
}
// -----------------------------
// Timeout Wrapper
// -----------------------------
async function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new ToolTimeoutError(ms)), ms)),
    ]);
}
// -----------------------------
// Logging
// -----------------------------
function logInvocation(id, tool, args) {
    console.error(JSON.stringify({
        type: "invocation",
        id,
        tool,
        args,
        timestamp: Date.now(),
    }));
}
// -----------------------------
// Stdio Server
// -----------------------------
const rl = node_readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
rl.on("line", async (line) => {
    let request;
    try {
        request = JSON.parse(line);
        const { id, tool, arguments: args } = request;
        if (!(tool in tools)) {
            throw new UnknownToolError(tool);
        }
        const toolDef = tools[tool];
        // Validate input with Zod
        const parsed = toolDef.schema.safeParse(args);
        if (!parsed.success) {
            throw new ValidationError(parsed.error.format());
        }
        logInvocation(id, tool, parsed.data);
        // Execute with timeout (2 seconds)
        const result = await withTimeout(toolDef.execute(parsed.data), 2000);
        process.stdout.write(JSON.stringify({
            id,
            result,
        }) + "\n");
    }
    catch (err) {
        let errorPayload;
        if (err instanceof ToolTimeoutError) {
            errorPayload = {
                type: "timeout",
                message: err.message,
            };
        }
        else if (err instanceof UnknownToolError) {
            errorPayload = {
                type: "unknown_tool",
                message: err.message,
            };
        }
        else if (err instanceof ValidationError) {
            errorPayload = {
                type: "validation_error",
                message: err.message,
                details: err.details,
            };
        }
        else {
            errorPayload = {
                type: "execution_error",
                message: err instanceof Error ? err.message : "Unknown error",
            };
        }
        process.stdout.write(JSON.stringify({
            id: request?.id ?? null,
            error: errorPayload,
        }) + "\n");
    }
});
