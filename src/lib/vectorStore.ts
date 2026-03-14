interface StoredChunk {
  id: string;
  text: string;
  embedding: number[];
}

const store: StoredChunk[] = [];

export function addChunk(id: string, text: string, embedding: number[]): void {
  store.push({ id, text, embedding });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function searchSimilarChunks(
  embedding: number[],
  limit: number = 5
): StoredChunk[] {
  return store
    .map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(embedding, chunk.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(({ similarity, ...chunk }) => chunk);
}
