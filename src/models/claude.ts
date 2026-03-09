import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { ModelAdapter } from "./interface";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const claudeAdapter: ModelAdapter = {
  async plan(prompt: string, history: MessageParam[]) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? "claude-3-haiku-20240307",
      max_tokens: 1024,
      temperature: 0.2,

      system: `
      You are an AI agent running inside a tool-enabled runtime.

You have access to the following tool:

searchDocuments(query: string)

Rules:

1. If the user asks a knowledge question, call searchDocuments.
2. Only call the tool once.
3. After tool results are returned, generate the final answer using the retrieved context.
4. Do NOT call the tool again after results are available.

Tool calls must be returned as JSON:

{
  "tool": "searchDocuments",
  "arguments": { "query": "..." }
}

Final answers must be normal text explanations.
      `,

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

      // Try direct JSON parse first
      try {
        const parsed = JSON.parse(text);
        if (parsed.tool) return parsed;
      } catch {}

      // Try extracting a JSON block from the response
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1 && end > start) {
        const jsonCandidate = text.slice(start, end + 1);

        try {
          const parsed = JSON.parse(jsonCandidate);
          if (parsed.tool) return parsed;
        } catch {}
      }

      return text;
    }

    return "Task complete.";
  },
};
