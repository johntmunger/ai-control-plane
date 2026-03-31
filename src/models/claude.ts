import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { ModelAdapter } from "./interface";
import type { ToolMetadata } from "../tools/registry";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 🔹 Convert Zod schema → simple argument description
function formatSchema(schema: any): string {
  try {
    const shape = schema.shape;

    if (!shape) return "{ ... }";

    const fields = Object.keys(shape).map((key) => {
      return `"${key}": string`;
    });

    return `{ ${fields.join(", ")} }`;
  } catch {
    return "{ ... }";
  }
}

// 🔹 Build dynamic system prompt from tools
function buildSystemPrompt(tools: ToolMetadata[]) {
  const toolList = tools
    .map((t) => {
      const args = formatSchema(t.schema);

      return `- ${t.name}: ${t.description}

arguments: ${args}`;
    })
    .join("\n\n");

  return `
    You are an AI agent running inside a tool-enabled runtime.
    
    Available tools:
    
    ${toolList}
    
    Rules:
    
    If the user request requires external information or actions, use a tool.
    
    Always use the exact tool name as listed above.
    
    Match the argument structure exactly as shown.
    
    Argument rules (VERY IMPORTANT):
    - Only use values explicitly present in the user input
    - Do NOT guess, infer, or invent values
    - Do NOT substitute unrelated values (e.g., "banana" → 3 is NOT allowed)
    - If a value cannot be safely converted, pass it through unchanged
    
    Return tool calls as JSON:
    {
    "tool": "",
    "arguments": { ... }
    }
    
    After receiving tool results, use them to produce a final answer.
    
    If no tool is needed, respond with a final answer.
    `;
}

export const claudeAdapter: ModelAdapter = {
  async plan(prompt: string, history: MessageParam[], tools: ToolMetadata[]) {
    const systemPrompt = buildSystemPrompt(tools);

    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? "claude-3-haiku-20240307",
      max_tokens: 1024,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        ...history,
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];

    if (content.type === "text") {
      const text = content.text.trim();

      // 🔹 Try direct JSON parse
      try {
        const parsed = JSON.parse(text);
        if (parsed.tool) return parsed;
      } catch {}

      // 🔹 Try extracting JSON block
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1 && end > start) {
        const jsonCandidate = text.slice(start, end + 1);

        try {
          const parsed = JSON.parse(jsonCandidate);
          if (parsed.tool) return parsed;
        } catch {}
      }

      // 🔹 Otherwise treat as final answer
      return text;
    }

    return "Task complete.";
  },
};
