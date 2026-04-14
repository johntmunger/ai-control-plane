import { getTool } from "../tools/registry";
import { KernelRequestSchema } from "../schemas/request";
import { UnknownToolError } from "../tools/errors/types";
import { normalizeError } from "../tools/errors/normalize";
import { withTimeout } from "../utils/timeout";
import { logInvocation } from "../utils/logging";
import type { KernelInput } from "../types/control-plane";
import { TraceContext } from "./trace";

export async function handleKernelRequest(
  request: unknown,
  trace?: TraceContext,
) {
  let id: string | null = null;
  let normalizationApplied = false; // ✅ single source of truth

  try {
    const parsedRequest = KernelRequestSchema.parse(request);

    id = parsedRequest.id ?? null;

    const { tool, arguments: args } = parsedRequest;

    const toolDef = getTool(tool);

    if (!toolDef) {
      throw new UnknownToolError(tool);
    }

    // --- normalization (optional, tool-scoped) ---
    let normalizedArgs = args;

    if (toolDef.normalize) {
      const result = toolDef.normalize(args);

      const didChange = JSON.stringify(result) !== JSON.stringify(args);

      normalizedArgs = result;

      // ✅ ONLY mark true if change AND VALID
      if (didChange) {
        try {
          toolDef.schema.parse(result);
          normalizationApplied = true;
        } catch {
          normalizationApplied = false;
        }
      }
    }

    // --- validation (authoritative) ---
    const parsedArgs = toolDef.schema.parse(normalizedArgs);

    // --- observability ---
    console.debug("KERNEL NORMALIZATION:", {
      id,
      tool: toolDef.name,
      raw_args: args,
      normalized_args: normalizedArgs,
      normalization_applied: normalizationApplied,
    });

    trace?.push({
      type: "tool_invocation",
      tool: toolDef.name,
      args: parsedArgs,
    });

    // --- execution ---
    logInvocation(id ?? "unknown", toolDef.name, parsedArgs);

    const startTime = Date.now();
    const result = await withTimeout(toolDef.execute(parsedArgs), 2000);
    const duration = Date.now() - startTime;

    trace?.push({
      type: "tool_result",
      tool: toolDef.name,
      result,
      duration,
    });

    console.error("KERNEL RESULT:", {
      id,
      result,
      tool: toolDef.name,
      duration,
    });

    return {
      id,
      result,
      tool: toolDef.name,
      duration,
      meta: {
        normalization_applied: normalizationApplied,
      },
    };
  } catch (err) {
    return {
      id,
      error: normalizeError(err),
      meta: {
        normalization_applied: normalizationApplied,
      },
    };
  }
}

/** Uniform entry for orchestrator-shaped `KernelInput` (tool / chat / refusal). */
export async function executeKernel(input: KernelInput, trace?: TraceContext) {
  console.log("KERNEL INPUT:", input.type);

  switch (input.type) {
    case "tool": {
      const result = await handleKernelRequest(
        {
          id: crypto.randomUUID(),
          tool: input.tool,
          arguments: input.arguments,
        },
        trace,
      );

      trace?.push({
        type: "kernel_output",
        outputType: "chat",
      });

      return result;
    }

    case "chat":
      trace?.push({
        type: "kernel_output",
        outputType: "chat",
      });
      return {
        type: "chat" as const,
        content: input.message,
        timestamp: Date.now(),
      };

    case "refusal":
      trace?.push({
        type: "kernel_output",
        outputType: "refusal",
      });
      return {
        type: "refusal" as const,
        reason: input.reason ?? "unspecified",
        timestamp: Date.now(),
      };

    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}
