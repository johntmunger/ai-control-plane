import { modelRouter } from "../models/router";

export type Intent = {
  requiresTool: boolean;
  type: "tool" | "chat" | "refusal";
};

export async function classifyIntent(prompt: string): Promise<Intent> {
  const response = await modelRouter.plan(
    `You are an intent classifier.

Return ONLY valid JSON. No extra text.

Schema:
{
  "requiresTool": boolean,
  "type": "tool" | "chat" | "refusal"
}

Rules:
- "tool" → if the request requires computation or external execution
- "chat" → normal conversational response
- "refusal" → unsafe / disallowed / impossible requests

If unsure, return:
{ "requiresTool": false, "type": "chat" }

Prompt: ${prompt}`,
    [],
    [],
  );

  // ✅ Case 1: model returns string → parse JSON
  if (typeof response === "string") {
    try {
      const parsed = JSON.parse(response);

      // ✅ validate type safely
      const type =
        parsed.type === "tool" ||
        parsed.type === "chat" ||
        parsed.type === "refusal"
          ? parsed.type
          : "chat";

      // ✅ explicit refusal handling
      if (type === "refusal") {
        return {
          requiresTool: false,
          type: "refusal",
        };
      }

      return {
        requiresTool: Boolean(parsed.requiresTool),
        type,
      };
    } catch {
      // fallback if JSON parsing fails
      return { requiresTool: false, type: "chat" };
    }
  }

  // ✅ Case 2: model returned structured object (tool-style)
  if (
    typeof response === "object" &&
    response !== null &&
    "tool" in response &&
    typeof response.tool === "string"
  ) {
    return {
      requiresTool: true,
      type: "tool",
    };
  }

  // ✅ Safe fallback (never break system)
  return { requiresTool: false, type: "chat" };
}
