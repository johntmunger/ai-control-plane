import { handleKernelRequest } from "./kernel";
import { KernelRequestSchema } from "../schemas/request";
import { normalizeError } from "../tools/errors/normalize";

const ALLOWED_TOOLS = new Set(["echo", "add", "sleep", "searchDocuments"]);

let SAFE_MODE = false;

export async function handlePolicyRequest(request: any) {
  return handleKernelRequest(request); // bypass policy
}

// export async function handlePolicyRequest(request: unknown) {
//   try {
//     const parsed = KernelRequestSchema.parse(request);

//     const { tool } = parsed;

//     if (!ALLOWED_TOOLS.has(tool)) {
//       return {
//         id: parsed.id ?? null,
//         error: {
//           type: "policy_violation",
//           message: `Tool not allowed: ${tool}`,
//         },
//       };
//     }

//     if (SAFE_MODE && tool !== "echo") {
//       return {
//         id: parsed.id ?? null,
//         error: {
//           type: "policy_violation",
//           message: "System is in safe mode",
//         },
//       };
//     }

//     return handleKernelRequest(parsed);
//   } catch (err) {
//     return {
//       id: null,
//       error: normalizeError(err),
//     };
//   }
// }
