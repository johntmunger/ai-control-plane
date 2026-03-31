import { getTool } from "../tools/registry";
import { KernelRequestSchema } from "../schemas/request";
import { UnknownToolError } from "../tools/errors/types";
import { normalizeError } from "../tools/errors/normalize";
import { withTimeout } from "../utils/timeout";
import { logInvocation } from "../utils/logging";

export async function handleKernelRequest(request: unknown) {
  let id: string | null = null;

  try {
    const parsedRequest = KernelRequestSchema.parse(request);

    id = parsedRequest.id ?? null;

    const { tool, arguments: args } = parsedRequest;

    const toolDef = getTool(tool);

    if (!toolDef) {
      throw new UnknownToolError(tool);
    }

    const parsedArgs = toolDef.schema.parse(args);

    logInvocation(id ?? "unknown", toolDef.name, parsedArgs);

    const startTime = Date.now();
    const result = await withTimeout(toolDef.execute(parsedArgs), 2000);
    const duration = Date.now() - startTime;

    console.error("KERNEL RESULT:", {
      id,
      result,
      tool: toolDef.name,
      duration,
    });

    return { id, result, tool: toolDef.name, duration };
  } catch (err) {
    return { id, error: normalizeError(err) };
  }
}
