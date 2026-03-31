import { z } from "zod";

export const AddSchema = z.object({
  a: z.number(),
  b: z.number(),
});

export const addTool = {
  name: "add",
  description: "Add two numbers together",
  schema: AddSchema,
  normalize: (args: unknown) => {
    if (typeof args === "object" && args !== null) {
      const obj = args as Record<string, unknown>;
      const a = obj.a;
      const b = obj.b;

      return {
        ...obj,
        a: typeof a === "string" && !isNaN(Number(a)) ? Number(a) : a,
        b: typeof b === "string" && !isNaN(Number(b)) ? Number(b) : b,
      };
    }

    return args;
  },
  execute: async ({ a, b }: z.infer<typeof AddSchema>) => {
    return { result: a + b };
  },
};
