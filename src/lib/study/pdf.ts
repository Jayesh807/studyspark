import {
  countUsefulPageTextChars,
  getPagesStudyTextQuality,
  type StudyTextQuality,
} from "./chunking";
import { STUDY_LIMITS, type PageText } from "./types";

export type PdfExtractionSource = "pdf-text" | "gemini-ocr";

export class PdfReadabilityError extends Error {
  code: string;

  constructor(message: string, code = "PDF_UNREADABLE") {
    super(message);
    this.name = "PdfReadabilityError";
    this.code = code;
  }
}

export interface PdfExtractionResult {
  pages: PageText[];
  source: PdfExtractionSource;
  usedOcr: boolean;
  extractedTextChars: number;
  textQuality: StudyTextQuality;
}

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

function diagnosticsForPages(
  pages: PageText[],
  source: PdfExtractionSource,
  usedOcr: boolean
): PdfExtractionResult {
  return {
    pages,
    source,
    usedOcr,
    extractedTextChars: countUsefulPageTextChars(pages),
    textQuality: getPagesStudyTextQuality(pages),
  };
}

function extractJsonObject(text: string) {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return "";
  return cleaned.slice(start, end + 1);
}

function pagesFromOcrResponse(text: string): PageText[] {
  const jsonText = extractJsonObject(text);
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText) as {
        pages?: Array<{ pageNumber?: unknown; text?: unknown }>;
      };
      const pages = Array.isArray(parsed.pages) ? parsed.pages : [];
      const normalized = pages
        .flatMap((page, index) => {
          if (typeof page.text !== "string") return [];
          const textValue = cleanExtractedText(page.text).slice(0, 8000);
          if (textValue.length < 10) return [];
          const pageNumber =
            typeof page.pageNumber === "number" && page.pageNumber > 0
              ? Math.floor(page.pageNumber)
              : index + 1;
          return [{ pageNumber, text: textValue }];
        })
        .slice(0, STUDY_LIMITS.maxPages);

      if (normalized.length > 0) return normalized;
    } catch {
      // Fall through to plain text parsing.
    }
  }

  const pageBlocks = text
    .split(/(?:^|\n)\s*(?:page|p\.)\s+\d+\s*[:.-]\s*/i)
    .map((block) => cleanExtractedText(block))
    .filter((block) => block.length >= 10);

  if (pageBlocks.length > 1) {
    return pageBlocks.slice(0, STUDY_LIMITS.maxPages).map((pageText, index) => ({
      pageNumber: index + 1,
      text: pageText.slice(0, 8000),
    }));
  }

  return pagesFromFullText(cleanExtractedText(text));
}

function geminiOcrModels() {
  return process.env.GEMINI_OCR_MODEL
    ? [process.env.GEMINI_OCR_MODEL]
    : process.env.GEMINI_MODEL
      ? [process.env.GEMINI_MODEL]
      : ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
}

async function extractPdfPagesWithGeminiOcr(buffer: Buffer): Promise<PageText[]> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new PdfReadabilityError(
      "Could not read enough clean text from this PDF. Please upload a text-selectable PDF or configure Gemini OCR.",
      "OCR_UNAVAILABLE"
    );
  }

  const prompt = [
    "Extract clean study text from this PDF for an exam-question generator.",
    "Return JSON only in this exact shape:",
    '{"pages":[{"pageNumber":1,"text":"readable study text from that page"}]}',
    "Rules:",
    "- Include only actual educational content, notes, formulas, definitions, examples, headings, and tables converted to readable text.",
    "- Omit page numbers, headers, footers, watermarks, and decorative text unless they are needed for meaning.",
    "- If a page has no readable study content, omit it.",
    "- Preserve formulas in plain text.",
  ].join("\n");

  let lastError = "";
  for (const model of geminiOcrModels()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: buffer.toString("base64"),
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        lastError = errJson.error?.message || `HTTP ${res.status}`;
        console.warn("[PDF OCR]: Gemini OCR request failed", {
          model,
          status: res.status,
          message: lastError,
        });
        continue;
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const pages = pagesFromOcrResponse(content);
      if (pages.length > 0) return pages;
      lastError = "Gemini returned no page text";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn("[PDF OCR]: Gemini OCR exception", {
        model,
        message: lastError,
      });
    }
  }

  throw new PdfReadabilityError(
    lastError
      ? "Gemini OCR could not read enough clean study text from this PDF. Please try a clearer scan or a text-selectable PDF."
      : "Gemini OCR could not read this PDF. Please try a clearer scan or a text-selectable PDF.",
    "OCR_FAILED"
  );
}

/**
 * Robust PDF text extractor for serverless and local environments.
 * Extracts text from standard PDFs, multi-page PDFs, and complex font encodings.
 */
export async function extractPdfPages(buffer: Buffer): Promise<PageText[]> {
  // --------------------------------------------------------------------------
  // Layer 1: unpdf (serverless-compatible, works on Netlify/Vercel)
  // --------------------------------------------------------------------------
  try {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));

    // Try per-page extraction first
    const { totalPages, text: pageTexts } = await extractText(pdf, { mergePages: false });

    if (Array.isArray(pageTexts) && pageTexts.length > 0) {
      const pages: PageText[] = [];
      const maxPages = Math.min(pageTexts.length, STUDY_LIMITS.maxPages);
      for (let i = 0; i < maxPages; i++) {
        const pageText = cleanExtractedText(pageTexts[i] || "");
        if (pageText.length >= 10) {
          pages.push({ pageNumber: i + 1, text: pageText });
        }
      }
      if (pages.length > 0) return pages;
    }

    // Fallback: merge all pages into one text
    const merged = await extractText(pdf, { mergePages: true });
    const mergedText = merged.text;
    const fullText = cleanExtractedText(
      typeof mergedText === "string" ? mergedText : String(mergedText ?? "")
    );
    if (fullText.length >= 10) {
      return pagesFromFullText(fullText);
    }
  } catch (err) {
    console.warn("[PDF Extract Warning]: Layer 1 (unpdf) failed, trying Layer 2:", err);
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

export async function extractPdfPagesWithDiagnostics(
  buffer: Buffer
): Promise<PdfExtractionResult> {
  let textExtractionError: unknown = null;

  try {
    const pages = await extractPdfPages(buffer);
    const result = diagnosticsForPages(pages, "pdf-text", false);
    if (result.textQuality.looksUseful) return result;
  } catch (error) {
    textExtractionError = error;
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    const ocrPages = await extractPdfPagesWithGeminiOcr(buffer);
    const ocrResult = diagnosticsForPages(ocrPages, "gemini-ocr", true);
    if (ocrResult.textQuality.looksUseful) return ocrResult;

    console.warn("[PDF OCR]: OCR text failed quality check", {
      pageCount: ocrResult.pages.length,
      extractedTextChars: ocrResult.extractedTextChars,
      textQuality: ocrResult.textQuality,
    });

    throw new PdfReadabilityError(
      "Gemini OCR found text, but it was not clean enough for quiz generation. Please try a clearer scan or a PDF with more readable study content.",
      "OCR_TEXT_NOT_USEFUL"
    );
  }

  if (textExtractionError) {
    throw new PdfReadabilityError(
      "Could not read enough clean text from this PDF. Please upload a text-selectable PDF or enable Gemini OCR for scanned/image-based notes.",
      "PDF_TEXT_EXTRACTION_FAILED"
    );
  }

  throw new PdfReadabilityError(
    "This PDF has too little readable study text to generate a quiz. Please upload a PDF with more study content.",
    "PDF_TEXT_NOT_USEFUL"
  );
}
