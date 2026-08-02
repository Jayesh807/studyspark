import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import { STUDY_LIMITS, type PageText } from "./types";

let workerReady = false;

function configurePdfWorker() {
  if (workerReady) return;

  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "pdf-parse",
    "esm",
    "pdf.worker.mjs"
  );

  if (existsSync(workerPath)) {
    PDFParse.setWorker(pathToFileURL(workerPath).toString());
  }

  workerReady = true;
}

export async function extractPdfPages(buffer: Buffer): Promise<PageText[]> {
  configurePdfWorker();

  const parser = new PDFParse({ data: buffer });

  try {
    const info = await parser.getInfo();
    const pageCount = info.total;

    if (pageCount > STUDY_LIMITS.maxPages) {
      throw new Error(`PDF must be ${STUDY_LIMITS.maxPages} pages or less.`);
    }

    const pages: PageText[] = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const result = await parser.getText({ partial: [pageNumber] });
      pages.push({ pageNumber, text: result.text });
    }

    return pages;
  } finally {
    await parser.destroy();
  }
}
