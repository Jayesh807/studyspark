import { STUDY_LIMITS, type PageText, type StudyChunkInput } from "./types";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function chunkPageText(pages: PageText[]): StudyChunkInput[] {
  const chunks: StudyChunkInput[] = [];

  for (const page of pages) {
    const text = normalizeWhitespace(page.text);
    if (!text) continue;

    let start = 0;
    while (start < text.length) {
      const hardEnd = Math.min(start + STUDY_LIMITS.chunkTargetChars, text.length);
      const sentenceEnd = text.lastIndexOf(".", hardEnd);
      const end =
        sentenceEnd > start + STUDY_LIMITS.chunkTargetChars * 0.55
          ? sentenceEnd + 1
          : hardEnd;
      const content = text.slice(start, end).trim();

      if (content.length >= 80) {
        chunks.push({ pageNumber: page.pageNumber, content });
      }

      if (end >= text.length) break;
      start = Math.max(0, end - STUDY_LIMITS.chunkOverlapChars);
    }
  }

  return chunks;
}
