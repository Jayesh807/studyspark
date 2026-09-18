import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateText } from "@/lib/study/ai";

export const runtime = "nodejs";

const searchSchema = z.object({
  query: z.string().trim().min(2).max(300),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Please provide a valid search query." },
        { status: 400 }
      );
    }

    const query = parsed.data.query;

    const prompt = [
      `You are an expert academic educator and study search engine.`,
      `The student searched for: "${query}".`,
      `Provide a comprehensive, high-quality, exam-ready breakdown for this topic in STRICT JSON format.`,
      "",
      "STRICT JSON OUTPUT FORMAT (Return valid JSON ONLY, no markdown wrapping):",
      JSON.stringify(
        {
          title: "Formal Topic Name",
          category: "Physics / Chemistry / Mathematics / Computer Science / Biology / History / etc.",
          summary: "Clear, intuitive 2-3 sentence overview explaining what this concept is and why it matters.",
          keyPoints: [
            "First fundamental principle or mechanism",
            "Second core concept or relationship",
            "Third important takeaway or law",
          ],
          formulasOrLaws: [
            "Formula / law 1 with clear explanation of variables",
            "Formula / law 2",
          ],
          examTips: [
            "Common student misconception to avoid in exams",
            "Key numerical or theoretical trick teachers frequently test",
          ],
          relatedTopics: ["Related Concept A", "Related Concept B", "Related Concept C"],
        },
        null,
        2
      ),
    ].join("\n");

    const rawResponse = await generateText(prompt, 1200, { jsonMode: true });

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(rawResponse);
    } catch {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid AI search output format.");
      }
    }

    return NextResponse.json({
      query,
      result: parsedResult,
    });
  } catch (error) {
    console.error("[Study Search Error]:", error);
    const message = error instanceof Error ? error.message : "Study search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
