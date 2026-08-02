import { NextRequest } from "next/server";
import { validateDocumentText } from "@/lib/study/pdf-unicode";
import { generatePdfFromMarkdown } from "@/lib/study/pdf-generator";
import { formatStudyTextForPdf } from "@/lib/study/ai";

export const runtime = "nodejs";

const HARDCODED_HINDI_TEST = `
# द्वि-आयामी गति के मूल सिद्धांत

किसी समतल में गति को समझने के लिए स्थिति, वेग और त्वरण का अध्ययन किया जाता है।

## प्रक्षेप्य गति

प्रक्षेप्य वह वस्तु है जिसे प्रारंभिक वेग से छोड़ा जाता है और जिस पर गुरुत्वाकर्षण कार्य करता है।

- प्रारंभिक वेग: u
- त्वरण: g
`;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const testMode = url.searchParams.get("mode") || "hardcoded";

    let rawText = "";

    if (testMode === "ai") {
      const samplePrompt = "द्वि-आयामी गति और प्रक्षेप्य गति के मुख्य नियम और सूत्र समझाइए।";
      rawText = await formatStudyTextForPdf(samplePrompt);
    } else {
      rawText = HARDCODED_HINDI_TEST;
    }

    // Validate & normalize
    const safeText = validateDocumentText(rawText);

    // Generate PDF using PDFKit (works on Netlify - no Chrome needed)
    const pdfBuffer = await generatePdfFromMarkdown(safeText, {
      title: "द्वि-आयामी गति टेस्ट",
      subtitle: "Hindi Devanagari PDF Generation Test",
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="hindi-test-${testMode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Test Hindi PDF Generation Error:", error);
    const message = error instanceof Error ? error.message : "PDF Generation failed";
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
