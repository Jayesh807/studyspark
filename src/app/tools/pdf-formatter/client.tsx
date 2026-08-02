"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  AlertCircle,
  Eye,
  Code2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/motion";
import { toast } from "sonner";

// ─── HTML Document Generator ────────────────────────────────────────────────

function buildHtmlDocument(params: {
  content: string;
  title: string;
  subtitle: string;
  includeMath: boolean;
  lang: "en" | "hi" | "mixed";
}): string {
  const { content, title, subtitle, includeMath, lang } = params;

  const htmlLang = lang === "hi" ? "hi" : "en";

  const mathJaxConfig = includeMath
    ? `
    <script>
      MathJax = {
        tex: {
          inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
          displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']],
          processEscapes: true,
        },
        options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] }
      };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>`
    : "";

  const bodyContent = markdownToHtml(content, lang);

  // ── Validate that any Hindi text in title/subtitle is proper Devanagari (U+0900–U+097F)
  // This is a no-op guard: if content passes through here it is already correct Unicode.
  // We intentionally do NOT HTML-entity-encode Devanagari characters.

  return `<!DOCTYPE html>
<html lang="${htmlLang}" dir="ltr">
<head>
  <!-- charset MUST be first element inside <head> -->
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title) || "Study Notes"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Devanagari:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
  ${mathJaxConfig}
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    body {
      font-family: "Noto Sans", "Noto Sans Devanagari", "DejaVu Sans", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.75;
      color: #1e293b;
      background: #ffffff;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    /* ── Page Wrapper ── */
    .page-wrapper {
      max-width: 794px;
      margin: 0 auto;
      padding: 0 0 40px;
    }

    /* ── Document Header Banner ── */
    .doc-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%);
      color: #fff;
      padding: 28px 36px 22px;
      margin-bottom: 32px;
      page-break-after: avoid;
    }

    .doc-header .doc-title {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.25;
      text-transform: uppercase;
      color: #ffffff;
    }

    .doc-header .doc-subtitle {
      font-size: 10pt;
      color: #93c5fd;
      margin-top: 6px;
      font-weight: 400;
    }

    .doc-header .doc-meta {
      margin-top: 12px;
      font-size: 8.5pt;
      color: #bfdbfe;
      display: flex;
      gap: 20px;
    }

    /* ── Headings ── */
    h1 {
      font-size: 16pt;
      font-weight: 700;
      color: #1e3a8a;
      border-left: 4px solid #1d4ed8;
      padding-left: 12px;
      margin: 24px 0 10px;
      page-break-after: avoid;
      line-height: 1.3;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #1d4ed8;
      border-left: 4px solid #60a5fa;
      padding-left: 10px;
      margin: 20px 0 8px;
      page-break-after: avoid;
      line-height: 1.35;
    }

    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #0f172a;
      margin: 16px 0 6px;
      page-break-after: avoid;
    }

    h4 {
      font-size: 10.5pt;
      font-weight: 600;
      color: #334155;
      margin: 12px 0 4px;
      page-break-after: avoid;
    }

    /* ── Paragraphs ── */
    p {
      margin: 8px 0;
      color: #334155;
    }

    /* ── Lists ── */
    ul, ol {
      margin: 8px 0 8px 22px;
      color: #334155;
    }

    li {
      margin: 3px 0;
      line-height: 1.7;
    }

    ul li::marker { color: #2563eb; }

    /* ── Note / Important Box ── */
    .note-box {
      background: #eff8ff;
      border-left: 5px solid #0284c7;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 14px 0;
      line-height: 1.6;
      page-break-inside: avoid;
      color: #0369a1;
    }

    .note-box strong {
      display: block;
      margin-bottom: 4px;
      color: #0c4a6e;
    }

    /* ── Warning Box ── */
    .warning-box {
      background: #fffbeb;
      border-left: 5px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 14px 0;
      page-break-inside: avoid;
      color: #92400e;
    }

    .warning-box strong {
      display: block;
      margin-bottom: 4px;
      color: #78350f;
    }

    /* ── Formula Box ── */
    .formula-box {
      background: #f8faff;
      border: 1.5px solid #c7d2fe;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 14px 0;
      text-align: center;
      font-size: 11pt;
      page-break-inside: avoid;
    }

    /* ── Code Blocks ── */
    .code-block {
      background: #0f172a;
      border-radius: 8px;
      margin: 14px 0;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .code-title {
      background: #1e293b;
      color: #93c5fd;
      padding: 7px 14px;
      font-weight: 600;
      font-size: 9pt;
      font-family: "JetBrains Mono", "Courier New", monospace;
      letter-spacing: 0.03em;
      border-bottom: 1px solid #334155;
    }

    pre {
      margin: 0;
      padding: 14px 16px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    code {
      font-family: "JetBrains Mono", "Courier New", Consolas, monospace;
      font-size: 9pt;
      color: #e2e8f0;
      line-height: 1.65;
    }

    /* Inline code */
    p code, li code {
      background: #f1f5f9;
      color: #7c3aed;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 9pt;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    thead { display: table-header-group; }

    th {
      background: #1e293b;
      color: #f8fafc;
      text-align: left;
      padding: 9px 12px;
      font-weight: 600;
      font-size: 9pt;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      vertical-align: top;
      color: #334155;
    }

    tr:nth-child(even) td { background: #f8fafc; }

    /* ── Hindi Text ── */
    .hindi-text {
      font-family: "Noto Sans Devanagari", "Mangal", sans-serif;
      line-height: 1.9;
      letter-spacing: 0;
      word-break: normal;
      overflow-wrap: break-word;
    }

    /* ── Horizontal Rule ── */
    hr {
      border: none;
      border-top: 1.5px solid #e2e8f0;
      margin: 20px 0;
    }

    /* ── Bold / Italic ── */
    strong { font-weight: 700; color: #0f172a; }
    em { font-style: italic; color: #475569; }

    /* ── Page Numbers (via CSS counter) ── */
    @media print {
      body { font-size: 10pt; }

      .doc-header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      h1, h2, h3, h4 { page-break-after: avoid; }

      table, figure, pre, .note-box, .formula-box, .code-block {
        page-break-inside: avoid;
      }

      .page-number::before { content: counter(page); }

      @page {
        @bottom-right {
          content: "Page " counter(page) " of " counter(pages);
          font-size: 8pt;
          color: #94a3b8;
          font-family: "Noto Sans", Arial, sans-serif;
        }
      }
    }

    /* ── Screen-only wrapper ── */
    @media screen {
      body { background: #f1f5f9; }
      .page-wrapper {
        background: #fff;
        box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        padding: 32px 48px 48px;
        margin: 24px auto;
        border-radius: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Document Header -->
    <div class="doc-header">
      <div class="doc-title">${escHtml(title) || "Study Notes"}</div>
      ${subtitle ? `<div class="doc-subtitle">${escHtml(subtitle)}</div>` : ""}
      <div class="doc-meta">
        <span>📅 ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
    </div>

    <!-- Document Body -->
    <div class="${lang === "hi" ? "hindi-text" : ""}">
      ${bodyContent}
    </div>
  </div>
</body>
</html>`;
}

