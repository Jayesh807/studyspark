import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chunkPageText } from "@/lib/study/chunking";
import { createEmbedding } from "@/lib/study/ai";
import { extractPdfPages } from "@/lib/study/pdf";
import { STUDY_LIMITS } from "@/lib/study/types";

export const runtime = "nodejs";

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
    const chunks = chunkPageText(pages);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Could not read useful text from this PDF." },
        { status: 400 }
      );
    }

    const document = await db.studyDocument.create({
      data: {
        userId: user.id,
        fileName: file.name.slice(0, 180),
        pageCount: pages.length,
        chunkCount: chunks.length,
      },
    });

    try {
      const chunksWithEmbeddings: Prisma.StudyChunkCreateManyInput[] = [];
      for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk.content);
        chunksWithEmbeddings.push({
          documentId: document.id,
          pageNumber: chunk.pageNumber,
          content: chunk.content,
          embeddingJson: embedding as Prisma.InputJsonValue,
        });
      }

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
