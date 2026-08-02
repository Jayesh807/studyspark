import type { StudySource } from "./types";

export function toNumberVector(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number")
    : [];
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let aMag = 0;
  let bMag = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aMag += a[i] * a[i];
    bMag += b[i] * b[i];
  }

  if (aMag === 0 || bMag === 0) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

export function rankStudySources(
  queryEmbedding: number[],
  chunks: Array<{ pageNumber: number; content: string; embeddingJson: unknown }>,
  limit: number
): StudySource[] {
  return chunks
    .map((chunk) => ({
      pageNumber: chunk.pageNumber,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, toNumberVector(chunk.embeddingJson)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
