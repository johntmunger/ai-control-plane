/** Unwrap `{ result: T }` tool payloads for display when present. */
export function extractResult(result: unknown): unknown {
  if (result && typeof result === "object" && "result" in result) {
    return (result as { result: unknown }).result;
  }
  return result;
}
