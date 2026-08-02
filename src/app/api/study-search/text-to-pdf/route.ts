import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { formatStudyTextForPdf } from "@/lib/study/ai";
import { validateDocumentText } from "@/lib/study/pdf-unicode";
import { generatePdfFromMarkdown } from "@/lib/study/pdf-generator";

export const runtime = "nodejs";

const textToPdfSchema = z.object({
  text: z.string().trim().min(10).max(15000),
  formatTag: z.enum(["english", "hindi", "maths", "summary", "code"]).optional().default("english"),
});


export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = textToPdfSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paste between 10 and 15,000 characters to create a PDF." },
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    const rawInputText = parsed.data.text;
    const formatTag = parsed.data.formatTag;

    // AI formatting step with formatTag mode
    const formattedMarkdown = await formatStudyTextForPdf(rawInputText, formatTag);

    // Validate & normalize text before PDF generation
    const safeText = validateDocumentText(formattedMarkdown);

    // Extract title from first line if it starts with #
    let textForBody = safeText;
    let docTitle = "Study Notes";
    const rawLines = safeText.trim().split("\n");
    if (rawLines[0] && /^#\s+/.test(rawLines[0].trim())) {
      docTitle = rawLines[0].trim().replace(/^#\s+/, "").slice(0, 80);
      textForBody = rawLines.slice(1).join("\n").trim();
    }

    // Generate PDF using PDFKit (works on Netlify - no Chrome needed!)
    const pdfBuffer = await generatePdfFromMarkdown(textForBody, {
      title: docTitle,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="study-sparks-notes.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Text to PDF error:", error);
    const message = error instanceof Error ? error.message : "Could not create PDF.";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}
