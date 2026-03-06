import { handlePolicyRequest } from "./policy";

type ToolCall = {
  tool: string;
  arguments: unknown;
};

async function mockLLM(
  prompt: string,
  history: any[],
): Promise<string | ToolCall> {
  const lower = prompt.toLowerCase();

  if (history.length === 0) {
    const knowledgeQuery =
      lower.includes("what") ||
      lower.includes("how") ||
      lower.includes("why") ||
      lower.includes("explain");

    if (knowledgeQuery) {
      return {
        tool: "searchDocuments",
        arguments: { query: prompt },
      };
    }
  }

  if (history.length > 0) {
    const last = history[history.length - 1];

    if (last.tool === "searchDocuments") {
      const context = last.result?.result?.context ?? "";

      return `Using retrieved context:

${context}

Answer: A JavaScript closure is a function that retains access to variables from its outer lexical scope even after that scope has finished executing.`;
    }
  }

  return "Task complete.";
}

export async function orchestrate(prompt: string) {
  const history: any[] = [];

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
