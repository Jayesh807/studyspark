import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { answerGroundedDoubt, createEmbedding } from "@/lib/study/ai";
import { rankStudySources } from "@/lib/study/similarity";
import { STUDY_LIMITS } from "@/lib/study/types";

export const runtime = "nodejs";

const doubtSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  try {
    const body = await req.json();
    const parsed = doubtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid question" },
        { status: 400 }
      );
    }

    const document = await db.studyDocument.findFirst({
      where: { id: documentId, userId: user.id },
      include: { chunks: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Study document not found." }, { status: 404 });
    }

    if (document.doubtCount >= STUDY_LIMITS.maxDoubtsPerDocument) {
      return NextResponse.json(
        { error: "You have used 10 doubts for this PDF." },
        { status: 429 }
      );
    }

    const questionEmbedding = await createEmbedding(parsed.data.question);
    let sources = rankStudySources(
      questionEmbedding,
      document.chunks,
      STUDY_LIMITS.maxRetrievedChunks
    );

    const isGeneralQuery = /summar|overview|main point|takeaway|recap|formula|definition|question|concept|step/i.test(
      parsed.data.question
    );

    // If score is low or query is general, use available document chunks for AI grounding
    if (sources.length === 0 || sources[0]?.score < STUDY_LIMITS.minDoubtSimilarity) {
      if (isGeneralQuery || document.chunks.length > 0) {
        sources = document.chunks.slice(0, 3).map((chunk) => ({
          pageNumber: chunk.pageNumber,
          content: chunk.content,
          score: 0.5,
        }));
      } else {
        await db.studyDocument.update({
          where: { id: document.id },
          data: { doubtCount: { increment: 1 } },
        });

        return NextResponse.json({
          answer: "I could not find this answer in your uploaded PDF. Please ask from this material or upload another PDF.",
          found: false,
          sources: [],
          remainingDoubts: STUDY_LIMITS.maxDoubtsPerDocument - document.doubtCount - 1,
        });
      }
    }

    const answer = await answerGroundedDoubt(parsed.data.question, sources);
    await db.studyDocument.update({
      where: { id: document.id },
      data: { doubtCount: { increment: 1 } },
    });

    const sourcePages = sources.filter(
      (source, index, all) =>
        all.findIndex((item) => item.pageNumber === source.pageNumber) === index
    );

    return NextResponse.json({
      answer,
      found: true,
      sources: sourcePages.map((source) => ({
        pageNumber: source.pageNumber,
        score: source.score,
      })),
      remainingDoubts: STUDY_LIMITS.maxDoubtsPerDocument - document.doubtCount - 1,
    });
  } catch (error) {
    console.error("Study doubt error:", error);
    const message =
      error instanceof Error ? error.message : "Could not answer this doubt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
