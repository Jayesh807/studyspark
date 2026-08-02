import { z } from "zod";
import type { StudyQuizItem, StudySource } from "./types";

const quizItemSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
  explanation: z.string().min(5),
});

const quizResponseSchema = z.object({
  questions: z.array(quizItemSchema),
});

function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
}

function chatModel() {
  return process.env.OLLAMA_CHAT_MODEL || "qwen2.5";
}

function embedModel() {
  return process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
}

async function postOllama<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${ollamaBaseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Local AI is not running. Start Ollama, or set GROQ_API_KEY / GEMINI_API_KEY in your environment."
    );
  }

  if (!response.ok) {
    throw new Error("Local AI is not ready. Start Ollama, or set GROQ_API_KEY / GEMINI_API_KEY.");
  }

  return (await response.json()) as T;
}

async function generateText(prompt: string, maxTokens: number = 2048): Promise<string> {
  // 1. Try Groq Cloud API if GROQ_API_KEY is configured
  if (process.env.GROQ_API_KEY) {
    const groqModels = process.env.GROQ_MODEL
      ? [process.env.GROQ_MODEL]
      : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"];

    // Cap max_tokens to 4096 for Groq API compatibility
    const groqMaxTokens = Math.min(maxTokens, 4096);

    for (const model of groqModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.15,
            max_tokens: groqMaxTokens,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const content = data.choices?.[0]?.message?.content;
          if (content) return content.trim();
        } else {
          const errText = await res.text().catch(() => "");
          console.error(`[Groq API ${res.status} - ${model}]:`, errText);
        }
      } catch (err) {
        console.error(`[Groq API Exception - ${model}]:`, err);
      }
    }
  }

  // 2. Try Gemini Cloud API if GEMINI_API_KEY is configured
  if (process.env.GEMINI_API_KEY) {
    const key = process.env.GEMINI_API_KEY.trim();
    const modelsToTry = process.env.GEMINI_MODEL
      ? [process.env.GEMINI_MODEL]
      : ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];

    let lastError = "";
    let isRateLimit = false;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.15,
                  maxOutputTokens: maxTokens,
                },
              }),
            }
          );

          if (res.ok) {
            const data = (await res.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) return content.trim();
          } else {
            if (res.status === 429) {
              isRateLimit = true;
              // Short 2.5s wait before auto retry
              await new Promise((resolve) => setTimeout(resolve, 2500));
              continue;
            }
            const errJson = await res.json().catch(() => ({}));
            lastError = errJson?.error?.message || `HTTP ${res.status}`;
            break;
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    if (isRateLimit) {
      throw new Error("Sparks AI limit reached. Please wait 10 seconds and try again.");
    }

    if (lastError) {
      throw new Error(`Sparks AI Error: ${lastError}`);
    }
  }

  // 3. Fallback to local Ollama
  // Updated AI Service: Groq max_tokens capped to 4096 for 100% compatibility
  const result = await postOllama<{ response: string }>("/api/generate", {
    model: chatModel(),
    stream: false,
    options: {
      temperature: 0.15,
      top_p: 0.8,
      num_predict: maxTokens,
    },
    prompt,
  });

  return result.response.trim();
}

/**
 * Normalize AI quiz responses that use heading-style questions like:
 *   ### Question 1:
 *   What is the actual question?
 * into the expected format:
 *   1. What is the actual question?
 */
function preprocessQuizText(text: string): string {
  // Replace "### Question N:" or "## N." or "**Question N:**" headings
  // followed by the actual question on the next line
  let result = text.replace(
    /^#+\s*(?:Question\s+)?(\d+)\s*[:.]*\s*\n\s*(?:Question\s*[:.?]*\s*)?(.+)/gim,
    "$1. $2"
  );
  // Also handle "**N.** Question text" or "**Question N:** Question text" on same line
  result = result.replace(
    /^\*\*(?:Question\s+)?(\d+)[.:]*\*\*\s*(?:Question\s*[:.?]*\s*)?(.+)/gim,
    "$1. $2"
  );
  return result;
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI returned an invalid quiz format. Please try again.");
  }
  return text.slice(start, end + 1);
}

