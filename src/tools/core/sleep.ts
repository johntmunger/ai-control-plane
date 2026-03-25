import { z } from "zod";

export const SleepSchema = z.object({
  ms: z.number().min(0).max(5000),
});

export const sleepTool = {
  name: "sleep",
  description: "Pause execution for a given number of milliseconds",
  schema: SleepSchema,
  execute: async ({ ms }: z.infer<typeof SleepSchema>) => {
    await new Promise((resolve) => setTimeout(resolve, ms));

    return { slept: ms };
  },
};
