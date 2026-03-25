import { z } from "zod";

export const AddSchema = z.object({
  a: z.number(),
  b: z.number(),
});

export const addTool = {
  name: "add",
  description: "Add two numbers together",
  schema: AddSchema,
  execute: async ({ a, b }: z.infer<typeof AddSchema>) => {
    return { result: a + b };
  },
};