// ─── Escape HTML ─────────────────────────────────────────────────────────────
// IMPORTANT: Only escapes the four HTML-unsafe ASCII characters.
// Devanagari (U+0900–U+097F), math symbols, emoji, and all other
// non-ASCII Unicode characters are passed through UNCHANGED as
// UTF-8 code points. Never use numeric/hex entities for Hindi text.
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  // ✅ DO NOT add .replace(/[^\x00-\x7F]/g, ...) — that would break Hindi
}

// ─── Markdown → HTML converter ───────────────────────────────────────────────
function markdownToHtml(md: string, lang: "en" | "hi" | "mixed"): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];

  let i = 0;
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  const flushCode = () => {
    if (codeLines.length === 0) return;
    const titleLine = codeLang
      ? `<div class="code-title">${escHtml(codeLang)}</div>`
      : "";
    out.push(
      `<div class="code-block">${titleLine}<pre><code>${codeLines.map(escHtml).join("\n")}</code></pre></div>`
    );
    codeLines = [];
    codeLang = "";
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
        .map((c) => c.trim());
      rows.push(cells);
    }
    if (rows.length === 0) { tableLines = []; return; }
    let tHtml = "<table><thead><tr>";
    for (const cell of rows[0]) tHtml += `<th>${inlineMarkdown(cell)}</th>`;
    tHtml += "</tr></thead><tbody>";
    for (let r = 1; r < rows.length; r++) {
      tHtml += "<tr>";
      for (const cell of rows[r]) tHtml += `<td>${inlineMarkdown(cell)}</td>`;
      tHtml += "</tr>";
    }
    tHtml += "</tbody></table>";
    out.push(tHtml);
    tableLines = [];
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // ── Code fence ──
    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
        codeLang = line.trimStart().replace(/^```/, "").trim();
      }
      i++;
      continue;
    }
    if (inCode) { codeLines.push(raw); i++; continue; }

    // ── Table rows ──
    if (line.trimStart().startsWith("|")) {
      inTable = true;
      tableLines.push(line);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    // ── Blank line ──
    if (!line.trim()) { out.push(""); i++; continue; }

    // ── Headings ──
    if (/^#{1} /.test(line))  { out.push(`<h1>${inlineMarkdown(line.replace(/^# /, ""))}</h1>`); i++; continue; }
    if (/^#{2} /.test(line))  { out.push(`<h2>${inlineMarkdown(line.replace(/^## /, ""))}</h2>`); i++; continue; }
    if (/^#{3} /.test(line))  { out.push(`<h3>${inlineMarkdown(line.replace(/^### /, ""))}</h3>`); i++; continue; }
    if (/^#{4} /.test(line))  { out.push(`<h4>${inlineMarkdown(line.replace(/^#### /, ""))}</h4>`); i++; continue; }

    // ── HR ──
    if (/^---+$/.test(line.trim())) { out.push("<hr>"); i++; continue; }

    // ── Blockquote (note-box) ──
    if (/^>\s/.test(line)) {
      const inner = line.replace(/^>\s?/, "");
      const isWarning = /^(Warning|Caution|CAUTION|WARNING):/i.test(inner);
      const boxClass = isWarning ? "warning-box" : "note-box";
      out.push(`<div class="${boxClass}"><strong>${isWarning ? "⚠️ Warning:" : "📌 Note:"}</strong><span>${inlineMarkdown(inner.replace(/^(Note|Warning|Caution):\s*/i, ""))}</span></div>`);
      i++; continue;
    }

    // ── Formula box (line surrounded by $$) ──
    if (/^\$\$/.test(line.trim()) && line.trim() !== "$$") {
      out.push(`<div class="formula-box">\\[${line.trim().replace(/\$\$/g, "")}\\]</div>`);
      i++; continue;
    }

    // ── Unordered list ──
    if (/^[-*+] /.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i].trim())) {
        listItems.push(`<li>${inlineMarkdown(lines[i].trim().replace(/^[-*+] /, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${listItems.join("")}</ul>`);
      continue;
    }

    // ── Ordered list ──
    if (/^\d+[.)]\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        listItems.push(`<li>${inlineMarkdown(lines[i].trim().replace(/^\d+[.)]\s/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${listItems.join("")}</ol>`);
      continue;
    }

    // ── Paragraph ──
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#|>|```|\||[-*+] |\d+[.)])/.test(lines[i].trimStart()) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      const hindiClass = (lang === "hi" || (lang === "mixed" && /[\u0900-\u097F]/.test(paraLines.join(""))))
        ? " hindi-text" : "";
      out.push(`<p class="${hindiClass}">${inlineMarkdown(paraLines.join(" "))}</p>`);
    }
  }

  if (inCode) flushCode();
  if (inTable) flushTable();

  return out.join("\n");
}

// ─── Inline markdown (bold, italic, inline-code, math) ────────────────────
// All replacements preserve non-ASCII Unicode (Hindi, math symbols, emoji).
// ES2017 target: no `s` flag, no lookbehind assertions.
// The `s` flag is unnecessary for inline (single-line) patterns.
// Italic underscore guard: require a non-Devanagari word boundary
// character before/after `_` so virama in Hindi conjuncts is never matched.
function inlineMarkdown(text: string): string {
  return text
    // Inline math \( \) and $ $  — run BEFORE bold/italic
    .replace(/\\\((.+?)\\\)/g, (_, m) => `\\(${m}\\)`)
    .replace(/\$([^$\n]+?)\$/g, (_, m) => `\\(${m}\\)`)
    // Display math \[ \]
    .replace(/\\\[(.+?)\\\]/g, (_, m) => `\\[${m}\\]`)
    // Bold — use character class instead of `s` flag
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+?)__/g, "<strong>$1</strong>")
    // Italic asterisk (safe — asterisk not used in Devanagari)
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    // Italic underscore: only match when surrounded by ASCII word chars
    // (digits, letters a-z, closing parens/brackets) — never inside Hindi
    .replace(/([\x20-\x2F\x3A-\x40\x5B-\x60\x7B-\x7Ea-zA-Z0-9)])_([^_\n\u0900-\u097F]+?)_([\x20-\x2F\x3A-\x40\x5B-\x60\x7B-\x7Ea-zA-Z0-9])/g,
      "$1<em>$2</em>$3")
    // Inline code
    .replace(/`([^`]+?)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2">$1</a>');
}

