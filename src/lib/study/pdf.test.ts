/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  PdfReadabilityError,
  extractPdfPagesWithDiagnostics,
} from "./pdf";

const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalGeminiModel = process.env.GEMINI_MODEL;
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

beforeEach(() => {
  console.warn = () => {};
});

afterEach(() => {
  restoreEnvValue("GEMINI_API_KEY", originalGeminiKey);
  restoreEnvValue("GEMINI_MODEL", originalGeminiModel);
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
});

describe("extractPdfPagesWithDiagnostics", () => {
  test("returns a readable error when no text or OCR path is available", async () => {
    delete process.env.GEMINI_API_KEY;
    const buffer = Buffer.from("%PDF-1.4\n% image-only placeholder\n%%EOF");

    await expect(extractPdfPagesWithDiagnostics(buffer)).rejects.toMatchObject({
      name: "PdfReadabilityError",
      code: "PDF_TEXT_EXTRACTION_FAILED",
    });
  });

  test("uses Gemini OCR when normal PDF text extraction is not useful", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-2.0-flash";

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      pages: [
                        {
                          pageNumber: 1,
                          text:
                            "Newton's first law explains that an object remains at rest or in uniform motion unless acted on by an external force.",
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const buffer = Buffer.from("%PDF-1.4\n% scanned page placeholder\n%%EOF");
    const result = await extractPdfPagesWithDiagnostics(buffer);

    expect(result.source).toBe("gemini-ocr");
    expect(result.usedOcr).toBe(true);
    expect(result.pages).toHaveLength(1);
    expect(result.textQuality.looksUseful).toBe(true);
  });

  test("returns a controlled OCR error when Gemini output is not useful", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-2.0-flash";

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      pages: [{ pageNumber: 1, text: "Page 1" }],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const buffer = Buffer.from("%PDF-1.4\n% scanned page placeholder\n%%EOF");

    await expect(extractPdfPagesWithDiagnostics(buffer)).rejects.toBeInstanceOf(
      PdfReadabilityError
    );
  });
});