function parseMarkdownQuiz(text: string, questionCount: number): StudyQuizItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const items: StudyQuizItem[] = [];
  let current:
    | {
      question: string;
      options: string[];
      answer: string;
    }
    | null = null;

  for (const line of lines) {
    const questionMatch = line.match(/^\d+[\).]\s+(.+)/);
    if (questionMatch) {
      if (current && (current.options.length === 4 || current.options.length === 2) && current.answer) {
        items.push({
          question: current.question,
          options: current.options,
          answer: current.answer,
          explanation: "This answer is based on the uploaded PDF.",
        });
      }
      current = {
        question: questionMatch[1].trim(),
        options: [],
        answer: "",
      };
      continue;
    }

    const optionMatch = line.match(/^[A-D][\).]\s+(.+)/i);
    if (optionMatch && current) {
      const rawOption = optionMatch[1].trim();
      const isAnswer =
        /✅|✔|correct answer|answer/i.test(rawOption) ||
        /\*\*/.test(rawOption);
      const option = rawOption
        .replace(/✅|✔/g, "")
        .replace(/\*\*/g, "")
        .replace(/\s*\(correct\)\s*/i, "")
        .trim();

      current.options.push(option);
      if (isAnswer) current.answer = option;
      continue;
    }

    // Handle "Answer: X" line (letter or full text)
    const answerLineMatch = line.match(/^(?:answer|correct answer)\s*[:.:]\s*(.+)/i);
    if (answerLineMatch && current) {
      const answerValue = answerLineMatch[1].trim();
      const letterMatch = answerValue.match(/^([A-D])\b/i);
      if (letterMatch && (current.options.length === 4 || current.options.length === 2)) {
        const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (current.options[idx]) current.answer = current.options[idx];
      } else {
        current.answer = answerValue;
      }
    }
  }

  if (current && (current.options.length === 4 || current.options.length === 2) && current.answer) {
    items.push({
      question: current.question,
      options: current.options,
      answer: current.answer,
      explanation: "This answer is based on the uploaded PDF.",
    });
  }

  return items.slice(0, questionCount);
}

function parseAnswerLineQuiz(text: string, questionCount: number): StudyQuizItem[] {
  const blocks = text
    .split(/(?=^\s*\d+[\).]\s+)/m)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.flatMap((block) => {
    const question = block.match(/^\s*\d+[\).]\s+(.+)/m)?.[1]?.trim();
    const options = [...block.matchAll(/^\s*([A-D])[\).]\s+(.+)$/gim)].map(
      (match) => cleanOption(match[2])
    );
    const answerText = block.match(/^\s*(?:answer|correct answer)\s*:\s*(.+)$/im)?.[1]?.trim();
    const explanation =
      block.match(/^\s*explanation\s*:\s*(.+)$/im)?.[1]?.trim() ??
      "This answer is based on the uploaded PDF.";

    if (!question || (options.length !== 4 && options.length !== 2) || !answerText) return [];

    return [
      {
        question,
        options,
        answer: answerText,
        explanation,
      },
    ];
  }).slice(0, questionCount);
}

function isUsableQuizItem(item: StudyQuizItem) {
  const answerLower = item.answer.toLowerCase();
  const optionsLower = item.options.map((option) => option.toLowerCase());

  const isTrueFalse =
    /true or false|state whether true or false/i.test(item.question) ||
    (item.options.length === 2 &&
      optionsLower.includes("true") &&
      optionsLower.includes("false"));

  if (isTrueFalse) {
    return (
      item.question.length >= 8 &&
      (item.options.length === 2 || item.options.length === 4) &&
      optionsLower.some((opt) => opt === answerLower || answerLower.startsWith(opt))
    );
  }

  return (
    item.question.length >= 10 &&
    (item.options.length === 4 || item.options.length === 2) &&
    new Set(optionsLower).size >= 2 &&
    optionsLower.some((option) => option === answerLower)
  );
}

function cleanOption(value: string) {
  return value
    .trim()
    .replace(/^[A-D][\).:-]\s*/i, "")
    .replace(/[\u2705\u2714]/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s*\(correct\)\s*/i, "")
    .trim();
}

