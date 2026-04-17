import { getTool } from "../tools/registry";
import { KernelRequestSchema } from "../schemas/request";
import { UnknownToolError } from "../tools/errors/types";
import { normalizeError } from "../tools/errors/normalize";
import { withTimeout } from "../utils/timeout";
import { logInvocation } from "../utils/logging";
import type { KernelInput } from "../types/control-plane";
import { TraceContext } from "./trace";

/**
 * 🔒 Enforcement Layer
 *
 * Central place to allow / deny tool execution
 */
function enforceToolAccess(toolName: string) {
  // 🔧 Simple policy for now (expand later)
  const deniedTools: string[] = [];

  if (deniedTools.includes(toolName)) {
    return {
      decision: "deny" as const,
      reason: "tool_not_allowed",
    };
  }

  return {
    decision: "allow" as const,
  };
}

/**
 * Handles execution of a tool request inside the kernel boundary.
 * Guarantees:
 * - tool_invocation is always emitted
 * - tool_result is always emitted (success OR error)
 */
export async function handleKernelRequest(
  request: unknown,
  trace?: TraceContext,
) {
  let id: string | null = null;
  let normalizationApplied = false;
  let toolName: string | null = null;

  try {
    const parsedRequest = KernelRequestSchema.parse(request);

    id = parsedRequest.id ?? null;

    const { tool, arguments: args } = parsedRequest;
    toolName = tool;

    // ✅ ALWAYS emit invocation
    trace?.push({
      type: "tool_invocation",
      tool,
      args,
    });

    // 🔒 ENFORCEMENT
    const enforcement = enforceToolAccess(tool);

    trace?.push({
      type: "enforcement",
      tool,
      decision: enforcement.decision,
      reason: enforcement.reason ?? null,
    });

    if (enforcement.decision === "deny") {
      trace?.push({
        type: "tool_result",
        tool,
        error: {
          type: "policy",
          message: enforcement.reason,
        },
      });

      return {
        id,
        error: {
          type: "policy",
          message: enforcement.reason,
        },
      };
    }

    const toolDef = getTool(tool);

    if (!toolDef) {
      throw new UnknownToolError(tool);
    }

    // --- normalization ---
    let normalizedArgs = args;

    if (toolDef.normalize) {
      const result = toolDef.normalize(args);
      const didChange = JSON.stringify(result) !== JSON.stringify(args);

      normalizedArgs = result;

      if (didChange) {
        try {
          toolDef.schema.parse(result);
          normalizationApplied = true;
        } catch {
          normalizationApplied = false;
        }
      }
    }

    // --- validation ---
    const parsedArgs = toolDef.schema.parse(normalizedArgs);

    console.debug("KERNEL NORMALIZATION:", {
      id,
      tool: toolDef.name,
      raw_args: args,
      normalized_args: normalizedArgs,
      normalization_applied: normalizationApplied,
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

    console.log("KERNEL RESULT:", {
      id,
      tool: toolDef.name,
      result,
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
    const normalized = normalizeError(err);

    trace?.push({
      type: "tool_result",
      tool: toolName ?? "unknown",
      error: normalized,
    });

    return {
      id,
      error: normalized,
      meta: {
        normalization_applied: normalizationApplied,
      },
    };
  }
}

/**
 * Main kernel entry point.
 */
export async function executeKernel(input: KernelInput, trace?: TraceContext) {
  console.log("🔥 EXECUTE KERNEL HIT:", JSON.stringify(input));
  console.log("KERNEL INPUT:", input.type);

  switch (input.type) {
    case "tool": {
      const beforeLength = trace?.events.length ?? 0;

      const result = await handleKernelRequest(
        {
          id: crypto.randomUUID(),
          tool: input.tool,
          arguments: input.arguments,
        },
        trace,
      );

      // 🔒 INVARIANT GUARD
      const afterEvents = trace ? trace.events.slice(beforeLength) : [];

      const hasInvocation = afterEvents.some(
        (e) => e.type === "tool_invocation",
      );

      const hasResult = afterEvents.some((e) => e.type === "tool_result");

      if (!hasInvocation || !hasResult) {
        throw new Error(
          "KERNEL INVARIANT VIOLATION: Missing tool execution trace",
        );
      }

      trace?.push({
        type: "kernel_output",
        outputType: "tool",
      });

      return result;
    }

    case "chat": {
      trace?.push({
        type: "kernel_output",
        outputType: "chat",
      });

      return {
        type: "chat" as const,
        content: input.message,
        timestamp: Date.now(),
      };
    }

    case "refusal": {
      trace?.push({
        type: "kernel_output",
        outputType: "refusal",
      });

      return {
        type: "refusal" as const,
        reason: input.reason ?? "unspecified",
        timestamp: Date.now(),
      };
    }

    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}
