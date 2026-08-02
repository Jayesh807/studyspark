import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inspectText, validateDocumentText, escapeHtml } from "./pdf-unicode";

export interface HtmlPdfOptions {
  title?: string;
  subtitle?: string;
  lang?: string;
  includeMathJax?: boolean;
}

export function getLocalFontData() {
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const regularFontPath = path.join(fontsDir, "NotoSansDevanagari-Regular.ttf");
  const boldFontPath = path.join(fontsDir, "NotoSansDevanagari-Bold.ttf");

  const regularFontBuffer = fs.existsSync(regularFontPath)
    ? fs.readFileSync(regularFontPath)
    : Buffer.from("");
  const boldFontBuffer = fs.existsSync(boldFontPath)
    ? fs.readFileSync(boldFontPath)
    : Buffer.from("");

  return {
    regularFontPath,
    boldFontPath,
    regularFontUrl: fs.existsSync(regularFontPath) ? pathToFileURL(regularFontPath).href : "",
    boldFontUrl: fs.existsSync(boldFontPath) ? pathToFileURL(boldFontPath).href : "",
    regularFontBase64: regularFontBuffer.toString("base64"),
    boldFontBase64: boldFontBuffer.toString("base64"),
  };
}

export function buildCompleteHtmlDocument(bodyContentHtml: string, options: HtmlPdfOptions = {}): string {
  const fontData = getLocalFontData();
  const lang = options.lang || "hi";
  const title = options.title ? escapeHtml(options.title) : "";
  const subtitle = options.subtitle ? escapeHtml(options.subtitle) : "";

  const fontFaceStyle = fontData.regularFontBase64
    ? `
    @font-face {
      font-family: "HindiPDF";
      src: url("data:font/ttf;charset=utf-8;base64,${fontData.regularFontBase64}") format("truetype");
      font-weight: 400;
      font-style: normal;
    }

    @font-face {
      font-family: "HindiPDF";
      src: url("data:font/ttf;charset=utf-8;base64,${fontData.boldFontBase64}") format("truetype");
      font-weight: 700;
      font-style: normal;
    }
    `
    : "";

  const mathJaxScript = options.includeMathJax !== false
    ? `
    <script>
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
          displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
          processEscapes: true
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
        }
      };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title || "Document"}</title>
  ${mathJaxScript}
  <style>
    ${fontFaceStyle}

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      font-family:
        "HindiPDF",
        "Noto Sans Devanagari",
        "Mangal",
        "Segoe UI",
        Roboto,
        sans-serif;
      font-size: 15px;
      line-height: 1.75;
      color: #1e293b;
      background: #ffffff;
    }

    h1, h2, h3, h4, p, td, th, li, div, span {
      font-family:
        "HindiPDF",
        "Noto Sans Devanagari",
        "Mangal",
        "Segoe UI",
        Roboto,
        sans-serif;
    }

    .doc-banner {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      color: #ffffff;
      padding: 28px 24px;
      margin: 0 0 24px 0;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(29, 78, 216, 0.15);
    }

    .doc-banner h1 {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.35;
      margin: 0 0 6px 0;
      border: none;
      padding: 0;
    }

    .doc-banner .subtitle {
      font-size: 13.5px;
      font-weight: 600;
      color: #bfdbfe;
      margin: 0;
    }

    .doc-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 0 12px 24px 12px;
    }

    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #1e3a8a;
      border-left: 4px solid #2563eb;
      padding-left: 12px;
      margin: 20px 0 10px;
      page-break-after: avoid;
    }

    h2 {
      font-size: 17px;
      font-weight: 700;
      color: #1d4ed8;
      border-left: 4px solid #60a5fa;
      padding-left: 10px;
      margin: 18px 0 8px;
      page-break-after: avoid;
    }

    h3 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 14px 0 6px;
      page-break-after: avoid;
    }

    p {
      margin: 8px 0 12px;
      color: #334155;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
      page-break-inside: avoid;
    }

    thead {
      display: table-header-group;
    }

    th {
      background: #1e293b;
      color: #ffffff;
      text-align: left;
      padding: 10px 12px;
      font-weight: 700;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      vertical-align: top;
      color: #334155;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .note-box {
      background: #eff8ff;
      border-left: 5px solid #0284c7;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 16px 0;
      line-height: 1.6;
      page-break-inside: avoid;
      color: #0369a1;
    }

    .code-block {
      background: #0f172a;
      color: #38bdf8;
      border: 1px solid #1e293b;
      border-radius: 8px;
      margin: 16px 0;
      overflow: hidden;
      page-break-inside: avoid;
    }

    pre {
      margin: 0;
      padding: 14px 16px;
      white-space: pre-wrap;
      word-break: break-all;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 12.5px;
      line-height: 1.6;
      color: #38bdf8;
      background: #0f172a;
    }

    .inline-code {
      background-color: #f1f5f9;
      color: #0284c7;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 1.5px 5px;
      font-size: 12.5px;
      font-family: "Consolas", "Courier New", monospace;
      font-weight: 600;
    }

    ul, ol {
      margin: 8px 0 8px 24px;
    }

    li {
      margin: 4px 0;
    }

    @media print {
      body {
        background: #ffffff;
      }
      .doc-banner {
        border-radius: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  ${title ? `<div class="doc-banner"><h1>${title}</h1>${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}</div>` : ""}
  <div class="doc-container">
    ${bodyContentHtml}
  </div>
</body>
</html>`;
}

export async function generatePdfWithPuppeteer(html: string): Promise<{ buffer: Buffer; isHtml: boolean }> {
  const isNetlify = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

  // Try Puppeteer locally if not on Netlify
  if (!isNetlify) {
    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.default.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--allow-file-access-from-files",
          "--font-render-hinting=medium",
        ],
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" as never });
        await page.evaluate(async () => {
          await document.fonts.ready;
          let attempts = 0;
          while (!(window as never as { MathJax?: { typesetPromise?: () => Promise<void> } }).MathJax?.typesetPromise && attempts < 60) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
          }
          const mjx = (window as never as { MathJax?: { typesetPromise?: () => Promise<void> } }).MathJax;
          if (mjx?.typesetPromise) {
            await mjx.typesetPromise();
          }
        });

        const pdfUint8Array = await page.pdf({
          format: "A4",
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
        });

        return { buffer: Buffer.from(pdfUint8Array), isHtml: false };
      } finally {
        await browser.close().catch(() => null);
      }
    } catch (err) {
      console.warn("[PDF Generator]: Local Puppeteer failed, falling back to HTML print mode:", err);
    }
  }

  // Serverless / Netlify Fallback: Return complete, self-contained HTML document with auto-print trigger
  const autoPrintHtml = html.replace(
    "</body>",
    `<script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 600);
      };
    </script></body>`
  );

  return { buffer: Buffer.from(autoPrintHtml, "utf-8"), isHtml: true };
}
