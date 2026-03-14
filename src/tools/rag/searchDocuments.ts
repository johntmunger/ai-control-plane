import { z } from "zod";
import { performSemanticSearch, SearchResult } from "../../lib/search";

const SearchSchema = z.object({
  query: z.string().min(3),
  limit: z.number().min(1).max(10).optional(),
});

function formatContext(results: SearchResult[]) {
  return results
    .map(
      (r, i) => `
  CONTEXT ${i + 1}
  ---------
  ${r.text}
  
  SOURCE: ${r.title || r.source}
  SIMILARITY: ${(r.similarity * 100).toFixed(2)}%
  `,
    )
    .join("\n");
}

export async function searchDocuments(input: z.infer<typeof SearchSchema>) {
  const results = await performSemanticSearch(input.query, input.limit ?? 5);

  const context = formatContext(results);

  return {
    context,
    sources: results,
  };
}

export const searchDocumentsTool = {
  schema: SearchSchema,
  execute: searchDocuments,
};