function quizItemsFromUnknown(value: unknown): StudyQuizItem[] {
  const root = value as {
    questions?: unknown;
    quiz?: unknown;
    items?: unknown;
  };
  const rawItems = Array.isArray(value)
    ? value
    : Array.isArray(root.questions)
      ? root.questions
      : Array.isArray(root.quiz)
        ? root.quiz
        : Array.isArray(root.items)
          ? root.items
          : [];

  return rawItems.flatMap((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    const question = item.question ?? item.prompt ?? item.q;
    const answer =
      item.answer ??
      item.correctAnswer ??
      item.correct_answer ??
      item.correctOption ??
      item.correct_option ??
      item.correct;
    const explanation = item.explanation ?? item.reason ?? item.why;
    const rawOptions = item.options ?? item.choices;
    const options = Array.isArray(rawOptions)
      ? rawOptions
      : rawOptions && typeof rawOptions === "object"
        ? Object.values(rawOptions)
        : [];

    if (typeof question !== "string" || typeof answer !== "string") {
      return [];
    }

    return [
      {
        question,
        options: options.map((option) => String(option)),
        answer,
        explanation:
          typeof explanation === "string" && explanation.trim()
            ? explanation
            : "This answer is based on the uploaded PDF.",
      },
    ];
  });
}

function normalizeQuizItem(item: StudyQuizItem): StudyQuizItem {
  const options = item.options.map(cleanOption).filter(Boolean);
  const rawAnswer = cleanOption(item.answer);
  const answerLetter = item.answer.trim().match(/^[A-D]\b/i)?.[0].toUpperCase();
  const answerByLetter = answerLetter
    ? options[answerLetter.charCodeAt(0) - 65]
    : undefined;
  const answer =
    answerByLetter ??
    options.find((option) => option.toLowerCase() === rawAnswer.toLowerCase()) ??
    options.find((option) => rawAnswer.toLowerCase().includes(option.toLowerCase())) ??
    rawAnswer;

  const question = item.question
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^\d+[\).]\s*/, "")
    .replace(/^(?:question|q)\s*\d*[:.?]*\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    question: question.endsWith("?") ? question : `${question}?`,
    options,
    answer,
    explanation: item.explanation.trim(),
  };
}

function parseQuizItems(text: string, questionCount: number) {
  const normalized = preprocessQuizText(text);

  try {
    const json = JSON.parse(extractJsonObject(normalized));
    const parsed = quizResponseSchema.safeParse(json);
    const items = parsed.success ? parsed.data.questions : quizItemsFromUnknown(json);
    if (items.length) {
      return items.map(normalizeQuizItem).filter(isUsableQuizItem);
    }
  } catch {
    // Try markdown below.
  }

  return parseMarkdownQuiz(normalized, questionCount)
    .concat(parseAnswerLineQuiz(normalized, questionCount))
    .map(normalizeQuizItem)
    .filter(isUsableQuizItem);
}

function buildSimpleVector(text: string, dimensions = 128): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i += 1) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

export async function createEmbedding(input: string): Promise<number[]> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const key = process.env.GEMINI_API_KEY.trim();
      const modelsToTry = ["text-embedding-004", "embedding-001"];
      for (const model of modelsToTry) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: `models/${model}`,
                content: { parts: [{ text: input }] },
              }),
            }
          );
          if (res.ok) {
            const data = (await res.json()) as { embedding?: { values?: number[] } };
            if (data.embedding?.values?.length) {
              return data.embedding.values;
            }
          }
        } catch {
          // ignore & fallback below
        }
      }
    } catch (err) {
      console.error("[Gemini Embedding Error]:", err);
    }
  }

  if (!process.env.GROQ_API_KEY) {
    try {
      const result = await postOllama<{ embedding?: number[]; embeddings?: number[][] }>(
        "/api/embed",
        {
          model: embedModel(),
          input,
        }
      );
      const embedding = result.embedding ?? result.embeddings?.[0];
      if (embedding?.length) {
        return embedding;
      }
    } catch {
      // Fallback to simple vector below
    }
  }

  return buildSimpleVector(input);
}

