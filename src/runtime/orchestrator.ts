import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { modelRouter } from "../models/router";
import { handlePolicyRequest } from "./policy";
import { listToolMetadata } from "../tools/registry";

export async function orchestrate(prompt: string) {
  const history: MessageParam[] = [];

  let steps = 0;
  const maxSteps = 6;

  while (steps < maxSteps) {
    steps++;

    // 🔹 NEW: expose tools to planner
    const tools = listToolMetadata();

    console.error(
      "Available tools:",
      tools.map((tool) => tool.name),
    );

    console.error("TOOLS OBJECT:", tools);

    const decision = await modelRouter.plan(prompt, history, tools);

    console.error("MODEL DECISION:", decision);

    // ✅ Final answer
    if (typeof decision === "string") {
      return {
        type: "final",
        message: decision,
        history,
      };
    }

    // ✅ Tool call
    const toolRequest = {
      id: crypto.randomUUID(),
      tool: decision.tool,
      arguments: decision.arguments,
    };

    const result = await handlePolicyRequest(toolRequest);

    // 🔹 NEW: generalized observation (not just "context")
    const observation = result.error
      ? `ERROR: ${JSON.stringify(result.error)}`
      : JSON.stringify(result.result, null, 2);

    history.push({
      role: "assistant",
      content: `Tool result (${tool}):
      
      ${observation}
      
      Now use this result to answer the user's question. Do NOT call any more tools.`,
    });
  }

  return {
    type: "final",
    message: "Agent stopped after max steps.",
    history,
  };
}
