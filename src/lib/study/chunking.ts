import { STUDY_LIMITS, type PageText, type StudyChunkInput } from "./types";

const PDF_INTERNAL_TOKENS = [
  "obj",
  "endobj",
  "stream",
  "endstream",
  "xref",
  "trailer",
  "startxref",
  "font",
  "fontdescriptor",
  "fontfile2",
  "xobject",
  "subtype",
  "mediabox",
  "procset",
  "colorspace",
  "devicegray",
  "devicergb",
  "flatedecode",
  "ascii85decode",
  "dctdecode",
  "cidfonttype2",
  "cidtogidmap",
  "tounicode",
  "structelem",
  "nonstruct",
  "extgstate",
  "imagemask",
  "bitspercomponent",
  "filter",
  "catalog",
  "parenttree",
  "jfif",
  "headlesschrome",
  "skia",
  "producer",
  "creationdate",
  "moddate",
];

const PDF_INTERNAL_TOKEN_SET = new Set(PDF_INTERNAL_TOKENS);
const PDF_INTERNAL_TOKEN_PATTERN = new RegExp(
  `\\b(?:${PDF_INTERNAL_TOKENS.join("|")})\\b`,
  "gi"
);

function normalizeWhitespace(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface StudyTextQuality {
  charCount: number;
  wordCount: number;
  totalTokenCount: number;
  pdfInternalTokenCount: number;
  suspiciousTokenCount: number;
  gibberishTokenCount: number;
  pdfInternalTokenRatio: number;
  suspiciousTokenRatio: number;
  gibberishTokenRatio: number;
  looksUseful: boolean;
}

/**
 * Detect tokens that look like garbled font-encoded glyph data:
 * - 4+ consecutive consonants with no vowels (e.g., "BFHJ", "cmlrt")
 * - Single/double non-word characters repeated (e.g., "#$%^")
 * - Hex-like sequences not matching real words (e.g., "0A3F2B")
 */
function isGibberishToken(token: string): boolean {
  // Ignore very short tokens and numbers
  if (token.length < 3 || /^\d+\.?\d*$/.test(token)) return false;
  // 4+ consecutive consonants (no vowels) strongly suggests garbled text
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(token)) return true;
  // Mostly non-alphanumeric characters
  const alphaChars = token.replace(/[^a-zA-Z0-9]/g, "");
  if (alphaChars.length < token.length * 0.4) return true;
  // Hex-like sequences (6+ hex chars with no vowels except A/E)
  if (/^[0-9A-Fa-f]{6,}$/.test(token)) return true;
  return false;
}

export function getStudyTextQuality(value: string): StudyTextQuality {
  const text = normalizeWhitespace(value);
  const totalTokens = text.split(/\s+/).filter(Boolean);
  const words = text.match(/[A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F'-]{2,}/g) || [];
  const internalTokens = text.match(PDF_INTERNAL_TOKEN_PATTERN) || [];
  const suspiciousTokens = totalTokens.filter((token) =>
    /^[A-Za-z0-9_/-]{18,}$/.test(token) ||
    /^[A-Z0-9_/-]{8,}$/.test(token)
  );
  const gibberishTokens = totalTokens.filter(isGibberishToken);
  const totalTokenCount = Math.max(totalTokens.length, 1);
  const pdfInternalTokenRatio = internalTokens.length / totalTokenCount;
  const suspiciousTokenRatio = suspiciousTokens.length / totalTokenCount;
  const gibberishTokenRatio = gibberishTokens.length / totalTokenCount;
  const cleanWordCount = words.filter(
    (word) => !PDF_INTERNAL_TOKEN_SET.has(word.toLowerCase())
  ).length;

  return {
    charCount: text.length,
    wordCount: cleanWordCount,
    totalTokenCount: totalTokens.length,
    pdfInternalTokenCount: internalTokens.length,
    suspiciousTokenCount: suspiciousTokens.length,
    gibberishTokenCount: gibberishTokens.length,
    pdfInternalTokenRatio,
    suspiciousTokenRatio,
    gibberishTokenRatio,
    looksUseful:
      text.length >= STUDY_LIMITS.minUsefulTextChars &&
      cleanWordCount >= STUDY_LIMITS.minStudyTextWords &&
      pdfInternalTokenRatio <= STUDY_LIMITS.maxPdfInternalTokenRatio &&
      suspiciousTokenRatio <= STUDY_LIMITS.maxSuspiciousTokenRatio &&
      gibberishTokenRatio <= STUDY_LIMITS.maxGibberishTokenRatio,
  };
}

export function getPagesStudyTextQuality(pages: PageText[]) {
  return getStudyTextQuality(pages.map((page) => page.text).join(" "));
}

export function countUsefulPageTextChars(pages: PageText[]) {
  return pages.reduce((total, page) => total + normalizeWhitespace(page.text).length, 0);
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

      if (getStudyTextQuality(content).looksUseful) {
        chunks.push({ pageNumber: page.pageNumber, content });
      }

      if (end >= text.length) break;
      start = Math.max(0, end - STUDY_LIMITS.chunkOverlapChars);
    }
  }

  return chunks;
}
