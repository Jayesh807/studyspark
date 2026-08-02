import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  chunkPageText,
  countUsefulPageTextChars,
  getPagesStudyTextQuality,
} from "@/lib/study/chunking";
import { createEmbedding } from "@/lib/study/ai";
import { extractPdfPages } from "@/lib/study/pdf";
import { STUDY_LIMITS } from "@/lib/study/types";

export const runtime = "nodejs";

function sanitizeFileName(value: string) {
  return (
    value
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "study.pdf"
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported right now." }, { status: 400 });
    }

    if (file.size > STUDY_LIMITS.maxPdfBytes) {
      return NextResponse.json({ error: "PDF must be 5 MB or less." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pages = await extractPdfPages(buffer);
    const extractedTextChars = countUsefulPageTextChars(pages);
    const textQuality = getPagesStudyTextQuality(pages);
    const chunks = chunkPageText(pages);

    if (chunks.length === 0) {
      console.warn("[Study PDF Upload]: No indexable chunks extracted", {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        pageCount: pages.length,
        extractedTextChars,
        textQuality,
      });
      const looksLikePdfInternals =
        textQuality.pdfInternalTokenRatio > STUDY_LIMITS.maxPdfInternalTokenRatio ||
        textQuality.suspiciousTokenRatio > STUDY_LIMITS.maxSuspiciousTokenRatio;
      const errorMessage = looksLikePdfInternals
        ? "Could not read useful study text from this PDF. It appears image-based or contains mostly PDF layout data. Please upload a text-selectable PDF or run OCR first."
        : extractedTextChars > 0 && textQuality.wordCount > 0
          ? "This PDF has too little selectable text to generate a quiz. Please upload a PDF with more study content."
          : "Could not read useful text from this PDF. Please upload a text-selectable PDF, not an image-only scan.";

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const document = await db.studyDocument.create({
      data: {
        userId: user.id,
        fileName: sanitizeFileName(file.name),
        pageCount: pages.length,
        chunkCount: chunks.length,
      },
    });

    try {
      const chunksWithEmbeddings = await mapWithConcurrency(
        chunks,
        3,
        async (chunk): Promise<Prisma.StudyChunkCreateManyInput> => {
          const embedding = await createEmbedding(chunk.content);
          return {
            documentId: document.id,
            pageNumber: chunk.pageNumber,
            content: chunk.content,
            embeddingJson: embedding as Prisma.InputJsonValue,
          };
        }
      );

      await db.studyChunk.createMany({ data: chunksWithEmbeddings });
    } catch (error) {
      await db.studyDocument.delete({ where: { id: document.id } }).catch(() => null);
      throw error;
    }

    return NextResponse.json(
      {
        document: {
          id: document.id,
          fileName: document.fileName,
          pageCount: document.pageCount,
          chunkCount: chunks.length,
          doubtCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Study PDF upload error:", error);
    const message =
      error instanceof Error ? error.message : "Could not process this PDF.";
    const isReadablePdfError = message.startsWith("Could not extract text from this PDF");
    return NextResponse.json(
      {
        error: isReadablePdfError
          ? "Could not read useful text from this PDF. Please upload a text-selectable PDF, not an image-only scan."
          : message,
      },
      { status: isReadablePdfError ? 400 : 500 }
    );
  }
}
