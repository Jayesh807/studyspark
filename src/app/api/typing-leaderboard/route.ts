import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const resultSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
  promptTitle: z.string().trim().min(1).max(80),
  wpm: z.number().int().min(0).max(400),
  accuracy: z.number().int().min(0).max(100),
  mistakes: z.number().int().min(0).max(500),
  score: z.number().int().min(0).max(100000),
  durationSec: z.number().min(0.1).max(3600),
});

function serializeResult(result: {
  id: string;
  userId: string;
  difficulty: string;
  promptTitle: string;
  wpm: number;
  accuracy: number;
  mistakes: number;
  score: number;
  durationSec: number;
  createdAt: Date;
  user: { username: string };
}) {
  return {
    id: result.id,
    userId: result.userId,
    username: result.user.username,
    difficulty: result.difficulty,
    promptTitle: result.promptTitle,
    wpm: result.wpm,
    accuracy: result.accuracy,
    mistakes: result.mistakes,
    score: result.score,
    durationSec: result.durationSec,
    createdAt: result.createdAt.toISOString(),
  };
}

function bestResultPerUser<T extends { userId: string }>(results: T[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.userId)) return false;
    seen.add(result.userId);
    return true;
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const difficultyParam = req.nextUrl.searchParams.get("difficulty");
    const difficulty =
      difficultyParam === "easy" ||
      difficultyParam === "medium" ||
      difficultyParam === "hard"
        ? difficultyParam
        : undefined;

    const where = difficulty ? { difficulty } : {};

    const [topCandidates, recent, mine] = await Promise.all([
      db.typingResult.findMany({
        where,
        orderBy: [{ score: "desc" }, { wpm: "desc" }, { createdAt: "asc" }],
        take: 100,
        include: { user: { select: { username: true } } },
      }),
      db.typingResult.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { username: true } } },
      }),
      db.typingResult.findFirst({
        where: { ...where, userId: user.id },
        orderBy: [{ score: "desc" }, { wpm: "desc" }, { createdAt: "asc" }],
        include: { user: { select: { username: true } } },
      }),
    ]);
    const top = bestResultPerUser(topCandidates).slice(0, 10);

    return NextResponse.json({
      top: top.map(serializeResult),
      recent: recent.map(serializeResult),
      mine: mine ? serializeResult(mine) : null,
      serverTime: new Date().toISOString(),
      unavailable: false,
    });
  } catch (error) {
    console.error("Typing leaderboard load error:", error);
    return NextResponse.json({
      top: [],
      recent: [],
      mine: null,
      serverTime: new Date().toISOString(),
      unavailable: true,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = resultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await db.typingResult.create({
      data: {
        ...parsed.data,
        durationSec: Math.round(parsed.data.durationSec * 10) / 10,
        userId: user.id,
      },
      include: { user: { select: { username: true } } },
    });

    return NextResponse.json(
      { result: serializeResult(result), saved: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Typing leaderboard save error:", error);
    return NextResponse.json({
      result: null,
      saved: false,
      unavailable: true,
    });
  }
}
