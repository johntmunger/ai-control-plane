export type ToolCall = {
  tool: string;
  arguments: unknown;
};

export async function mockLLM(
  prompt: string,
  history: unknown[],
): Promise<string | ToolCall> {
  if (history.length === 0 && prompt.includes("add")) {
    return {
      tool: "add",
      arguments: { a: 3, b: 5 },
    };
  }

  if (history.length === 1 && prompt.includes("sleep")) {
    return {
      tool: "sleep",
      arguments: { ms: 1000 },
    };
  }

  return "Task complete.";
}
