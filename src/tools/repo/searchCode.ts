import fs from "fs";
import path from "path";
import { z } from "zod";

const Schema = z.object({
  path: z.string(),
  query: z.string(),
});

function search(dir: string, query: string, results: string[] = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);

    if (fs.statSync(full).isDirectory()) {
      search(full, query, results);
    } else {
      const content = fs.readFileSync(full, "utf-8");
      if (content.includes(query)) {
        results.push(full);
      }
    }
  }

  return results;
}

export const searchCode = {
  name: "searchCode",
  description: "Search for text in files within a directory",
  schema: Schema,
  execute: async ({ path, query }: z.infer<typeof Schema>) => {
    const matches = search(path, query);
    return { query, matches };
  },
};
