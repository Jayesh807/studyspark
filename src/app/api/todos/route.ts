import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().default(""),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  category: z
    .enum(["general", "study", "assignment", "revision", "exam"])
    .optional()
    .default("general"),
  status: z.enum(["todo", "in-progress", "completed"]).optional().default("todo"),
  subject: z.string().max(100).optional().default(""),
  dueDate: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todos = await db.todo.findMany({
    where: { userId: user.id },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ todos });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = todoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { dueDate, ...data } = parsed.data;

    const todo = await db.todo.create({
      data: {
        ...data,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id,
      },
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error("Todo create error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
