import fs from "fs";
import { z } from "zod";

const Schema = z.object({
  path: z.string(),
});

export const listFiles = {
  name: "listFiles",
  description: "List files in a directory",
  schema: Schema,
  execute: async ({ path }: z.infer<typeof Schema>) => {
    const files = fs.readdirSync(path);
    return { files }; // ✅ MUST RETURN
  },
};
