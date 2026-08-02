import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

export interface PdfGenOptions {
  title?: string;
  subtitle?: string;
}

function getFontsDir() {
  return path.join(process.cwd(), "public", "fonts");
}

function hasFonts(): boolean {
  const dir = getFontsDir();
  return (
    fs.existsSync(path.join(dir, "NotoSansDevanagari-Regular.ttf")) &&
    fs.existsSync(path.join(dir, "NotoSansDevanagari-Bold.ttf"))
  );
}

/**
 * Generates a PDF from structured markdown-like text using PDFKit.
 * Works 100% in Netlify serverless (no Chrome / Puppeteer needed).
 */
export async function generatePdfFromMarkdown(
  markdownText: string,
  options: PdfGenOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const fontsDir = getFontsDir();
    const useCustomFont = hasFonts();

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: options.title || "Study Notes",
        Author: "Sparks AI",
      },
    });

    // Register fonts
    if (useCustomFont) {
      doc.registerFont(
        "HindiRegular",
        path.join(fontsDir, "NotoSansDevanagari-Regular.ttf")
      );
      doc.registerFont(
        "HindiBold",
        path.join(fontsDir, "NotoSansDevanagari-Bold.ttf")
      );
    }

    const regularFont = useCustomFont ? "HindiRegular" : "Helvetica";
    const boldFont = useCustomFont ? "HindiBold" : "Helvetica-Bold";

    const PAGE_WIDTH = doc.page.width - 100; // left+right margin = 100

    // Collect output
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ─── Banner ───────────────────────────────────────────────────────────
    if (options.title) {
      doc.rect(0, 0, doc.page.width, 80).fill("#1d4ed8");
      doc
        .font(boldFont)
        .fontSize(20)
        .fillColor("#ffffff")
        .text(options.title, 50, 24, { width: PAGE_WIDTH });
      if (options.subtitle) {
        doc
          .font(regularFont)
          .fontSize(11)
          .fillColor("#bfdbfe")
          .text(options.subtitle, 50, 50, { width: PAGE_WIDTH });
      }
      doc.moveDown(3);
    }

    // ─── Parse & render markdown lines ───────────────────────────────────
    const lines = markdownText.split(/\r?\n/);

    let inCodeBlock = false;
    let codeLines: string[] = [];

    const flushCode = () => {
      if (codeLines.length === 0) return;
      const codeText = codeLines.join("\n");
      // dark code block background
      const startY = doc.y;
      doc
        .font("Courier")
        .fontSize(10)
        .fillColor("#38bdf8");

      // Estimate height & draw background rect
      const textHeight = doc.heightOfString(codeText, { width: PAGE_WIDTH - 20 });
      doc
        .rect(45, startY - 4, PAGE_WIDTH + 10, textHeight + 16)
        .fill("#0f172a");

      doc
        .font("Courier")
        .fontSize(10)
        .fillColor("#38bdf8")
        .text(codeText, 55, startY + 4, { width: PAGE_WIDTH - 20 });

      doc.moveDown(1);
      codeLines = [];
    };

    for (const rawLine of lines) {
      const line = rawLine;
      const trimmed = line.trim();

      // Code block toggle
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          flushCode();
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Empty line
      if (!trimmed) {
        doc.moveDown(0.4);
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(trimmed)) {
        doc
          .moveTo(50, doc.y)
          .lineTo(50 + PAGE_WIDTH, doc.y)
          .strokeColor("#cbd5e1")
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.5);
        continue;
      }

      // H1
      if (trimmed.startsWith("# ")) {
        const text = trimmed.replace(/^# /, "");
        doc
          .rect(46, doc.y - 2, 4, doc.currentLineHeight(true) + 4)
          .fill("#2563eb");
        doc
          .font(boldFont)
          .fontSize(17)
          .fillColor("#1e3a8a")
          .text(text, 55, doc.y, { width: PAGE_WIDTH - 10 });
        doc.moveDown(0.4);
        continue;
      }

      // H2
      if (trimmed.startsWith("## ")) {
        const text = trimmed.replace(/^## /, "");
        doc
          .rect(46, doc.y - 2, 4, doc.currentLineHeight(true) + 4)
          .fill("#60a5fa");
        doc
          .font(boldFont)
          .fontSize(14)
          .fillColor("#1d4ed8")
          .text(text, 55, doc.y, { width: PAGE_WIDTH - 10 });
        doc.moveDown(0.3);
        continue;
      }

      // H3
      if (trimmed.startsWith("### ")) {
        const text = trimmed.replace(/^### /, "");
        doc
          .font(boldFont)
          .fontSize(12)
          .fillColor("#0f172a")
          .text(text, 50, doc.y, { width: PAGE_WIDTH });
        doc.moveDown(0.3);
        continue;
      }

      // Blockquote / note box
      if (trimmed.startsWith("> ")) {
        const text = trimmed.replace(/^> /, "");
        const noteText = stripInlineMd(text);
        const textHeight = doc.heightOfString(noteText, { width: PAGE_WIDTH - 30 });
        const startY = doc.y;
        doc.rect(46, startY - 4, 5, textHeight + 8).fill("#0284c7");
        doc
          .rect(51, startY - 4, PAGE_WIDTH - 6, textHeight + 8)
          .fill("#eff8ff");
        doc
          .font(regularFont)
          .fontSize(11)
          .fillColor("#0369a1")
          .text(noteText, 60, startY, { width: PAGE_WIDTH - 20 });
        doc.moveDown(0.5);
        continue;
      }

      // Bullet list
      if (/^[-*]\s/.test(trimmed)) {
        const text = stripInlineMd(trimmed.replace(/^[-*]\s/, ""));
        doc
          .font(regularFont)
          .fontSize(11)
          .fillColor("#334155")
          .text(`• ${text}`, 60, doc.y, { width: PAGE_WIDTH - 15 });
        doc.moveDown(0.2);
        continue;
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        if (match) {
          const num = match[1];
          const text = stripInlineMd(match[2]);
          doc
            .font(regularFont)
            .fontSize(11)
            .fillColor("#334155")
            .text(`${num}. ${text}`, 60, doc.y, { width: PAGE_WIDTH - 15 });
          doc.moveDown(0.2);
          continue;
        }
      }

      // Bold-only line (treat as a sub-heading)
      if (/^\*\*(.+)\*\*$/.test(trimmed)) {
        const text = trimmed.replace(/^\*\*/, "").replace(/\*\*$/, "");
        doc
          .font(boldFont)
          .fontSize(11)
          .fillColor("#0f172a")
          .text(text, 50, doc.y, { width: PAGE_WIDTH });
        doc.moveDown(0.2);
        continue;
      }

      // Normal paragraph
      const text = stripInlineMd(trimmed);
      doc
        .font(regularFont)
        .fontSize(11)
        .fillColor("#334155")
        .text(text, 50, doc.y, { width: PAGE_WIDTH });
      doc.moveDown(0.3);
    }

    if (inCodeBlock) flushCode();

    doc.end();
  });
}

/** Strip inline markdown (bold, italic, inline code, links) to plain text */
function stripInlineMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
