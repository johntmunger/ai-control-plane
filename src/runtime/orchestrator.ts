import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { modelRouter } from "../models/router";
import { classifyIntent } from "./intent";
import { listToolMetadata } from "../tools/registry";
import type { KernelInput } from "../types/control-plane";
import { TraceContext } from "./trace";

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
  const history: MessageParam[] = [];
  const tools = listToolMetadata();

  // 🔧 TEMP: heuristic planner (replace with modelRouter.plan later)
  const decision = prompt.toLowerCase().includes("add")
    ? {
        tool: "core.add",
        arguments: { a: 2, b: 3 },
      }
    : {
        type: "chat",
        message: "Fallback response",
      };

  // 🧠 TRACE: planner decision
  trace?.push({
    type: "planner",
    decision: (decision as any)?.tool ?? (decision as any)?.type ?? "unknown",
  });

  /**
   * Case 1: planner returned raw text (string)
   */
  if (typeof decision === "string") {
    const intent = await classifyIntent(prompt);

    // 🔒 If tool required but not used → refusal
    if (intent.requiresTool) {
      trace?.push({
        type: "enforcement",
        action: "refuse",
      });

      return {
        type: "refusal",
        reason: "tool_required_but_not_used",
      };
    }

    return {
      type: "chat",
      message: decision,
    };
  }

  /**
   * Case 2: planner returned tool decision
   */
  if ((decision as any).tool) {
    return {
      type: "tool",
      tool: (decision as any).tool,
      arguments: (decision as any).arguments ?? {},
    };
  }

  /**
   * Case 3: planner returned chat object
   */
  if ((decision as any).type === "chat") {
    return {
      type: "chat",
      message: (decision as any).message ?? "No response",
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
