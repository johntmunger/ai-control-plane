import { claudeAdapter } from "./claude";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { ToolCall } from "./interface";

export const modelRouter = {
  plan: async (
    prompt: string,
    history: MessageParam[],
  ): Promise<string | ToolCall> => {
    return claudeAdapter.plan(prompt, history);
  },
};
