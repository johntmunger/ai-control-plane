import { z } from "zod";

export const EchoSchema = z.object({
  message: z.string(),
});

export const echoTool = {
  name: "echo",
  description: "Return the input message unchanged",
  schema: EchoSchema,
  execute: async ({ message }: z.infer<typeof EchoSchema>) => {
    return { message };
  },
};
