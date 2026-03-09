import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { modelRouter } from "../models/router";
import { handlePolicyRequest } from "./policy";

export async function orchestrate(prompt: string) {
  const history: MessageParam[] = [];

  let steps = 0;

  while (steps < 4) {
    steps++;

    const decision = await modelRouter.plan(prompt, history);

    // Model produced final answer
    if (typeof decision === "string") {
      return {
        type: "final",
        message: decision,
        history,
      };
    }

    // Prevent repeated tool calls
    const toolAlreadyUsed = history.some(
      (h) =>
        typeof h.content === "string" &&
        h.content.includes("Retrieved context"),
    );

    if (toolAlreadyUsed) {
      const answer = await modelRouter.plan(
        `Using the retrieved context above, answer the user's question:\n\n${prompt}`,
        history,
      );

      return {
        type: "final",
        message:
          typeof answer === "string"
            ? answer
            : "Answer generated from retrieved context.",
        history,
      };
    }

    const toolRequest = {
      id: crypto.randomUUID(),
      tool: decision.tool,
      arguments: decision.arguments,
    };

    const result = await handlePolicyRequest(toolRequest);

    const context = (result.result as any)?.context ?? "";

    history.push({
      role: "assistant",
      content: `Retrieved context:\n\n${context}`,
    });
  }

  return {
    type: "final",
    message: "Agent stopped after max steps.",
    history,
  };
}
