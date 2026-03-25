import fs from "fs";
import { z } from "zod";

const Schema = z.object({
  path: z.string(),
});

export const readFile = {
  name: "readFile",
  description: "Read the contents of a file",
  schema: Schema,
  execute: async ({ path }: z.infer<typeof Schema>) => {
    const content = fs.readFileSync(path, "utf-8");
    return { path, content };
  },
};
