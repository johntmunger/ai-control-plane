import { tools, ToolName } from "../tools";
import { KernelRequestSchema } from "../schemas/request";
import { normalizeError, UnknownToolError } from "../utils/errors";
import { withTimeout } from "../utils/timeout";
import { logInvocation } from "../utils/logging";

export async function handleKernelRequest(request: unknown) {
  let id: string | null = null;

  try {
    const parsedRequest = KernelRequestSchema.parse(request);

    id = parsedRequest.id ?? null;

    const { tool, arguments: args } = parsedRequest;

    if (!(tool in tools)) {
      throw new UnknownToolError(tool);
    }

    const toolName = tool as ToolName;

    const toolDef = tools[toolName];

    const parsedArgs = toolDef.schema.parse(args);

    logInvocation(id ?? "unknown", toolName, parsedArgs);

    // @ts-ignore
    const result = await withTimeout(toolDef.execute(parsedArgs), 2000);

    return { id, result };
  } catch (err) {
    return {
      id,
      error: normalizeError(err),
    };
  }
}
