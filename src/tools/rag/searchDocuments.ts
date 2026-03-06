import { z } from "zod";
import { performSemanticSearch } from "../../../../RAG MDN/rag-mdn/src/lib/search";

const SearchSchema = z.object({
  query: z.string(),
  limit: z.number().optional(),
});

export async function searchDocuments(input: z.infer<typeof SearchSchema>) {
  const results = await performSemanticSearch(input.query, input.limit ?? 5);

  return {
    documents: results,
  };
}

export const searchDocumentsTool = {
  schema: SearchSchema,
  execute: searchDocuments,
};
