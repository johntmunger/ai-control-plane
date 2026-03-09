import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export type ToolCall = {
  tool: string;
  arguments: unknown;
};

export interface ModelAdapter {
  plan(prompt: string, history: MessageParam[]): Promise<string | ToolCall>;
}
