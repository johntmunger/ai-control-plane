import { z } from "zod";

export const AddSchema = z.object({
  a: z.number(),
  b: z.number(),
});

export async function addTool(input: z.infer<typeof AddSchema>) {
  return { result: input.a + input.b };
}

export const addToolDef = {
  schema: AddSchema,
  execute: addTool,
};
