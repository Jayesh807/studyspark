import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_REVISION_TOPICS_PER_EXAM = 5;

const topicSchema = z.object({
  title: z.string().min(1, "Topic title is required").max(200),
  status: z
    .enum(["not-started", "in-progress", "revised", "mastered"])
    .optional()
    .default("not-started"),
  targetDate: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().min(5).max(600).optional().default(45),
});

const STATUS_WEIGHT: Record<string, number> = {
  "not-started": 0,
  "in-progress": 35,
  revised: 75,
  mastered: 100,
};

async function recalculateExamProgress(examId: string) {
  const topics = await db.examRevisionTopic.findMany({
    where: { examId },
    select: { status: true },
  });

  const progress =
    topics.length === 0
      ? 0
      : Math.round(
          topics.reduce(
            (sum, topic) => sum + (STATUS_WEIGHT[topic.status] ?? 0),
            0
          ) / topics.length
        );

  await db.exam.update({
    where: { id: examId },
    data: { progress },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exam = await db.exam.findFirst({
    where: { id, userId: user.id },
    include: {
      revisionTopics: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ topics: exam.revisionTopics });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = topicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const exam = await db.exam.findFirst({
      where: { id, userId: user.id },
      include: { _count: { select: { revisionTopics: true } } },
    });
    if (!exam) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (exam._count.revisionTopics >= MAX_REVISION_TOPICS_PER_EXAM) {
      return NextResponse.json(
        { error: `You can add up to ${MAX_REVISION_TOPICS_PER_EXAM} revision topics per exam` },
        { status: 400 }
      );
    }

    const topic = await db.examRevisionTopic.create({
      data: {
        examId: id,
        title: parsed.data.title.trim(),
        status: parsed.data.status,
        targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
        estimatedMinutes: parsed.data.estimatedMinutes,
        order: exam._count.revisionTopics,
      },
    });

    await recalculateExamProgress(id);

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error("Revision topic create error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
