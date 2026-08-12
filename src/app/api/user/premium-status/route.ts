import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await (db.profile as any).findUnique({
      where: { userId: user.id },
      select: {
        tenQuestionTrialsUsed: true,
        resumeGenerationsUsed: true,
        hasUnlockedTenQuestions: true,
        hasUnlockedResume: true,
      },
    }).catch(() => null);

    return NextResponse.json({
      tenQuestionTrialsUsed: profile?.tenQuestionTrialsUsed ?? 0,
      resumeGenerationsUsed: profile?.resumeGenerationsUsed ?? 0,
      hasUnlockedTenQuestions: profile?.hasUnlockedTenQuestions ?? false,
      hasUnlockedResume: profile?.hasUnlockedResume ?? false,
      maxTenQuestionTrials: 5,
      maxResumeGenerations: 2,
    });
  } catch (error) {
    console.error("premium-status error:", error);
    return NextResponse.json(
      { error: "Could not fetch premium status" },
      { status: 500 }
    );
  }
}
