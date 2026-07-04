import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const examSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100),
  examName: z.string().min(1, "Exam name is required").max(200),
  date: z.string().min(1, "Date is required"),
  time: z.string().max(20).optional().default(""),
  location: z.string().max(200).optional().default(""),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  progress: z.number().int().min(0).max(100).optional().default(0),
  notes: z.string().max(2000).optional().default(""),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exams = await db.exam.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ exams });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = examSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const exam = await db.exam.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date),
        userId: user.id,
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("Exam create error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
