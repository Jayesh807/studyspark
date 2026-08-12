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
      margin: 0;
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
      padding: 32px 32px 24px;
      margin: 0 0 24px 0;
      width: 100%;
      border-radius: 0;
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

    /* Fallback: show raw math in monospace until MathJax renders */
    mjx-container, .MathJax { font-family: inherit; }
    .math-fallback { font-family: "Consolas", "Courier New", monospace; font-size: 0.95em; color: #1e3a8a; background: #f0f4ff; padding: 1px 4px; border-radius: 3px; }
    body.mathjax-ready .math-fallback { font-family: inherit; background: none; padding: 0; color: inherit; }

    /* Sticky Action Bar */
    .doc-action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 20px;
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid #e2e8f0;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
      font-family: "Segoe UI", Roboto, sans-serif;
    }
    .doc-action-bar button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 18px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .doc-action-bar .btn-download {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #fff;
      box-shadow: 0 2px 8px rgba(37,99,235,0.3);
    }
    .doc-action-bar .btn-download:hover { background: linear-gradient(135deg, #1d4ed8, #1e3a8a); }
    .doc-action-bar .btn-print {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .doc-action-bar .btn-print:hover { background: #e2e8f0; }
    .doc-action-bar .btn-copy {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .doc-action-bar .btn-copy:hover { background: #e2e8f0; }
    .doc-action-bar .btn-copy.copied { background: #dcfce7; color: #166534; border-color: #86efac; }
    .doc-action-bar .bar-label {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
      margin-right: 4px;
    }

    /* Add bottom padding to body so action bar doesn't cover content */
    body { padding-bottom: 72px; }

    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .doc-container {
        padding: 14mm 16mm !important;
        max-width: none !important;
        box-shadow: none !important;
      }
      .doc-banner {
        border-radius: 0;
        box-shadow: none;
      }
      .doc-action-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${title ? `<div class="doc-banner"><h1>${title}</h1>${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}</div>` : ""}
  <div class="doc-container">
    ${bodyContentHtml}
  </div>

  <!-- Sticky Action Bar -->
  <div class="doc-action-bar" id="doc-action-bar">
    <span class="bar-label">📄 StudySpark</span>
    <button class="btn-download" onclick="window.print()" title="Save as PDF via browser print dialog">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download PDF
    </button>
    <button class="btn-print" onclick="window.print()" title="Print this document">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print
    </button>
    <button class="btn-copy" id="copy-btn" title="Copy all text to clipboard">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy All
    </button>
  </div>

  <script>
    // Copy all text functionality
    document.getElementById('copy-btn').addEventListener('click', async function() {
      var btn = this;
      try {
        var container = document.querySelector('.doc-container');
        var text = container ? container.innerText : document.body.innerText;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.classList.add('copied');
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(function() {
          btn.classList.remove('copied');
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy All';
        }, 2000);
      } catch(e) { alert('Could not copy text. Please select and copy manually.'); }
    });

    // MathJax ready detection
    function checkMathJax() {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().then(function() {
          document.body.classList.add('mathjax-ready');
        }).catch(function() {});
      } else {
        setTimeout(checkMathJax, 300);
      }
    }
    if (document.querySelector('[class*="math"], mjx-container') || document.body.innerHTML.match(/\$[^$]+\$|\\\[|\\\(/)) {
      checkMathJax();
    } else {
      document.body.classList.add('mathjax-ready');
    }
  </script>
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
          margin: { top: "0", right: "0", bottom: "15mm", left: "0" },
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
        function doPrint() { setTimeout(function() { window.print(); }, 400); }
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise().then(doPrint).catch(doPrint);
        } else if (document.body.innerHTML.match(/\\$[^$]+\\$|\\\\\\[|\\\\\\(/)) {
          var attempts = 0;
          var waitForMathJax = setInterval(function() {
            attempts++;
            if (window.MathJax && window.MathJax.typesetPromise) {
              clearInterval(waitForMathJax);
              window.MathJax.typesetPromise().then(doPrint).catch(doPrint);
            } else if (attempts > 30) {
              clearInterval(waitForMathJax);
              doPrint();
            }
          }, 200);
        } else {
          doPrint();
        }
      };
    </script></body>`
  );


  return { buffer: Buffer.from(autoPrintHtml, "utf-8"), isHtml: true };
}
