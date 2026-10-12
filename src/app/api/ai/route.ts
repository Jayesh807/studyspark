import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateText, StudyQuizGenerationError } from "@/lib/study/ai";

export const runtime = "nodejs";

const MAX_TOTAL_CHARS = 16000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;

// Best-effort per-instance throttle (serverless instances don't share memory) to stop a single
// signed-in user from burning the shared AI quota in a tight loop.
const recentRequests = new Map<string, number[]>();

function isRateLimited(userId: string) {
  const now = Date.now();
  const hits = (recentRequests.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX_REQUESTS) {
    recentRequests.set(userId, hits);
    return true;
  }
  hits.push(now);
  recentRequests.set(userId, hits);
  if (recentRequests.size > 5000) {
    for (const [id, times] of recentRequests) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentRequests.delete(id);
    }
  }
  return false;
}

// Clients may only send user/assistant turns; the system prompt is controlled by the server.
const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(1)
    .max(30),
});

const STUDY_SYSTEM_PROMPT = [
  "You are Sparks AI, an exceptionally smart, friendly, and pedagogical AI study companion for students.",
  "Your mission is to help high-school, college, and university students learn concepts deeply and ace their exams.",
  "",
  "CORE GUIDELINES:",
  "1. Clarity First: Explain concepts step-by-step from foundational intuition to technical detail.",
  "2. Formatting: Use clear markdown with bold headers, bullet points, and numbered steps for readability on mobile screens.",
  "3. Math & Formulas: Present equations cleanly in plain readable text (e.g. F = m * a, KE = (1/2)mv², H₂O) without messy raw LaTeX backslashes.",
  "4. Exam Mindset: Highlight key exam definitions, common pitfalls, and memory tricks where relevant.",
  "5. Encouraging & Concise: Be supportive, engaging, and get directly to the point without unnecessary fluff.",
].join("\n");

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isRateLimited(user.id)) {
      return NextResponse.json(
        { error: "You're sending messages too quickly. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid chat messages payload." },
        { status: 400 }
      );
    }

    const messages = parsed.data.messages;
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: "This conversation is too long. Please start a new chat." },
        { status: 400 }
      );
    }

    const historyText = messages
      .map((msg) => `${msg.role === "user" ? "Student" : "Sparks AI"}: ${msg.content}`)
      .join("\n\n");

    const prompt = [
      STUDY_SYSTEM_PROMPT,
      "",
      "--- CONVERSATION HISTORY ---",
      historyText,
      "",
      "Sparks AI:",
    ].join("\n");

    const reply = await generateText(prompt, 1024, {
      timeoutMessage: "Sparks AI took too long to reply. Please try again.",
    });

    return NextResponse.json({ reply: reply.trim() });
  } catch (error) {
    console.error("[AI Chat Route Error]:", error);
    // Don't echo provider error bodies back to the client
    if (error instanceof StudyQuizGenerationError && error.code === "AI_TIMEOUT") {
      return NextResponse.json({ error: error.message }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Sparks AI couldn't respond right now. Please try again." },
      { status: 500 }
    );
  }
}
