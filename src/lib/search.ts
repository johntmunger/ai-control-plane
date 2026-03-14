import { generateEmbedding } from "./embeddings";
import { searchSimilarChunks } from "./vectorStore";

export type SearchResult = {
  text: string;
  source: string;
  title?: string;
  similarity: number;
};

export async function performSemanticSearch(
  query: string,
  limit: number = 5,
): Promise<SearchResult[]> {
  console.log("🔍 Performing semantic search for:", query);

  const embedding = await generateEmbedding(query);
  const results = await searchSimilarChunks(embedding, limit);

  console.log("Results:", results);

  return results.map((result) => ({
    text: result.text,
    source: result.id,
    similarity: 0.85,
  }));
}
