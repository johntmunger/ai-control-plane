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

    const tools = listToolMetadata();

    const decision = await modelRouter.plan(prompt, history, tools);

    if (typeof decision === "string") {
      return {
        type: "final",
        message: decision,
        history,
      };
    }

    const toolRequest = {
      id: crypto.randomUUID(),
      tool: decision.tool,
      arguments: decision.arguments,
    };

    const result = await handlePolicyRequest(toolRequest);

    const isError = "error" in result;
    const error = isError ? result.error : undefined;

    const observation = error
      ? `ERROR (step ${steps}, tool ${decision.tool}): ${JSON.stringify(error)}`
      : JSON.stringify(result.result, null, 2);

    history.push({
      role: "assistant",
      content: `Tool result (${decision.tool}):

${observation}

Now decide what to do next.`,
    });

    if (error?.type === "deterministic") {
      return {
        type: "final",
        message: `Tool failed: ${error.message}`,
        history,
      };
    }
  }

  return {
    type: "final",
    message: "Agent stopped after max steps.",
    history,
  };
}
