import { z } from "zod";

export const EchoSchema = z.object({
  message: z.string(),
  fail: z.boolean().optional(),
});

export async function echoTool(input: z.infer<typeof EchoSchema>) {
  if (input.fail) {
    throw new Error("Simulated failure from echoTool");
  }

  return {
    echoed: input.message,
    timestamp: Date.now(),
  };
}

export const echoToolDef = {
  schema: EchoSchema,
  execute: echoTool,
};
