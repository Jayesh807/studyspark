import { STUDY_LIMITS, type PageText } from "./types";

/**
 * Robust, serverless-safe PDF page text extractor.
 * Works on Netlify, Node.js, and local dev without requiring local filesystem worker binaries.
 */
export async function extractPdfPages(buffer: Buffer): Promise<PageText[]> {
  // 1. Try PDFParse (pdf-parse v2) with defensive error handling
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const info = await parser.getInfo().catch(() => ({ total: 1 }));
      const totalPages = Math.min(info.total || 1, STUDY_LIMITS.maxPages);
      const pages: PageText[] = [];

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        try {
          const result = await parser.getText({ partial: [pageNumber] });
          if (result && result.text && result.text.trim()) {
            pages.push({ pageNumber, text: result.text.trim() });
          }
        } catch {
          // ignore single page read error
        }
      }

      if (pages.length > 0) {
        return pages;
      }
    } finally {
      await parser.destroy().catch(() => null);
    }
  } catch (err) {
    console.warn("[PDF Extract Warning]: Primary PDFParse failed, using fallback:", err);
  }

  // 2. Fallback: Parse PDF text stream contents directly from buffer
  try {
    const rawContent = buffer.toString("latin1");
    // Extract text in PDF text objects BT ... ET
    const textBlocks: string[] = [];
    const btRegex = /BT[\s\S]*?ET/g;
    let match: RegExpExecArray | null;

    while ((match = btRegex.exec(rawContent)) !== null) {
      const block = match[0];
      // Match string literals ( ... )
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
      // Split into 1500-char pseudo-pages
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
  } catch (fallbackErr) {
    console.error("[PDF Extract Error]: Fallback parser error:", fallbackErr);
  }

  throw new Error("Could not extract readable text from this PDF file. Please ensure it contains selectable text.");
}
