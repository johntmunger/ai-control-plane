import { claudeAdapter } from "./claude";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { ToolCall } from "./interface";

type ToolDescriptor = {
  name: string;
  description: string;
};

export const modelRouter = {
  plan: async (
    prompt: string,
    history: MessageParam[],
    tools: ToolDescriptor[],
  ): Promise<string | ToolCall> => {
    return claudeAdapter.plan(prompt, history, tools);
  },
};
