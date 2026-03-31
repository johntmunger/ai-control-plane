import { getTool } from "../tools/registry";
import { KernelRequestSchema } from "../schemas/request";
import { UnknownToolError } from "../tools/errors/types";
import { normalizeError } from "../tools/errors/normalize";
import { withTimeout } from "../utils/timeout";
import { logInvocation } from "../utils/logging";

export async function handleKernelRequest(request: unknown) {
  let id: string | null = null;
  let normalizationApplied = false; // ✅ single source of truth

  try {
    const parsedRequest = KernelRequestSchema.parse(request);

    id = parsedRequest.id ?? null;

    const { tool, arguments: args } = parsedRequest;

    const toolDef = getTool(tool);

    if (!toolDef) {
      throw new UnknownToolError(tool);
    }

    // --- normalization (optional, tool-scoped) ---
    let normalizedArgs = args;

    if (toolDef.normalize) {
      const result = toolDef.normalize(args);

      const didChange = JSON.stringify(result) !== JSON.stringify(args);

      normalizedArgs = result;

      // ✅ ONLY mark true if change AND VALID
      if (didChange) {
        try {
          toolDef.schema.parse(result);
          normalizationApplied = true;
        } catch {
          normalizationApplied = false;
        }
      }
    }

    // --- validation (authoritative) ---
    const parsedArgs = toolDef.schema.parse(normalizedArgs);

    // --- observability ---
    console.debug("KERNEL NORMALIZATION:", {
      id,
      tool: toolDef.name,
      raw_args: args,
      normalized_args: normalizedArgs,
      normalization_applied: normalizationApplied,
    });

    // --- execution ---
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

    return {
      id,
      result,
      tool: toolDef.name,
      duration,
      meta: {
        normalization_applied: normalizationApplied,
      },
    };
  } catch (err) {
    return {
      id,
      error: normalizeError(err),
      meta: {
        normalization_applied: normalizationApplied,
      },
    };
  }
}
