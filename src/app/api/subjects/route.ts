import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  teacher: z.string().max(100).optional().default(""),
  credits: z.number().int().min(1).max(10).optional().default(3),
  attendance: z.number().int().min(0).max(100).optional().default(0),
  color: z.string().max(50).optional().default("violet"),
  progress: z.number().int().min(0).max(100).optional().default(0),
  notes: z.string().max(2000).optional().default(""),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subjects = await db.subject.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ subjects });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = subjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const subject = await db.subject.create({
      data: { ...parsed.data, userId: user.id },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error("Subject create error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
