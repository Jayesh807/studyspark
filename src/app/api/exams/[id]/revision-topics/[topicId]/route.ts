import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const updateTopicSchema = z.object({
  title: z.string().min(1, "Topic title is required").max(200).optional(),
  status: z
    .enum(["not-started", "in-progress", "revised", "mastered"])
    .optional(),
  targetDate: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().min(5).max(600).optional(),
  order: z.number().int().min(0).optional(),
});

const STATUS_WEIGHT: Record<string, number> = {
  "not-started": 0,
  "in-progress": 35,
  revised: 75,
  mastered: 100,
};

async function findOwnedTopic(examId: string, topicId: string, userId: string) {
  return db.examRevisionTopic.findFirst({
    where: {
      id: topicId,
      examId,
      exam: { userId },
    },
  });
}

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, topicId } = await params;

  try {
    const body = await req.json();
    const parsed = updateTopicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await findOwnedTopic(id, topicId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { targetDate, title, ...data } = parsed.data;
    const topic = await db.examRevisionTopic.update({
      where: { id: topicId },
      data: {
        ...data,
        title: title?.trim(),
        targetDate:
          targetDate === undefined
            ? undefined
            : targetDate
              ? new Date(targetDate)
              : null,
      },
    });

    await recalculateExamProgress(id);

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("Revision topic update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, topicId } = await params;

  try {
    const existing = await findOwnedTopic(id, topicId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.examRevisionTopic.delete({ where: { id: topicId } });
    await recalculateExamProgress(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revision topic delete error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