async function generateQuizBatch(
  context: string,
  questionCount: number,
  existingQuestions: string[] = []
): Promise<StudyQuizItem[]> {
  const avoidText = existingQuestions.length
    ? `\nDo not repeat: ${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("; ")}`
    : "";

  const tfCount = questionCount === 5 ? 1 : 2;
  const fibCount = questionCount === 5 ? 1 : 2;
  const mcqCount = Math.max(1, questionCount - tfCount - fibCount);

  const markdownPrompt = [
    `Create exactly ${questionCount} quiz questions from the material. Use ONLY facts from the material.`,
    `QUESTION TYPES REQUIRED (Mix of 3 types):`,
    `- ${mcqCount} Standard Multiple-Choice Questions (4 options: A, B, C, D).`,
    `- ${tfCount} True/False Questions (Prefix question with "True or False:", 2 options: A. True, B. False).`,
    `- ${fibCount} Fill-in-the-Blank Questions (Statement containing "___" with 4 options for the missing term).`,
    "",
    "Format each question exactly like this:",
    "",
    "1. [Standard MCQ Question]?",
    "A. Option 1",
    "B. Option 2",
    "C. Option 3",
    "D. Option 4",
    "Answer: A",
    "Explanation: short reason",
    "",
    "2. True or False: [Statement]?",
    "A. True",
    "B. False",
    "Answer: A",
    "Explanation: short reason",
    "",
    "3. [Statement with ___ blank]?",
    "A. Missing term 1",
    "B. Missing term 2",
    "C. Missing term 3",
    "D. Missing term 4",
    "Answer: A",
    "Explanation: short reason",
    avoidText,
    "",
    "Material:",
    context,
  ].join("\n");

  const responseText = await generateText(markdownPrompt, 2500);
  const markdownQuestions = parseQuizItems(responseText, questionCount);
  if (markdownQuestions.length >= 1) {
    return markdownQuestions.slice(0, questionCount);
  }

  throw new Error(
    "The AI model could not generate proper MCQs for this material. Please try again with a different section or text."
  );
}

export async function generateGroundedQuiz(
  context: string,
  questionCount: 5 | 10
): Promise<StudyQuizItem[]> {
  return generateQuizBatch(context, questionCount);
}

export async function answerGroundedDoubt(
  question: string,
  sources: StudySource[]
): Promise<string> {
  const context = sources
    .map((source, index) => {
      const content = source.content.replace(/\s+/g, " ").slice(0, 600);
      return `[${index + 1}] Page ${source.pageNumber}: ${content}`;
    })
    .join("\n\n");

  const prompt = [
    "Answer using ONLY the material below. If not found, say: I could not find this in your PDF.",
    "Be clear, concise, and student-friendly.",
    "Do NOT use LaTeX math formatting, dollar signs ($R$), or raw backslashes. Use plain text (e.g., R, Ohm, Ω, m/s²).",
    "Format: 1 short answer sentence, then 2-3 bullet key points.",
    "",
    "Material:",
    context,
    "",
    `Q: ${question}`,
  ].join("\n");

  return generateText(prompt, 400);
}

