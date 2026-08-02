import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { formatStudyTextForPdf } from "@/lib/study/ai";

export const runtime = "nodejs";

const schema = z.object({
  text: z.string().trim().min(50).max(15000),
  lang: z.enum(["en", "hi", "mixed"]).optional().default("en"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paste between 50 and 15,000 characters." },
        { status: 400 }
      );
    }

    // Re-use the existing AI formatter — it returns clean markdown
    const markdown = await formatStudyTextForPdf(parsed.data.text);

    return NextResponse.json({ markdown }, { status: 200 });
  } catch (error) {
    console.error("format-for-html error:", error);
    const message =
      error instanceof Error ? error.message : "Could not format content.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
