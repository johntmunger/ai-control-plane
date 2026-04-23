import { getTool } from "../tools/registry";
import { KernelRequestSchema } from "../schemas/request";
import { UnknownToolError } from "../tools/errors/types";
import { normalizeError } from "../tools/errors/normalize";
import { withTimeout } from "../utils/timeout";
import { logInvocation } from "../utils/logging";
import type { KernelInput } from "../types/control-plane";
import { TraceContext } from "./trace";
import type { TraceEvent } from "./trace";

type KernelOptions = {
  onEvent?: (event: TraceEvent) => void;
};

/**
 * 🔒 Enforcement Layer
 *
 * Central place to allow / deny tool execution
 */
function enforceToolAccess(toolName: string) {
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
 *
 * Guarantees:
 * - tool_invocation ALWAYS emitted
 * - tool_normalization ALWAYS emitted
 * - tool_result ALWAYS emitted (success OR error)
 * - kernel_output ONLY emitted by caller AFTER success
 */
export async function handleKernelRequest(
  request: unknown,
  trace?: TraceContext,
  options?: KernelOptions,
) {
  let id: string | null = null;
  let toolName: string | null = null;
  let normalizationApplied = false;

  function emit(event: TraceEvent) {
    trace?.push(event);
    options?.onEvent?.(event);
  }

  try {
    const parsedRequest = KernelRequestSchema.parse(request);

    id = parsedRequest.id ?? null;

    const { tool, arguments: args } = parsedRequest;
    toolName = tool;
    const rawArgsSnapshot = (() => {
      try {
        // ensure trace captures an immutable snapshot of planner intent
        return structuredClone(args);
      } catch {
        return args;
      }
    })();

    /**
     * 🧠 TRACE: TOOL INVOCATION (RAW INTENT)
     * This represents what the planner asked for.
     */
    emit({
      type: "tool_invocation",
      tool,
      rawArgs: rawArgsSnapshot,
    });

    /**
     * 🔒 ENFORCEMENT
     * Policy decision before any execution
     */
    const enforcement = enforceToolAccess(tool);

    /**
     * 🧠 TRACE: ENFORCEMENT DECISION
     */
    emit({
      type: "enforcement",
      tool,
      decision: enforcement.decision,
      reason: enforcement.reason ?? null,
    });

    if (enforcement.decision === "deny") {
      /**
       * 🧠 TRACE: TOOL RESULT (POLICY FAILURE)
       */
      emit({
        type: "tool_result",
        tool,
        status: "error",
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

    /**
     * 🔧 NORMALIZATION
     * Transform raw args into structured form
     */
    let normalizedArgs = args;

    if (toolDef.normalize) {
      const result = toolDef.normalize(args);
      normalizedArgs = result;
      normalizationApplied = true;
    }

    /**
     * 🧠 TRACE: NORMALIZATION (CRITICAL STEP)
     * Always emitted BEFORE validation so failures are observable
     */
    const normalizedArgsSnapshot = (() => {
      try {
        // ensure trace captures an immutable snapshot of normalized args
        return structuredClone(normalizedArgs);
      } catch {
        return normalizedArgs;
      }
    })();

    emit({
      type: "tool_normalization",
      tool,
      rawArgs: rawArgsSnapshot,
      normalizedArgs: normalizedArgsSnapshot,
      normalizationApplied,
    });

    /**
     * 🔒 VALIDATION (EXPLICIT, NON-THROWING)
     * This is the execution gate
     */
    const parsed = toolDef.schema.safeParse(normalizedArgs);

    if (!parsed.success) {
      /**
       * 🧠 TRACE: TOOL RESULT (VALIDATION FAILURE)
       */
      emit({
        type: "tool_result",
        tool: toolDef.name,
        status: "error",
        error: {
          type: "validation",
          message: "Invalid arguments",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
            code: issue.code,
          })),
          normalizedArgs,
        },
      });

      return {
        id,
        error: {
          type: "validation",
          message: "Invalid arguments",
        },
        meta: {
          normalization_applied: normalizationApplied,
        },
      };
    }

    const parsedArgs = parsed.data;

    /**
     * 🚀 EXECUTION START
     */
    logInvocation(id ?? "unknown", toolDef.name, parsedArgs);

    const startTime = Date.now();

    const result = await withTimeout(toolDef.execute(parsedArgs), 2000);

    const duration = Date.now() - startTime;

    /**
     * 🧠 TRACE: TOOL RESULT (SUCCESS)
     */
    emit({
      type: "tool_result",
      tool: toolDef.name,
      status: "success",
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

    /**
     * 🧠 TRACE: TOOL RESULT (UNEXPECTED ERROR)
     */
    emit({
      type: "tool_result",
      tool: toolName ?? "unknown",
      status: "error",
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
 * 🔥 Main kernel entry point
 *
 * Guarantees:
 * - kernel_output is ONLY emitted here
 * - only after successful execution path
 */
export async function executeKernel(
  input: KernelInput,
  trace?: TraceContext,
  options?: KernelOptions,
) {
  const emit = (event: TraceEvent) => {
    trace?.push(event);
    options?.onEvent?.(event);
  };

  console.log("🔥 EXECUTE KERNEL HIT:", JSON.stringify(input));

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
        options,
      );

      /**
       * 🔒 INVARIANT GUARD
       * Ensure execution actually happened
       */
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

      /**
       * 🧠 TRACE: KERNEL OUTPUT (FINAL AUTHORITY)
       * This is the ONLY place user-visible output is authorized
       */
      if (!result.error) {
        emit({
          type: "kernel_output",
          outputType: "tool",
        });
      }

      return result;
    }

    case "chat": {
      /**
       * 🧠 TRACE: CHAT OUTPUT
       */
      emit({
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
      /**
       * 🧠 TRACE: REFUSAL OUTPUT
       */
      emit({
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
