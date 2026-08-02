import { STUDY_LIMITS, type PageText } from "./types";

function cleanExtractedText(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pagesFromFullText(fullText: string): PageText[] {
  const pageChunks = fullText.split(/\f/).filter((text) => cleanExtractedText(text).length > 0);
  if (pageChunks.length > 1) {
    return pageChunks.slice(0, STUDY_LIMITS.maxPages).map((pageText, index) => ({
      pageNumber: index + 1,
      text: cleanExtractedText(pageText),
    }));
  }

  const pageSize = 1500;
  const pages: PageText[] = [];
  const numPages = Math.min(STUDY_LIMITS.maxPages, Math.ceil(fullText.length / pageSize));
  for (let index = 0; index < numPages; index += 1) {
    pages.push({
      pageNumber: index + 1,
      text: cleanExtractedText(fullText.slice(index * pageSize, (index + 1) * pageSize)),
    });
  }
  return pages;
}

/**
 * Robust PDF text extractor for serverless and local environments.
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
      const result = await parser.getText().catch((err) => {
        console.warn("[PDF Extract Warning]: Full-document PDFParse text failed:", err);
        return null;
      });
      const fullText = cleanExtractedText(result?.text || "");

      if (fullText.length >= 10) {
        return pagesFromFullText(fullText);
      }

      const info = await parser.getInfo().catch(() => ({ total: STUDY_LIMITS.maxPages }));
      const totalPages = Math.min(
        typeof info.total === "number" && info.total > 0 ? info.total : STUDY_LIMITS.maxPages,
        STUDY_LIMITS.maxPages
      );
      const pages: PageText[] = [];

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        const pageResult = await parser
          .getText({ partial: [pageNumber] })
          .catch((err) => {
            console.warn(`[PDF Extract Warning]: Page ${pageNumber} PDFParse text failed:`, err);
            return null;
          });
        const pageText = cleanExtractedText(pageResult?.text || "");
        if (pageText.length >= 10) {
          pages.push({ pageNumber, text: pageText });
        }
      }

      if (pages.length > 0) {
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

    const fullText = cleanExtractedText(textBlocks.join(" "));
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
    console.warn("[PDF Extract Warning]: Layer 2 (Stream Parser) failed:", err);
  }

  throw new Error(
    "Could not extract text from this PDF. Please make sure the PDF contains selectable text (not an image-only scan)."
  );
}
