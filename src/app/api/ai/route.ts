import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateText } from "@/lib/study/ai";

export const runtime = "nodejs";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
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

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid chat messages payload." },
        { status: 400 }
      );
    }

    const messages = parsed.data.messages;
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

    const reply = await generateText(prompt, 1024);

    return NextResponse.json({ reply: reply.trim() });
  } catch (error) {
    console.error("[AI Chat Route Error]:", error);
    const message = error instanceof Error ? error.message : "Failed to generate AI response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