// ─── Main Component ──────────────────────────────────────────────────────────

type ViewMode = "split" | "preview" | "input";
type Lang = "en" | "hi" | "mixed";

export function PdfFormatterClient() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [includeMath, setIncludeMath] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live preview: update iframe whenever previewHtml changes
  useEffect(() => {
    if (!previewHtml || !iframeRef.current) return;
    iframeRef.current.srcdoc = previewHtml;
  }, [previewHtml]);

  // Auto-update preview (debounced) as user types when already generated
  useEffect(() => {
    if (!hasGenerated) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const html = buildHtmlDocument({ content, title, subtitle, includeMath, lang });
      setPreviewHtml(html);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [content, title, subtitle, includeMath, lang, hasGenerated]);

  const handleFormat = useCallback(async () => {
    if (content.trim().length < 10) {
      toast.error("Please paste at least 10 characters of content.");
      return;
    }
    setIsFormatting(true);
    try {
      // Use AI to structure content first (if long enough for AI pass)
      let structured = content;
      if (content.trim().length >= 50 && content.trim().length <= 15000) {
        try {
          const res = await fetch("/api/study-search/format-for-html", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: content, lang }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.markdown) structured = data.markdown;
          }
        } catch {
          // Fall back to raw content if AI unavailable
        }
      }

      const html = buildHtmlDocument({
        content: structured,
        title: title || extractTitleFromContent(content),
        subtitle,
        includeMath,
        lang,
      });
      setPreviewHtml(html);
      setHasGenerated(true);
      toast.success("Document formatted! Preview is ready.");
    } catch (err) {
      toast.error("Formatting failed. Please try again.");
      console.error(err);
    } finally {
      setIsFormatting(false);
    }
  }, [content, title, subtitle, includeMath, lang]);

  function extractTitleFromContent(text: string): string {
    const firstLine = text.trim().split("\n")[0];
    return firstLine.replace(/^#+\s*/, "").slice(0, 80) || "Study Notes";
  }

  const handleDownloadHtml = useCallback(() => {
    if (!previewHtml) { toast.error("Generate a preview first."); return; }
    // Use TextEncoder to produce a true UTF-8 byte stream.
    // Constructing a Blob from a JS string alone can silently produce
    // Latin-1 in some browsers — TextEncoder guarantees UTF-8 bytes.
    const encoder = new TextEncoder(); // always UTF-8 per spec
    const bytes = encoder.encode(previewHtml);
    const blob = new Blob([bytes], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "study-notes").toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML document downloaded!");
  }, [previewHtml, title]);

  const handlePrint = useCallback(() => {
    if (!previewHtml) { toast.error("Generate a preview first."); return; }
    // Open via Blob URL — avoids document.write() which ignores charset
    // and can mis-interpret Hindi bytes as Latin-1.
    const encoder = new TextEncoder();
    const bytes = encoder.encode(previewHtml);
    const blob = new Blob([bytes], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      // Revoke the object URL after the window has loaded
      win.addEventListener("load", () => {
        URL.revokeObjectURL(url);
        setTimeout(() => win.print(), 500);
      }, { once: true });
    } else {
      URL.revokeObjectURL(url);
      toast.error("Pop-up blocked. Please allow pop-ups and try again.");
    }
  }, [previewHtml]);

  const handleDownloadPdf = useCallback(async () => {
    if (content.trim().length < 50) {
      toast.error("Please add at least 50 characters to generate a PDF.");
      return;
    }
    setIsPdfLoading(true);
    try {
      const res = await fetch("/api/study-search/text-to-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "PDF generation failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "study-notes").toLowerCase().replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF failed. Please try again.");
    } finally {
      setIsPdfLoading(false);
    }
  }, [content, title]);

  const handleCopyHtml = useCallback(async () => {
    if (!previewHtml) { toast.error("Generate a preview first."); return; }
    await navigator.clipboard.writeText(previewHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("HTML copied to clipboard!");
  }, [previewHtml]);

  const SAMPLE_CONTENT = `# Motion in a Plane
Study notes on two-dimensional kinematics

## 1. Position & Displacement Vectors

A position vector **r** gives the location of a point in space:

$$\\vec{r} = x\\hat{i} + y\\hat{j}$$

The displacement vector is defined as:

$$\\vec{\\Delta r} = \\vec{r_2} - \\vec{r_1}$$

### Average Velocity

Average velocity is the displacement per unit time:

$$\\vec{v}_{avg} = \\frac{\\Delta \\vec{r}}{\\Delta t}$$

> Note: Velocity is a vector quantity — it has both magnitude and direction.

## 2. Projectile Motion

An object launched at angle $\\theta$ with speed $u$:

| Quantity | X-direction | Y-direction |
|----------|------------|------------|
| Initial velocity | $u\\cos\\theta$ | $u\\sin\\theta$ |
| Acceleration | 0 | $-g$ |
| Displacement | $u_x t$ | $u_y t - \\frac{1}{2}gt^2$ |

### Range Formula

The horizontal range is:

$$R = \\frac{u^2 \\sin 2\\theta}{g}$$

## 3. Python Example

\`\`\`python
import math

def projectile_range(u, theta_deg, g=9.8):
    theta = math.radians(theta_deg)
    return (u**2 * math.sin(2 * theta)) / g

print(projectile_range(20, 45))  # 40.82 m
\`\`\`
`;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ── */}
      <GlassCard className="p-4 sm:p-5 border-violet-500/15 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Title + Subtitle */}
          <div className="flex flex-1 flex-col gap-2">
            <input
              id="pdf-doc-title"
              type="text"
              placeholder="Document title (e.g. Motion in a Plane)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
            />
            <input
              id="pdf-doc-subtitle"
              type="text"
              placeholder="Subtitle (optional)"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-start gap-3">
            {/* Language picker */}
            <div className="relative">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Language</label>
              <div className="relative">
                <select
                  id="pdf-lang-select"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="appearance-none rounded-xl border border-border/60 bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="mixed">Mixed (EN + हिंदी)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Math toggle */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Math (MathJax)</label>
              <button
                id="pdf-math-toggle"
                onClick={() => setIncludeMath(!includeMath)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-all ${
                  includeMath
                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                    : "bg-background border-border/60 text-muted-foreground hover:border-violet-500/40"
                }`}
              >
                <span>{includeMath ? "✓" : "○"}</span>
                {includeMath ? "Enabled" : "Disabled"}
              </button>
            </div>

            {/* View mode */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">View</label>
              <div className="flex rounded-xl border border-border/60 overflow-hidden text-xs font-semibold">
                {(["split", "input", "preview"] as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-3 py-2 transition-all capitalize ${
                      viewMode === m
                        ? "bg-violet-600 text-white"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "split" ? "⊞ Split" : m === "input" ? "✎ Edit" : "👁 Preview"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Main Split Panel ── */}
      <div
        className={`grid gap-4 ${
          viewMode === "split"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* LEFT — Input */}
        {(viewMode === "split" || viewMode === "input") && (
          <GlassCard className="border-violet-500/15 shadow-xl overflow-hidden flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-violet-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Content Input
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${charCount > 14000 ? "text-red-500" : "text-muted-foreground"}`}>
                  {charCount.toLocaleString()} / 15,000
                </span>
                <button
                  onClick={() => {
                    setContent(SAMPLE_CONTENT);
                    setCharCount(SAMPLE_CONTENT.length);
                    setTitle("Motion in a Plane");
                    setSubtitle("Chapter 4 — Two-Dimensional Kinematics");
                    toast.info("Sample content loaded!");
                  }}
                  className="text-xs text-violet-500 hover:text-violet-600 font-medium transition"
                >
                  Load sample
                </button>
              </div>
            </div>

            <textarea
              id="pdf-content-input"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setCharCount(e.target.value.length);
              }}
              placeholder={`Paste your AI-generated notes here…\n\nSupports:\n• Markdown headings (# ## ###)\n• Math formulas: $E = mc^2$ or $$\\vec{F} = ma$$\n• Code blocks (triple backticks)\n• Tables | col1 | col2 |\n• Notes: > Note: key concept\n• Bold **text**, italic _text_\n• Hindi / Devanagari text`}
              className="flex-1 min-h-[420px] resize-none bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none leading-relaxed"
              spellCheck={false}
            />

            {/* Format button */}
            <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex items-center gap-3">
              <Button
                id="pdf-format-btn"
                onClick={handleFormat}
                disabled={isFormatting || content.trim().length < 10}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                {isFormatting ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Formatting…</>
                ) : (
                  <><Wand2 className="size-4 mr-2" /> Format Document</>
                )}
              </Button>
              {content.trim().length < 10 && content.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <AlertCircle className="size-3.5" />
                  Too short
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* RIGHT — Preview */}
        {(viewMode === "split" || viewMode === "preview") && (
          <GlassCard className="border-violet-500/15 shadow-xl overflow-hidden flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-violet-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Live Preview
                </span>
                {hasGenerated && (
                  <span className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                    Ready
                  </span>
                )}
              </div>

              {/* Action buttons */}
              {hasGenerated && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyHtml}
                    title="Copy HTML"
                    className="flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    <span className="hidden sm:inline">{copied ? "Copied!" : "Copy HTML"}</span>
                  </button>
                  <button
                    onClick={handleDownloadHtml}
                    title="Download HTML"
                    className="flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
                  >
                    <Download className="size-3.5" />
                    <span className="hidden sm:inline">.html</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    title="Open in new tab & Print"
                    className="flex items-center gap-1 rounded-lg bg-violet-600 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-violet-700 transition"
                  >
                    <Printer className="size-3.5" />
                    <span className="hidden sm:inline">Print / PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* iframe preview */}
            <div className="flex-1 relative">
              {!hasGenerated ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <FileText className="size-8 text-violet-500/60" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No preview yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Paste your content on the left and click <strong>Format Document</strong> to see the A4-ready preview.
                    </p>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  id="pdf-preview-iframe"
                  title="Document Preview"
                  className="w-full h-full min-h-[420px] border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {/* ── Export Row ── */}
      {hasGenerated && (
        <GlassCard className="p-4 border-violet-500/15 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-violet-500" />
              <span className="font-medium">Export your document</span>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button
                id="pdf-export-html-btn"
                variant="outline"
                onClick={handleDownloadHtml}
                className="rounded-xl border-border/60 gap-2 text-sm"
              >
                <Download className="size-4" />
                Download HTML
              </Button>
              <Button
                id="pdf-print-btn"
                variant="outline"
                onClick={handlePrint}
                className="rounded-xl border-violet-500/30 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 gap-2 text-sm"
              >
                <Printer className="size-4" />
                Open & Print (→ Save as PDF)
              </Button>
              <Button
                id="pdf-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={isPdfLoading}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg gap-2 text-sm hover:brightness-110"
              >
                {isPdfLoading ? (
                  <><Loader2 className="size-4 animate-spin" /> Generating…</>
                ) : (
                  <><FileText className="size-4" /> Download PDF</>
                )}
              </Button>
            </div>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground/70">
            💡 <strong>Best PDF quality:</strong> Use <em>Open &amp; Print</em> → Save as PDF in Chrome/Edge for full MathJax + Hindi font support. The "Download PDF" button uses a server-side renderer (math as text).
          </p>
        </GlassCard>
      )}

      {/* ── Format Guide ── */}
      <GlassCard className="p-5 border-violet-500/10">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Code2 className="size-4 text-violet-500" />
          Supported Syntax
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "Headings", code: "# H1  ## H2  ### H3" },
            { label: "Math (inline)", code: "$E = mc^2$  or  \\(v = u + at\\)" },
            { label: "Math (display)", code: "$$\\vec{F} = ma$$" },
            { label: "Code block", code: "```python\nprint('hello')\n```" },
            { label: "Note box", code: "> Note: Important concept here" },
            { label: "Warning box", code: "> Warning: Do not confuse X with Y" },
            { label: "Table", code: "| Col 1 | Col 2 |\n|-------|-------|\n| A     | B     |" },
            { label: "Bold / Italic", code: "**bold**  _italic_" },
            { label: "Lists", code: "- bullet item\n1. numbered item" },
          ].map(({ label, code }) => (
            <div key={label} className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <div className="text-xs font-semibold text-violet-600 dark:text-violet-300 mb-1.5">{label}</div>
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">{code}</pre>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
