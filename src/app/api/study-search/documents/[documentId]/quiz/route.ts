import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  StudyQuizGenerationError,
  generateGroundedQuiz,
} from "@/lib/study/ai";
import { getStudyTextQuality } from "@/lib/study/chunking";

export const runtime = "nodejs";

const quizSchema = z.object({
  count: z
    .union([z.literal(5), z.literal(10)])
    .optional()
    .default(5),
});

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

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
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Quiz generation supports 5 or 10 questions." },
        { status: 400 }
      );
    }

    const requestedCount = parsed.data.count;

    const profile = await (db.profile as any).findUnique({
      where: { userId: user.id },
      select: {
        tenQuestionTrialsUsed: true,
        hasUnlockedTenQuestions: true,
      },
    }).catch(() => null);

    if (
      requestedCount === 10 &&
      !profile?.hasUnlockedTenQuestions &&
      (profile?.tenQuestionTrialsUsed ?? 0) >= 5
    ) {
      return NextResponse.json(
        {
          error:
            "Free 10-Question trial limit reached (5/5). Please upgrade to unlock lifetime 10-Q access.",
        },
        { status: 403 }
      );
    }

    const document = await db.studyDocument.findFirst({
      where: { id: documentId, userId: user.id },
      include: {
        chunks: {
          orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
          take: 40,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Study document not found." }, { status: 404 });
    }

    const usefulChunks = document.chunks.filter((chunk) =>
      getStudyTextQuality(chunk.content).looksUseful
    );

    if (usefulChunks.length === 0) {
      return NextResponse.json(
        {
          error:
            "This PDF was indexed without readable study text. Please re-upload the PDF and try again.",
        },
        { status: 422 }
      );
    }

    const context = usefulChunks.map((chunk) => chunk.content).join("\n\n");
    const questions = await generateGroundedQuiz(context, requestedCount);

    const quiz = await db.studyQuiz.create({
      data: {
        documentId: document.id,
        questionCount: questions.length,
        itemsJson: toPrismaJson(questions),
      },
    });

    if (requestedCount === 10 && !profile?.hasUnlockedTenQuestions) {
      await (db.profile as any).upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          tenQuestionTrialsUsed: 1,
        },
        update: {
          tenQuestionTrialsUsed: { increment: 1 },
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        questionCount: quiz.questionCount,
        questions,
      },
    });
  } catch (error) {
    console.error("Study quiz error:", error);
    const message =
      error instanceof Error ? error.message : "Could not generate quiz.";
    const status =
      error instanceof StudyQuizGenerationError &&
        error.code === "UNREADABLE_CONTEXT"
        ? 422
        : error instanceof StudyQuizGenerationError &&
          error.code === "AI_OUTPUT_NOT_USABLE"
          ? 422
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
