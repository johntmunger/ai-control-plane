import { z } from "zod";

export const SleepSchema = z.object({
  ms: z.number().max(5000),
});

export async function sleepTool(input: z.infer<typeof SleepSchema>) {
  await new Promise((resolve) => setTimeout(resolve, input.ms));
  return { slept: input.ms };
}

export const sleepToolDef = {
  schema: SleepSchema,
  execute: sleepTool,
};
