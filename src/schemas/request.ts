import { z } from "zod";

export const KernelRequestSchema = z.object({
  id: z.string().nullable(),
  tool: z.string(),
  arguments: z.unknown(),
});

export type KernelRequest = z.infer<typeof KernelRequestSchema>;
