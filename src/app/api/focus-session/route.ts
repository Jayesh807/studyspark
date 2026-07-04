import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const sessionSchema = z.object({
  duration: z.number().int().min(1).max(600),
  type: z.enum(["focus", "break"]).optional().default("focus"),
  subject: z.string().max(100).optional().default(""),
  completed: z.boolean().optional().default(true),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await db.focusSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const session = await db.focusSession.create({
      data: { ...parsed.data, userId: user.id },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Focus session create error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
