export const STUDY_LIMITS = {
  maxPdfBytes: 5 * 1024 * 1024,
  maxPages: 30,
  allowedQuizCounts: [5, 10],
  maxDoubtsPerDocument: 10,
  minUsefulTextChars: 24,
  minStudyTextWords: 8,
  maxPdfInternalTokenRatio: 0.18,
  maxSuspiciousTokenRatio: 0.35,
  chunkTargetChars: 1200,
  chunkOverlapChars: 160,
  minDoubtSimilarity: 0.25,
  maxRetrievedChunks: 3,
} as const;

export interface PageText {
  pageNumber: number;
  text: string;
}

export interface StudyChunkInput {
  pageNumber: number;
  content: string;
}

export interface StudyQuizItem {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface StudySource {
  pageNumber: number;
  content: string;
  score: number;
}
