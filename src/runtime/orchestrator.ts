import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { modelRouter } from "../models/router";
import { handlePolicyRequest } from "./policy";
import { listToolMetadata } from "../tools/registry";

// 🔥 EXECUTION WITH ESCALATION
async function executeWithEscalation(
  toolRequest: any,
  history: MessageParam[],
) {
  let attempt = 0;
  const maxAttempts = 2;

  let currentRequest = toolRequest;

  while (attempt < maxAttempts) {
    console.log(`\n--- TOOL ATTEMPT ${attempt + 1} ---`);

    const result = await handlePolicyRequest({
      id: currentRequest.id,
      tool: currentRequest.tool,
      arguments: currentRequest.arguments,
    });

    const isError = "error" in result;
    const error = isError ? result.error : undefined;
    const meta = (result as any).meta;

    // ✅ success
    if (!isError) {
      if (attempt === 1) {
        console.log("✅ RECOVERY SUCCESS");
      }
      return result;
    }

    console.log("⚠️ TOOL ERROR:", error);
    console.log("🧪 META DEBUG:", meta);

    const shouldEscalate =
      error?.type === "deterministic" &&
      error?.subtype === "validation" &&
      meta?.normalization_applied !== true; // ✅ FIXED

    if (!shouldEscalate || attempt === 1) {
      if (attempt === 1) {
        console.log("❌ RECOVERY FAILED");
      }
      console.log("❌ NOT ESCALATING (final failure)");
      return result;
    }

    console.log("🔁 ESCALATING TO MODEL...");

    const fixedArgs = await retryWithModel({
      originalArgs: currentRequest.arguments,
      error,
      tool: currentRequest.tool,
      history,
    });

    console.log("🧠 RETRY RESULT:", fixedArgs);

    currentRequest = {
      ...currentRequest,
      arguments: fixedArgs,
    };

    attempt++;
  }

  return {
    error: {
      type: "deterministic",
      subtype: "unknown",
      message: "Escalation loop failed unexpectedly",
    },
  };
}

// 🔥 RETRY WITH MODEL
async function retryWithModel({
  originalArgs,
  error,
  tool,
  history,
}: {
  originalArgs: any;
  error: any;
  tool: string;
  history: any[];
}) {
  const tools = listToolMetadata();

  const retryPrompt = `
The previous tool call failed validation.

Tool: ${tool}

Original arguments:
${JSON.stringify(originalArgs)}

Validation error:
${JSON.stringify(error.message)}

Rules:
- Only convert values if clearly numeric ("5" → 5)
- Do NOT guess or invent values
- If unsure, return the original values unchanged

Return ONLY valid JSON arguments.
`;

  const decision = await modelRouter.plan(retryPrompt, history, tools);

  if (typeof decision === "string") {
    throw new Error("Retry model returned text instead of arguments");
  }

  if (!decision.arguments || typeof decision.arguments !== "object") {
    throw new Error("Retry model returned invalid arguments");
  }

  return decision.arguments;
}

// 🔥 MAIN ORCHESTRATOR
export async function orchestrate(prompt: string) {
  const history: MessageParam[] = [];

  const tools = listToolMetadata();

  const decision = await modelRouter.plan(prompt, history, tools);

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

  const result = await executeWithEscalation(toolRequest, history);

  if (!("error" in result)) {
    history.push({
      role: "assistant",
      content: `Tool result (${decision.tool}):\n\n${JSON.stringify(result.result, null, 2)}`,
    });

    return {
      type: "final",
      message: JSON.stringify(result.result, null, 2),
      history,
    };
  }

  return {
    type: "final",
    message: `Tool failed: ${JSON.stringify(result.error.message)}`,
    history,
  };
}
