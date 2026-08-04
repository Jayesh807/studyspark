import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { formatStudyTextForPdf } from "@/lib/study/ai";
import { inspectText, validateDocumentText, escapeHtml } from "@/lib/study/pdf-unicode";
import { buildCompleteHtmlDocument, generatePdfWithPuppeteer } from "@/lib/study/pdf-generator";

export const runtime = "nodejs";

const textToPdfSchema = z.object({
  text: z.string().trim().min(10).max(15000),
  formatTag: z.enum(["english", "hindi", "maths", "summary", "code"]).optional().default("english"),
});

function formatInlineMarkdown(text: string): string {
  if (!text) return "";

  let formatted = text
    .replace(/\x0Crac/g, "\\frac")
    .replace(/\x09au/g, "\\tau")
    .replace(/\x09ext/g, "\\text")
    .replace(/\right/g, "\\right");

  // Protect display math blocks \[...\] and inline \(...\) before HTML escaping
  const mathBlocks: string[] = [];
  formatted = formatted.replace(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g, (match) => {
    mathBlocks.push(match);
    return `%%MATHBLOCK_${mathBlocks.length - 1}%%`;
  });

  // Protect $...$ and $$...$$ blocks
  const dollarBlocks: string[] = [];
  formatted = formatted.replace(/(\$\$[\s\S]*?\$\$|\$[^\s$][^$]*?\$)/g, (match) => {
    dollarBlocks.push(match);
    return `%%DOLLARMATH_${dollarBlocks.length - 1}%%`;
  });

  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Restore dollar math blocks (un-escape any HTML entities inside them)
  formatted = formatted.replace(/%%DOLLARMATH_(\d+)%%/g, (_match, idx) => {
    return dollarBlocks[Number(idx)]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  });

  // Restore backslash math blocks
  formatted = formatted.replace(/%%MATHBLOCK_(\d+)%%/g, (_match, idx) => {
    return mathBlocks[Number(idx)];
  });

  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  return formatted;
}


function markdownToBodyHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];

  let i = 0;
  let inCode = false;
  let codeLines: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  const flushCode = () => {
    if (codeLines.length === 0) return;
    out.push(
      `<div class="code-block"><pre><code>${codeLines.map(escapeHtml).join("\n")}</code></pre></div>`
    );
    codeLines = [];
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const rows: string[][] = [];
    for (const tl of tableLines) {
      if (/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$/.test(tl)) continue;
      const cells = tl
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => formatInlineMarkdown(c.trim()));
      rows.push(cells);
    }
    if (rows.length === 0) {
      tableLines = [];
      return;
    }
    let tHtml = "<table><thead><tr>";
    for (const cell of rows[0]) tHtml += `<th>${cell}</th>`;
    tHtml += "</tr></thead><tbody>";
    for (let r = 1; r < rows.length; r++) {
      tHtml += "<tr>";
      for (const cell of rows[r]) tHtml += `<td>${cell}</td>`;
      tHtml += "</tr>";
    }
    tHtml += "</tbody></table>";
    out.push(tHtml);
    tableLines = [];
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
      }
      i++;
      continue;
    }
    if (inCode) {
      codeLines.push(raw);
      i++;
      continue;
    }

    if (line.trimStart().startsWith("|")) {
      inTable = true;
      tableLines.push(line);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    if (!line.trim()) {
      out.push("");
      i++;
      continue;
    }

    if (/^#{1}\s+/.test(line)) {
      out.push(`<h1>${formatInlineMarkdown(line.replace(/^#\s+/, ""))}</h1>`);
      i++;
      continue;
    }
    if (/^#{2}\s+/.test(line)) {
      out.push(`<h2>${formatInlineMarkdown(line.replace(/^##\s+/, ""))}</h2>`);
      i++;
      continue;
    }
    if (/^#{3}\s+/.test(line)) {
      out.push(`<h3>${formatInlineMarkdown(line.replace(/^###\s+/, ""))}</h3>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line.trim())) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const curr = lines[i].trim();
        if (
          quoteLines.length > 0 &&
          (curr.startsWith("#") ||
            curr.startsWith("---") ||
            /^(?:questions|answers|q\.\d|\d+[\).])/i.test(curr))
        ) {
          break;
        }
        const cleaned = curr.replace(/^>\s?/, "");
        if (cleaned) {
          quoteLines.push(formatInlineMarkdown(cleaned));
        }
        i++;
      }
      if (quoteLines.length > 0) {
        out.push(
          `<div class="note-box">${quoteLines.map((l) => `<p style="margin: 6px 0; font-size: 0.95em;">${l}</p>`).join("")}</div>`
        );
      }
      continue;
    }

    if (/^[-*+]\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*+]\s/, "");
        listItems.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
        i++;
      }
      out.push(`<ul>${listItems.join("")}</ul>`);
      continue;
    }

    if (/^\d+[.)]\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+[.)]\s/, "");
        listItems.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
        i++;
      }
      out.push(`<ol>${listItems.join("")}</ol>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      out.push('<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;">');
      i++;
      continue;
    }

    out.push(`<p>${formatInlineMarkdown(line)}</p>`);
    i++;
  }

  if (inCode) flushCode();
  if (inTable) flushTable();

  return out.join("\n");
}

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
    const safeTextBeforeHtml = validateDocumentText(formattedMarkdown);

    // Extract title from first line if it starts with #
    let safeTextForBody = safeTextBeforeHtml;
    let docTitle = "Study Notes";
    const rawLines = safeTextBeforeHtml.trim().split("\n");
    if (rawLines[0] && /^#\s+/.test(rawLines[0].trim())) {
      docTitle = rawLines[0].trim().replace(/^#\s+/, "").slice(0, 80);
      safeTextForBody = rawLines.slice(1).join("\n").trim();
    }

    // Convert markdown structure to HTML body
    const bodyHtml = markdownToBodyHtml(safeTextForBody);

    // Build complete HTML with embedded local Devanagari fonts & UTF-8 meta
    const html = buildCompleteHtmlDocument(bodyHtml, {
      title: docTitle,
      subtitle: "",
      lang: "hi",
    });

    // Generate PDF via Puppeteer (local) or HTML auto-print fallback (Netlify)
    const { buffer, isHtml } = await generatePdfWithPuppeteer(html);

    if (isHtml) {
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(new Uint8Array(buffer), {
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
