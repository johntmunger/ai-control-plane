import { classifyIntent } from "./intent";
import type { KernelInput } from "../types/control-plane";
import { TraceContext } from "./trace";
import { extractPartial } from "./extractNumbers";

/**
 * Utility: normalize refusal messages
 */
function formatRefusalReason(message: unknown): string {
  if (typeof message === "string") return message;
  if (message === undefined) return "tool_error";
  return JSON.stringify(message);
}

/**
 * 🔥 MAIN ORCHESTRATOR
 *
 * Responsibilities:
 * - Call planner (model or heuristic)
 * - Decide: tool / chat / refusal
 * - Emit planner trace
 *
 * ❗ MUST NOT:
 * - Execute tools
 * - Fabricate tool results
 * - Call kernel
 */
export async function orchestrate(
  prompt: string,
  trace?: TraceContext,
): Promise<KernelInput> {
  const intent = await classifyIntent(prompt);

  trace?.push({
    type: "planner",
    decision: intent.tool ?? intent.type,
  });

  if (intent.type === "refusal") {
    return {
      type: "refusal",
      reason: "intent_refusal",
    };
  }

  const decision =
    intent.tool === "core.add"
      ? {
          tool: "core.add",
          arguments: extractPartial(prompt),
        }
      : {
          type: "chat",
          message: "Fallback response",
        };

  /**
   * Case 1: planner returned tool decision
   */
  if ((decision as { tool?: string }).tool) {
    return {
      type: "tool",
      tool: (decision as { tool: string }).tool,
      arguments: (decision as { arguments?: unknown }).arguments ?? {},
    };
  }

  /**
   * Case 2: planner returned chat object
   */
  if ((decision as { type?: string }).type === "chat") {
    return {
      type: "chat",
      message: (decision as { message?: string }).message ?? "No response",
    };
  }

  /**
   * Fallback: invalid planner output
   */
  trace?.push({
    type: "enforcement",
    action: "refuse",
  });

  return {
    type: "refusal",
    reason: formatRefusalReason("invalid_planner_output"),
  };
}
