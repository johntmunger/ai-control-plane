import { handlePolicyRequest } from "./policy";
import { mockLLM } from "../models/mockLLM";

export async function orchestrate(prompt: string) {
  const history: unknown[] = [];

  while (true) {
    const decision = await mockLLM(prompt, history);

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

    history.push({
      tool: decision.tool,
      result,
    });
  }
}
