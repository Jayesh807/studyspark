import { STUDY_LIMITS, type PageText } from "./types";

/**
 * Robust 3-layer PDF text extractor for serverless and local environments.
 * Extracts text from standard PDFs, multi-page PDFs, and complex font encodings.
 */
export async function extractPdfPages(buffer: Buffer): Promise<PageText[]> {
  // --------------------------------------------------------------------------
  // Layer 1: PDFParse (pdf-parse) full text extraction
  // --------------------------------------------------------------------------
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText().catch(() => null);
      const fullText = result?.text?.trim() || "";

      if (fullText.length >= 10) {
        // Split by form-feed character (\f) if multi-page
        const pageChunks = fullText.split(/\f/).filter((t) => t.trim().length > 0);
        if (pageChunks.length > 1) {
          return pageChunks.slice(0, STUDY_LIMITS.maxPages).map((pText, i) => ({
            pageNumber: i + 1,
            text: pText.trim(),
          }));
        }

        // Otherwise split by ~1500 character chunks
        const pageSize = 1500;
        const pages: PageText[] = [];
        const numPages = Math.min(STUDY_LIMITS.maxPages, Math.ceil(fullText.length / pageSize));
        for (let i = 0; i < numPages; i++) {
          pages.push({
            pageNumber: i + 1,
            text: fullText.slice(i * pageSize, (i + 1) * pageSize),
          });
        }
        return pages;
      }
    } finally {
      await parser.destroy().catch(() => null);
    }
  } catch (err) {
    console.warn("[PDF Extract Warning]: Layer 1 (PDFParse) failed, trying Layer 2:", err);
  }

  // --------------------------------------------------------------------------
  // Layer 2: Direct PDF text stream parser (BT ... ET blocks)
  // --------------------------------------------------------------------------
  try {
    const rawContent = buffer.toString("latin1");
    const textBlocks: string[] = [];
    const btRegex = /BT[\s\S]*?ET/g;
    let match: RegExpExecArray | null;

    while ((match = btRegex.exec(rawContent)) !== null) {
      const block = match[0];
      const strMatches = block.match(/\(([\s\S]*?)\)/g);
      if (strMatches) {
        const text = strMatches
          .map((s) => s.slice(1, -1))
          .join(" ")
          .replace(/\\([()\\])/g, "$1")
          .trim();
        if (text.length > 2) {
          textBlocks.push(text);
        }
      }
    }

    const fullText = textBlocks.join(" ").replace(/\s+/g, " ").trim();
    if (fullText.length >= 10) {
      const pageSize = 1500;
      const pages: PageText[] = [];
      const numPages = Math.min(STUDY_LIMITS.maxPages, Math.ceil(fullText.length / pageSize));
      for (let i = 0; i < numPages; i++) {
        pages.push({
          pageNumber: i + 1,
          text: fullText.slice(i * pageSize, (i + 1) * pageSize),
        });
      }
      return pages;
    }
  } catch (err) {
    console.warn("[PDF Extract Warning]: Layer 2 (Stream Parser) failed, trying Layer 3:", err);
  }

  // --------------------------------------------------------------------------
  // Layer 3: Raw UTF-8 / Devanagari string scanner fallback
  // --------------------------------------------------------------------------
  try {
    const rawString = buffer.toString("utf-8");
    const words = rawString.match(/[\w\u0900-\u097F]{3,}/g) || [];
    if (words.length >= 10) {
      const extracted = words.join(" ").slice(0, 15000);
      return [{ pageNumber: 1, text: extracted }];
    }
  } catch (err) {
    console.error("[PDF Extract Error]: Layer 3 failed:", err);
  }

  throw new Error(
    "Could not extract text from this PDF. Please make sure the PDF contains selectable text (not an image-only scan)."
  );
}
