import { NextRequest, NextResponse } from "next/server";
import { generatedResumeSchema, resumeMakerInputSchema } from "@/lib/resume/schema";
import { generateResume, ResumeGenerationError } from "@/lib/resume/providers";
import { z } from "zod";

export const runtime = "nodejs";

const resumePdfSchema = z.object({
  mode: z.literal("pdf"),
  html: z.string().min(100).max(160000),
  fileName: z.string().trim().max(100).optional(),
  resume: generatedResumeSchema.optional(),
});

async function renderResumePdf(html: string) {
  const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
  let browser: { newPage: () => Promise<any>; close: () => Promise<void> } | null = null;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    browser = await puppeteer.default.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => null);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pdfParsed = resumePdfSchema.safeParse(body);

    if (pdfParsed.success) {
      try {
        const buffer = await renderResumePdf(pdfParsed.data.html);
        const fileName = (pdfParsed.data.fileName || "studyspark-resume")
          .toLowerCase()
          .replace(/[^a-z0-9.-]+/g, "-");

        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
            "Cache-Control": "no-store",
          },
        });
      } catch (error) {
        console.error("resume-maker pdf error:", error);
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? `Could not render resume PDF: ${error.message}`
                : "Could not render resume PDF.",
          },
          { status: 500 }
        );
      }
    }

    const parsed = resumeMakerInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Please add the required resume details.",
        },
        { status: 400 }
      );
    }

    const { getCurrentUser } = await import("@/lib/auth");
    const { db } = await import("@/lib/db");
    const user = await getCurrentUser();

    if (user) {
      const profile = await (db.profile as any).findUnique({
        where: { userId: user.id },
        select: {
          resumeGenerationsUsed: true,
          hasUnlockedResume: true,
        },
      }).catch(() => null);

      if (!profile?.hasUnlockedResume && (profile?.resumeGenerationsUsed ?? 0) >= 2) {
        return NextResponse.json(
          {
            error:
              "Free resume generation limit reached (2/2). Please upgrade to unlock lifetime access.",
          },
          { status: 403 }
        );
      }
    }

    const resume = await generateResume(parsed.data);

    if (user) {
      const profile = await (db.profile as any).findUnique({
        where: { userId: user.id },
        select: { hasUnlockedResume: true },
      }).catch(() => null);

      if (!profile?.hasUnlockedResume) {
        await (db.profile as any).upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            resumeGenerationsUsed: 1,
          },
          update: {
            resumeGenerationsUsed: { increment: 1 },
          },
        }).catch(() => null);
      }
    }

    return NextResponse.json({ resume }, { status: 200 });
  } catch (error) {
    console.error("resume-maker error:", error);
    const message =
      error instanceof ResumeGenerationError || error instanceof Error
        ? error.message
        : "Could not generate resume.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