export async function formatStudyTextForPdf(
  input: string,
  tag: "english" | "hindi" | "maths" | "summary" | "code" = "english"
): Promise<string> {
  let modeInstructions = "";

  switch (tag) {
    case "hindi":
      modeInstructions = [
        "MODE REQUIREMENT: HINDI TEXT / TRANSLATION & DEVANAGARI ENCODING.",
        "- If the input is in English, translate it into fluent, clear Devanagari Hindi study notes.",
        "- If the input is already in Hindi, preserve 100% of all Hindi words, Devanagari characters, matras, and grammar exactly as written.",
        "- Format headings, questions, and answers in clean Devanagari Hindi."
      ].join("\n");
      break;

    case "maths":
      modeInstructions = [
        "MODE REQUIREMENT: SCIENCE & MATHS FORMULAS.",
        "- Convert all mathematical equations, formulas, fractions, square roots, integrals, and physics/chemistry laws into clean TeX ($...$ or $$...$$) notation.",
        "- Format equations like $V = IR$, $\\frac{a}{b}$, $\\sqrt{x^2 + y^2}$, $\\Omega$, $\\theta$, $\\pi$.",
        "- Preserve all underlying questions, variables, and explanations."
      ].join("\n");
      break;

    case "summary":
      modeInstructions = [
        "MODE REQUIREMENT: HIGH-YIELD EXAM REVISION SUMMARY.",
        "- Read the entire content and generate a structured 4-part High-Yield Chapter Summary & Revision Guide.",
        "- SECTION 1: # [CHAPTER NAME] — HIGH-YIELD REVISION GUIDE",
        "- SECTION 2: ## 1. EXECUTIVE SUMMARY & OVERVIEW (Concise 3-4 sentence core plot/concept summary).",
        "- SECTION 3: ## 2. KEY CONCEPTS & CORE EVENTS (High-yield bullet points of main events, laws, or topics).",
        "- SECTION 4: ## 3. IMPORTANT TERMS, FORMULAS & CHARACTERS (Use a markdown table | Term/Character | Definition/Role | Significance |).",
        "- SECTION 5: ## 4. CRITICAL EXAM TAKEAWAYS (Use callout blockquote boxes '> Note: ...' for key takeaways or formulas to memorize)."
      ].join("\n");
      break;

    case "code":
      modeInstructions = [
        "MODE REQUIREMENT: CODE & TECHNICAL SCRIPT.",
        "- Preserve 100% of all programming code, functions, variables, indentation, and syntax.",
        "- Enclose code blocks in triple backtick code fences (```tsx, ```python, ```js, etc.).",
        "- Format technical terms and props in single backticks."
      ].join("\n");
      break;

    case "english":
    default:
      modeInstructions = [
        "MODE REQUIREMENT: EXACT ENGLISH TEXT (VERBATIM PRESERVATION).",
        "- YOU MUST PRESERVE 100% OF ALL QUESTIONS, ANSWERS, EXPLANATIONS, PARAGRAPHS, AND WORDS EXACTLY AS PROVIDED BY THE USER.",
        "- DO NOT SUMMARIZE. DO NOT SHORTEN. DO NOT PARAPHRASE. DO NOT OMIT ANY SENTENCE OR DETAIL.",
        "- FOR READING PASSAGES (e.g. Passage 1, Passage 2): Prefix ALL paragraphs of the reading passage continuously with '> ' so that the ENTIRE passage (all paragraphs) is enclosed together inside a single unified reading box.",
        "- Keep all multi-paragraph answers 100% complete word-for-word."
      ].join("\n");
      break;
  }

  const prompt = [
    "You are an expert academic study-notes, technical documentation, and PDF layout formatter.",
    "Your job is to transform raw study notes, technical code, Q&A sheets, or textbook content into beautifully structured markdown for a professional PDF publication.",
    "",
    modeInstructions,
    "",
    "GENERAL LAYOUT RULES:",
    "1. TITLE: Create a clear main title on the first line starting with # (e.g. # STUDY DOCUMENT).",
    "2. SECTIONS: Use numbered section headings with ##.",
    "3. SUBSECTIONS & QUESTIONS: Format questions cleanly with bold text (e.g. **Q.1.**) followed by answers.",
    "4. HIGHLIGHT BOXES & PASSAGES: Prefix reading passages or key takeaways with '> ' continuously without empty orphan '>' lines.",
    "5. TABLES: Use standard markdown tables (| Header 1 | Header 2 |) for comparative data.",
    "",
    "Raw text to format:",
    input,
  ].join("\n");

  try {
    const formatted = await generateText(prompt, 16384);
    
    // For summary mode, allow shorter summarized text. For verbatim modes (english/code/hindi), check length safety.
    if (tag === "summary" && formatted && formatted.trim().length > 50) {
      return formatted;
    }

    if (formatted && formatted.trim().length >= input.trim().length * 0.6) {
      return formatted;
    }
  } catch (err) {
    console.error("[formatStudyTextForPdf Error]:", err);
  }

  // Fallback: Preserve exact raw input with title heading
  const firstLine = input.trim().split("\n")[0] || "Study Document";
  const titleHeader = /^#\s+/.test(firstLine) ? "" : `# ${firstLine.replace(/^[#\s]+/, "")}\n\n`;
  return `${titleHeader}${input}`;
}
