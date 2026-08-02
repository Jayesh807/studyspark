// Diagnostic and Unicode validation utilities for PDF generation

export interface TextInspectionResult {
  value: string;
  type: string;
  containsHindi: boolean;
  containsReplacementCharacter: boolean;
  containsMojibake: boolean;
}

export function inspectText(label: string, text: string): TextInspectionResult {
  const result: TextInspectionResult = {
    value: text || "",
    type: typeof text,
    containsHindi: /[\u0900-\u097F]/.test(text || ""),
    containsReplacementCharacter: /\uFFFD/.test(text || ""),
    containsMojibake: /â€[™“”–—•]|ï¿½|à¤[x\xA0-\xFF]|à¥[x\xA0-\xFF]|•i\$/.test(text || ""),
  };

  return result;
}

// Automatically repair common double-encoded UTF-8 / Latin-1 mojibake sequences
export function repairMojibake(text: string): string {
  if (!text) return "";

  return text
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "—")
    .replace(/â€¢/g, "•")
    .replace(/ï¿½/g, "")
    .replace(/\uFFFD/g, "")
    .replace(/Â /g, " ")
    .replace(/Â/g, "");
}

export function validateDocumentText(text: string): string {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Document content is empty.");
  }

  // 1. Repair common UTF-8 / Latin-1 mis-decoding artifacts automatically
  let cleanedText = repairMojibake(text);

  // 2. Clean out any leftover unprintable replacement characters
  cleanedText = cleanedText.replace(/\uFFFD|ï¿½|•i\$/g, "");

  // 3. Return normalized NFC string (safe for both Hindi and non-Hindi text)
  return cleanedText.normalize("NFC");
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
