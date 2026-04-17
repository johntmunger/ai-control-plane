import { modelRouter } from "../models/router";
import { extractNumbers, hasTwoResolvableAddends } from "./extractNumbers";

export type Intent = {
  requiresTool: boolean;
  type: "tool" | "chat" | "refusal";
  /** Present when the classifier (or heuristic) picks a concrete tool */
  tool?: string | null;
};

function inferCoreAddFromPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const mentionsAdd =
    /\b(add|plus|sum)\b/.test(lower) || /\+/.test(prompt);
  if (!mentionsAdd) return false;
  return extractNumbers(prompt) !== null || hasTwoResolvableAddends(prompt);
}

function augmentIntent(prompt: string, intent: Intent): Intent {
  if (intent.type === "refusal") return intent;

  if (intent.tool) return intent;

  if (inferCoreAddFromPrompt(prompt)) {
    return {
      requiresTool: true,
      type: "tool",
      tool: "core.add",
    };
  }

  return intent;
}

export async function classifyIntent(prompt: string): Promise<Intent> {
  let response: Awaited<ReturnType<typeof modelRouter.plan>>;

  try {
    response = await modelRouter.plan(
      `You are an intent classifier.

Return ONLY valid JSON. No extra text.

Schema:
{
  "requiresTool": boolean,
  "type": "tool" | "chat" | "refusal",
  "tool": string | null
}

Rules:
- "tool" → if the request requires computation or external execution
- "chat" → normal conversational response
- "refusal" → unsafe / disallowed / impossible requests
- "tool": when type is "tool", set to the exact tool id if known (e.g. "core.add"), otherwise null

If unsure, return:
{ "requiresTool": false, "type": "chat", "tool": null }

Prompt: ${prompt}`,
      [],
      [],
    );
  } catch {
    return augmentIntent(prompt, {
      requiresTool: false,
      type: "chat",
      tool: null,
    });
  }

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

      const tool =
        typeof parsed.tool === "string" && parsed.tool.length > 0
          ? parsed.tool
          : null;

      // ✅ explicit refusal handling
      if (type === "refusal") {
        return augmentIntent(prompt, {
          requiresTool: false,
          type: "refusal",
          tool: null,
        });
      }

      return augmentIntent(prompt, {
        requiresTool: Boolean(parsed.requiresTool),
        type,
        tool,
      });
    } catch {
      // fallback if JSON parsing fails
      return augmentIntent(prompt, {
        requiresTool: false,
        type: "chat",
        tool: null,
      });
    }
  }

  // ✅ Case 2: model returned structured object (tool-style)
  if (
    typeof response === "object" &&
    response !== null &&
    "tool" in response &&
    typeof (response as { tool: unknown }).tool === "string"
  ) {
    const toolName = (response as { tool: string }).tool;
    return augmentIntent(prompt, {
      requiresTool: true,
      type: "tool",
      tool: toolName,
    });
  }

  // ✅ Safe fallback (never break system)
  return augmentIntent(prompt, {
    requiresTool: false,
    type: "chat",
    tool: null,
  });
}
