import { ToolTimeoutError } from "./errors";

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new ToolTimeoutError(ms)), ms),
    ),
  ]);
}
