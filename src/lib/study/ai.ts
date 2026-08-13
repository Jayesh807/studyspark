import { z } from "zod";
import type { StudyQuizItem, StudySource } from "./types";
import { getStudyTextQuality } from "./chunking";

const quizItemSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
  explanation: z.string().min(5),
  type: z.enum(["single", "numerical", "multiple", "fill_blank", "true_false"]).optional(),
  answers: z.array(z.string().min(1)).optional(),
});

const quizResponseSchema = z.object({
  questions: z.array(quizItemSchema),
});

const AI_REQUEST_TIMEOUT_MS = 20_000;
const SUBJECT_QUESTION_QUALITY_RULES = [
  "- First understand the chapter/concepts, then create questions.",
  "- Generate questions about the subject, not about the PDF/document or whether the student read it.",
  "- Never ask questions like \"Which option best matches the uploaded material?\", \"What does this sentence mean?\", or \"According to the PDF...\".",
  "- Ignore page numbers, headers, footers, chapter-list text, reprint/copyright lines, standalone figure labels, and broken PDF/OCR text.",
  "- Do not copy random source sentences directly into questions or options.",
  "- Every question must test a meaningful concept, fact, formula, experiment, process, relationship, or application from the study material.",
  "- Use exactly 4 options: A, B, C, D.",
  "- Wrong options must be realistic and related to the same concept as the correct answer.",
  "- Use numerical/application questions when the material contains formulas or numerical relationships.",
  "- Keep questions clear, natural, grammatical, and exam-style.",
  "- Think: UNDERSTAND MATERIAL -> SELECT IMPORTANT CONCEPT -> CREATE QUESTION -> CREATE PLAUSIBLE OPTIONS -> VERIFY ANSWER.",
  "- The final quiz should read like it was manually written by an experienced teacher.",
];

interface GenerateTextOptions {
  jsonMode?: boolean;
}

export type StudyQuizErrorCode =
  | "UNREADABLE_CONTEXT"
  | "AI_TIMEOUT"
  | "AI_OUTPUT_NOT_USABLE"
  | "AI_PROVIDER_ERROR";

export class StudyQuizGenerationError extends Error {
  code: StudyQuizErrorCode;

  constructor(code: StudyQuizErrorCode, message: string) {
    super(message);
    this.name = "StudyQuizGenerationError";
    this.code = code;
  }
}

function aiTimeoutSignal() {
  return AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "TimeoutError";
}

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
      signal: aiTimeoutSignal(),
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

async function generateText(
  prompt: string,
  maxTokens: number = 2048,
  options: GenerateTextOptions = {}
): Promise<string> {
  // 1. Try Groq Cloud API if GROQ_API_KEY is configured
  if (process.env.GROQ_API_KEY) {
    const groqModels = process.env.GROQ_MODEL
      ? [process.env.GROQ_MODEL]
      : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"];

    // Cap max_tokens to 4096 for Groq API compatibility
    const groqMaxTokens = Math.min(maxTokens, 4096);
    let lastError = "";

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
            ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
          }),
          signal: aiTimeoutSignal(),
        });
        if (res.ok) {
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const content = data.choices?.[0]?.message?.content;
          if (content) return content.trim();
        } else {
          const errText = await res.text().catch(() => "");
          lastError = errText || `HTTP ${res.status}`;
          console.error(`[Groq API ${res.status} - ${model}]:`, errText);
        }
      } catch (err) {
        if (isAbortError(err)) {
          throw new StudyQuizGenerationError(
            "AI_TIMEOUT",
            "Sparks AI timed out while generating quiz questions. Please try again with 5 questions."
          );
        }
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[Groq API Exception - ${model}]:`, err);
      }
    }

    if (lastError) {
      throw new StudyQuizGenerationError("AI_PROVIDER_ERROR", `Sparks AI Error: ${lastError}`);
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
                  ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
                },
              }),
              signal: aiTimeoutSignal(),
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
          if (isAbortError(err)) {
            throw new StudyQuizGenerationError(
              "AI_TIMEOUT",
              "Sparks AI timed out while generating quiz questions. Please try again with 5 questions."
            );
          }
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    if (isRateLimit) {
      throw new StudyQuizGenerationError(
        "AI_PROVIDER_ERROR",
        "Sparks AI limit reached. Please wait 10 seconds and try again."
      );
    }

    if (lastError) {
      throw new StudyQuizGenerationError("AI_PROVIDER_ERROR", `Sparks AI Error: ${lastError}`);
    }
  }

  if (process.env.NETLIFY || process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new StudyQuizGenerationError(
      "AI_PROVIDER_ERROR",
      "Sparks AI is not configured for live deployment. Please set GROQ_API_KEY or GEMINI_API_KEY."
    );
  }

  // 3. Fallback to local Ollama
  // Updated AI Service: Groq max_tokens capped to 4096 for 100% compatibility
  const result = await postOllama<{ response: string }>("/api/generate", {
    model: chatModel(),
    stream: false,
    ...(options.jsonMode ? { format: "json" } : {}),
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
    const questionMatch = line.match(
      /^(?:[-*]\s*)?(?:\*\*)?(?:(?:question|q)\s*)?(\d+)[\).:-]?\s*(?:\*\*)?\s*(.+)/i
    );
    if (questionMatch) {
      if (current && (current.options.length === 4 || current.options.length === 2) && current.answer) {
        items.push({
          question: current.question,
          options: current.options,
          answer: current.answer,
          explanation: "This answer is supported by the study material.",
        });
      }
      current = {
        question: questionMatch[2].trim(),
        options: [],
        answer: "",
      };
      continue;
    }

    const optionMatch = line.match(
      /^(?:[-*]\s*)?(?:\*\*)?([A-D])[\).:-](?:\*\*)?\s*(.+)/i
    );
    if (optionMatch && current) {
      const rawOption = optionMatch[2].trim();
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
    const answerLineMatch = line.match(
      /^(?:[-*]\s*)?(?:answer|correct answer)\s*[:.]\s*(.+)/i
    );
    if (answerLineMatch && current) {
      const answerValue = answerLineMatch[1].trim();
      const answerLetters = answerValue.match(/[A-D]/gi) ?? [];
      const letterMatch = answerValue.match(/^([A-D])\b/i);
      if (answerLetters.length > 1) {
        current.answer = answerValue;
      } else if (letterMatch && (current.options.length === 4 || current.options.length === 2)) {
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
      explanation: "This answer is supported by the study material.",
    });
  }

  return items.slice(0, questionCount);
}

function parseAnswerLineQuiz(text: string, questionCount: number): StudyQuizItem[] {
  const blocks = text
    .split(/(?=^\s*(?:[-*]\s*)?(?:\*\*)?(?:(?:question|q)\s*)?\d+[\).:-]?\s*)/im)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.flatMap((block) => {
    const question = block
      .match(/^\s*(?:[-*]\s*)?(?:\*\*)?(?:(?:question|q)\s*)?\d+[\).:-]?\s*(?:\*\*)?\s*(.+)/im)?.[1]
      ?.trim();
    const options = [...block.matchAll(/^\s*(?:[-*]\s*)?(?:\*\*)?([A-D])[\).:-](?:\*\*)?\s*(.+)$/gim)].map(
      (match) => cleanOption(match[2])
    );
    const answerText = block
      .match(/^\s*(?:[-*]\s*)?(?:answer|correct answer)\s*:\s*(.+)$/im)?.[1]
      ?.trim();
    const explanation =
      block.match(/^\s*explanation\s*:\s*(.+)$/im)?.[1]?.trim() ??
      "This answer is supported by the study material.";

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
  const placeholderQuestion =
    /\b(?:standard concept|multiple-choice question|fill-in-the-blank formula|subject concept question|statement with ___ blank|option 1|option 2)\b/i;
  const metaQuestion =
    /\b(?:primary purpose of the pdf|document about|author of the pdf|formatting is used|pdf document|uploaded material|uploaded pdf|according to (?:the )?pdf|according to (?:the )?document|which option best matches|what does this sentence mean|this sentence|page number|header|footer|chapter-list|chapter list|reprint|figure label|broken pdf|broken ocr|font descriptor|mediabox|xobject|flatedecode|cidtogidmap)\b/i;

  if (placeholderQuestion.test(item.question) || metaQuestion.test(item.question)) {
    return false;
  }

  const options = item.options.map((option) => option.trim()).filter(Boolean);
  const answerKey = quizTextKey(item.answer);
  const optionKeys = options.map(quizTextKey);
  const hasDuplicateOptions =
    new Set(optionKeys).size !== optionKeys.length ||
    options.some((option, index) =>
      options.some(
        (otherOption, otherIndex) =>
          otherIndex > index && areOptionTextsEquivalent(option, otherOption)
      )
    );

  if (hasDuplicateOptions || options.some(isWeakQuizOption)) {
    return false;
  }

  const isTrueFalse =
    /true or false|state whether true or false/i.test(item.question) ||
    (options.length === 2 &&
      optionKeys.includes("true") &&
      optionKeys.includes("false"));

  if (isTrueFalse) {
    return (
      item.question.length >= 8 &&
      options.length === 2 &&
      optionKeys.some((optionKey) => optionKey === answerKey || answerKey.startsWith(optionKey))
    );
  }

  const answerMatchesOption = optionKeys.some((optionKey) => optionKey === answerKey);
  const answerKeys = item.answers?.map(quizTextKey).filter(Boolean) ?? [];
  const uniqueAnswerKeys = Array.from(new Set(answerKeys));
  const allAnswersMatchOptions = uniqueAnswerKeys.every((answer) =>
    optionKeys.some((optionKey) => optionKey === answer)
  );

  if (item.type === "multiple") {
    return (
      item.question.length >= 10 &&
      options.length === 4 &&
      uniqueAnswerKeys.length >= 2 &&
      allAnswersMatchOptions
    );
  }

  return (
    item.question.length >= 10 &&
    options.length === 4 &&
    answerMatchesOption &&
    allAnswersMatchOptions
  );
}

function isUsableStandardMcqItem(item: StudyQuizItem) {
  return isUsableQuizItem(item) && item.type === "single" && !item.question.includes("___");
}

function quizTextKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\b(?:a|an|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function areOptionTextsEquivalent(first: string, second: string) {
  const firstKey = quizTextKey(first);
  const secondKey = quizTextKey(second);
  if (!firstKey || !secondKey) return false;
  if (firstKey === secondKey) return true;

  const shorter = firstKey.length <= secondKey.length ? firstKey : secondKey;
  const longer = firstKey.length > secondKey.length ? firstKey : secondKey;
  return shorter.length >= 12 && longer.includes(shorter);
}

function isWeakQuizOption(option: string) {
  return /\b(?:all of the above|none of the above|both a and b|both b and c|option [1-4]|choice [a-d]|not mentioned in the pdf|cannot be determined from the pdf)\b/i.test(
    option
  );
}

function cleanOption(value: string) {
  return value
    .trim()
    .replace(/^(?:[-*]\s*)?(?:\*\*)?[A-D][\).:-](?:\*\*)?\s*/i, "")
    .replace(/[\u2705\u2714]/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s*\(correct\)\s*/i, "")
    .trim();
}

function optionTextFromUnknown(option: unknown) {
  if (typeof option === "string") return option;
  if (!option || typeof option !== "object") return "";

  const optionObject = option as Record<string, unknown>;
  const text =
    optionObject.text ??
    optionObject.label ??
    optionObject.value ??
    optionObject.answer ??
    optionObject.name;

  return typeof text === "string" ? text : "";
}

function normalizeQuestionType(type: unknown): StudyQuizItem["type"] | undefined {
  if (typeof type !== "string") return undefined;

  const normalized = type.toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "single" || normalized === "single_correct" || normalized === "mcq") {
    return "single";
  }
  if (normalized === "numerical" || normalized === "application" || normalized === "numerical_mcq") {
    return "numerical";
  }
  if (normalized === "multiple" || normalized === "multiple_correct") {
    return "multiple";
  }
  if (normalized === "fill_blank" || normalized === "fill_in_the_blank" || normalized === "completion") {
    return "fill_blank";
  }
  if (normalized === "true_false" || normalized === "truefalse") {
    return "true_false";
  }

  return undefined;
}

function extractAnswerLetters(value: string) {
  const cleaned = value
    .trim()
    .replace(/\band\b/gi, ",")
    .replace(/\s+/g, " ");

  if (/^[A-D](?:\s*[,/]\s*[A-D])*\s*$/i.test(cleaned)) {
    return cleaned.match(/[A-D]/gi)?.map((letter) => letter.toUpperCase()) ?? [];
  }

  const leadingLetter = cleaned.match(/^([A-D])(?:[\).:-]|\s*$)/i)?.[1];
  return leadingLetter ? [leadingLetter.toUpperCase()] : [];
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
    const rawAnswers =
      item.answers ??
      item.correctAnswers ??
      item.correct_answers ??
      item.correctOptions ??
      item.correct_options;
    const answer =
      item.answer ??
      item.correctAnswer ??
      item.correct_answer ??
      item.correctOption ??
      item.correct_option ??
      item.correct ??
      (Array.isArray(rawAnswers) ? rawAnswers[0] : undefined);
    const explanation = item.explanation ?? item.reason ?? item.why;
    const rawOptions = item.options ?? item.choices;
    const type = item.type ?? item.questionType ?? item.question_type;
    const options = Array.isArray(rawOptions)
      ? rawOptions
      : rawOptions && typeof rawOptions === "object"
        ? Object.values(rawOptions)
        : [];
    const normalizedType = normalizeQuestionType(type);

    if (typeof question !== "string" || typeof answer !== "string") {
      return [];
    }

    return [
      {
        question,
        options: options.map(optionTextFromUnknown),
        answer,
        type: normalizedType,
        answers: Array.isArray(rawAnswers)
          ? rawAnswers.map((answer) => String(answer))
          : undefined,
        explanation:
          typeof explanation === "string" && explanation.trim()
            ? explanation
            : "This answer is supported by the study material.",
      },
    ];
  });
}

function normalizeQuizItem(item: StudyQuizItem): StudyQuizItem {
  const options = item.options.map(cleanOption).filter(Boolean);
  const rawAnswer = cleanOption(item.answer);
  const answerLetters = extractAnswerLetters(item.answer);
  const answerLetter = answerLetters[0];
  const answerByLetter = answerLetter ? options[answerLetter.charCodeAt(0) - 65] : undefined;
  const rawAnswers = item.answers?.length ? item.answers : answerLetters.length > 1 ? answerLetters : [item.answer];
  const answers = rawAnswers
    .map((value) => {
      const cleaned = cleanOption(value);
      const letter = extractAnswerLetters(cleaned)[0];
      const byLetter = letter ? options[letter.charCodeAt(0) - 65] : undefined;
      return (
        byLetter ??
        options.find((option) => option.toLowerCase() === cleaned.toLowerCase()) ??
        options.find((option) => cleaned.toLowerCase().includes(option.toLowerCase())) ??
        cleaned
      );
    })
    .filter(Boolean);
  const answer =
    answerByLetter ??
    options.find((option) => option.toLowerCase() === rawAnswer.toLowerCase()) ??
    options.find((option) => rawAnswer.toLowerCase().includes(option.toLowerCase())) ??
    rawAnswer;

  const question = item.question
    .trim()
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .replace(/^\d+[\).]\s*/, "")
    .replace(/^(?:question|q)\s*\d*[:.?]*\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedItem: StudyQuizItem = {
    question: /[?.!]$/.test(question) ? question : `${question}?`,
    options,
    answer,
    explanation: item.explanation.trim(),
  };

  // Auto-detect question type if not explicitly set by LLM
  let questionType = item.type;
  if (!questionType) {
    if (
      /^true or false[:\s]/i.test(question) ||
      (options.length === 2 &&
        options.some((o) => /^true$/i.test(o)) &&
        options.some((o) => /^false$/i.test(o)))
    ) {
      questionType = "true_false";
    } else if (question.includes("___")) {
      questionType = "fill_blank";
    } else {
      questionType = "single";
    }
  }

  normalizedItem.type = questionType;

  if ((questionType === "multiple" || answerLetters.length > 1) && answers.length > 0) {
    normalizedItem.answers = Array.from(new Set(answers));
  }

  return normalizedItem;
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

function dedupeQuizItems(items: StudyQuizItem[]) {
  const seenQuestions = new Set<string>();
  return items.filter((item) => {
    const questionKey = quizTextKey(item.question);
    if (!questionKey || seenQuestions.has(questionKey)) return false;
    seenQuestions.add(questionKey);
    return true;
  });
}

function mergeUniqueQuizItems(
  existingItems: StudyQuizItem[],
  newItems: StudyQuizItem[],
  limit: number
) {
  return dedupeQuizItems(existingItems.concat(newItems).filter(isUsableQuizItem)).slice(0, limit);
}

function cleanSentence(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z0-9]+/, "")
    .trim();
}

function splitLongStudyText(value: string) {
  const words = cleanSentence(value).split(/\s+/).filter(Boolean);
  const statements: string[] = [];
  const windowSize = 32;
  const overlap = 8;

  for (let start = 0; start < words.length; start += windowSize - overlap) {
    const statement = words.slice(start, start + windowSize).join(" ");
    if (statement.length >= 45) statements.push(statement);
    if (start + windowSize >= words.length) break;
  }

  return statements;
}

function extractFallbackSentences(context: string) {
  const seen = new Set<string>();
  const normalizedContext = context
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const rawSegments = normalizedContext
    .split(/(?<=[.!?])\s+|;\s+|\s{2,}/)
    .flatMap((segment) => {
      const cleaned = cleanSentence(segment);
      if (cleaned.length > 260) return splitLongStudyText(cleaned);
      return [cleaned];
    });

  if (rawSegments.length < 8) {
    rawSegments.push(...splitLongStudyText(normalizedContext));
  }

  return rawSegments
    .filter((statement) => {
      if (statement.length < 45 || statement.length > 320) return false;
      if (!getStudyTextQuality(statement).looksUseful) return false;
      const key = statement.toLowerCase().replace(/\W+/g, " ").slice(0, 90);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

function buildFallbackQuiz(context: string, questionCount: number): StudyQuizItem[] {
  const sentences = extractFallbackSentences(context);
  if (sentences.length === 0) return [];
  const concepts = sentences.map(extractFallbackConcept);

  return sentences
    .map((statement, index) => typedFallbackQuestion(statement, "single", index, concepts))
    .filter(isUsableQuizItem)
    .slice(0, questionCount);
}

function questionTypeMix(questionCount: number) {
  return { mcqCount: questionCount, tfCount: 0, fibCount: 0 };
}

function premiumQuestionTypeMix(questionCount: 25 | 30) {
  return questionCount === 25
    ? { single: 5, numerical: 5, multiple: 5, fill_blank: 5, true_false: 5 }
    : { single: 5, numerical: 10, multiple: 5, fill_blank: 5, true_false: 5 };
}

type PremiumBatchType = NonNullable<StudyQuizItem["type"]>;

interface PremiumQuestionBatch {
  type: PremiumBatchType;
  jsonType: "single_correct" | "numerical" | "multiple_correct" | "fill_blank" | "true_false";
  count: number;
  startId: number;
}

function premiumQuestionBatches(questionCount: 25 | 30): PremiumQuestionBatch[] {
  const mix = premiumQuestionTypeMix(questionCount);
  const batches: PremiumQuestionBatch[] = [];
  let startId = 1;

  const addBatch = (
    type: PremiumBatchType,
    jsonType: PremiumQuestionBatch["jsonType"],
    count: number
  ) => {
    batches.push({ type, jsonType, count, startId });
    startId += count;
  };

  addBatch("single", "single_correct", mix.single);

  for (let remaining = mix.numerical; remaining > 0; remaining -= 5) {
    addBatch("numerical", "numerical", Math.min(5, remaining));
  }

  addBatch("multiple", "multiple_correct", mix.multiple);
  addBatch("fill_blank", "fill_blank", mix.fill_blank);
  addBatch("true_false", "true_false", mix.true_false);

  return batches;
}

function premiumBatchInstructions(batch: PremiumQuestionBatch) {
  if (batch.type === "single") {
    return "Create single-correct conceptual MCQs. Prefer application, comparison, cause-effect, reasoning, interpretation, and misconception-based stems. Avoid trivial sentence-copy questions.";
  }
  if (batch.type === "numerical") {
    return "Create JEE Main / NEET style numerical or advanced application MCQs. Use calculations only when the material contains enough mathematical information. If formulas are insufficient, create advanced application-based MCQs from taught concepts. Never invent formulas merely to force a numerical question.";
  }
  if (batch.type === "multiple") {
    return "Create multiple-correct questions. Each question must have 2 or more correct options. Each option must independently test understanding, and correctness must not depend on vague interpretation.";
  }
  if (batch.type === "fill_blank") {
    return "Create fill-in-the-blank completion questions. Each stem must contain one ___ blank and test terminology, formula components, relationships, process steps, important values, or conceptual completion.";
  }
  return "Create true/false style concept questions. Each statement must test subject knowledge, not PDF-reading or document metadata.";
}

function buildPremiumBatchPrompt(
  context: string,
  questionCount: 25 | 30,
  batch: PremiumQuestionBatch,
  existingQuestions: string[]
) {
  const endId = batch.startId + batch.count - 1;
  const avoidText = existingQuestions.length
    ? `\nDo not repeat or lightly reword these existing questions:\n${existingQuestions
      .map((question, index) => `${index + 1}. ${question}`)
      .join("\n")}`
    : "";

  return [
    "ROLE:",
    "You are an expert JEE Main / NEET / competitive-exam question paper setter.",
    "",
    `Generate exactly ${batch.count} questions for one section of a ${questionCount}-question premium exam.`,
    `Question IDs must run from ${batch.startId} to ${endId}.`,
    `Every question in this response must use type "${batch.jsonType}".`,
    "",
    "ABSOLUTE SOURCE RULE:",
    "- Read and use the complete available study material below before writing questions.",
    "- Every question must be directly derived from concepts, facts, formulas, definitions, diagrams, examples, relationships, applications, or reasoning contained in the material.",
    "- Do not use unrelated external knowledge unless needed to apply a concept explicitly taught in the material.",
    "- Questions must test the subject itself, not whether the student read the PDF.",
    "- Never create generic filler stems or meaningless options.",
    ...SUBJECT_QUESTION_QUALITY_RULES,
    "",
    "SECTION REQUIREMENT:",
    premiumBatchInstructions(batch),
    "",
    "QUALITY REQUIREMENTS:",
    "- Each question must test a meaningful concept and have a clear, non-leading stem.",
    "- Give every question a different concept focus; do not reuse the same fact with different wording.",
    "- Distractors must be plausible and tied to the same concept.",
    "- All options inside a question must be unique after ignoring case, punctuation, and articles like a/an/the.",
    "- No duplicate option text, empty option text, corrupted symbols, unsupported answers, all-of-the-above, none-of-the-above, or option-label filler.",
    "- No option may simply be '0' unless zero is a legitimate calculated answer.",
    "- The correct answer must match the explanation.",
    "- Do not repeat the same fact across questions.",
    "- Use a difficulty mix across the whole paper: easy, medium, and hard. Prefer medium unless the concept deserves easy or hard.",
    "",
    "STRICT OPTION RULES:",
    batch.type === "true_false"
      ? "- Each question must have exactly 2 options: A = True, B = False. correctAnswers must contain exactly one of A or B."
      : "- Each question must have exactly 4 options with IDs A, B, C, D.",
    batch.type === "multiple"
      ? "- correctAnswers must contain at least 2 valid option IDs."
      : batch.type !== "true_false"
        ? "- correctAnswers must contain exactly 1 valid option ID."
        : "",
    "",
    "OUTPUT FORMAT:",
    "Return ONLY valid JSON. No markdown. No commentary. No text before or after JSON.",
    "{ \"examTitle\": \"string\", \"subject\": \"string\", \"chapter\": \"string\", \"questions\": [ { \"id\": 1, \"type\": \"single_correct|numerical|multiple_correct|fill_blank|true_false\", \"difficulty\": \"easy|medium|hard\", \"topic\": \"string\", \"question\": \"Question text\", \"options\": [ { \"id\": \"A\", \"text\": \"Option A\" }, { \"id\": \"B\", \"text\": \"Option B\" }, { \"id\": \"C\", \"text\": \"Option C\" }, { \"id\": \"D\", \"text\": \"Option D\" } ], \"correctAnswers\": [\"A\"], \"explanation\": \"Clear explanation based on the study material.\" } ] }",
    avoidText,
    "",
    "UPLOADED STUDY MATERIAL:",
    context,
  ].join("\n");
}

async function generatePremiumQuizBatch(
  context: string,
  questionCount: 25 | 30,
  batch: PremiumQuestionBatch,
  existingQuestions: string[]
) {
  const prompt = buildPremiumBatchPrompt(context, questionCount, batch, existingQuestions);
  const responseText = await generateText(
    prompt,
    batch.type === "numerical" ? 4000 : 3200,
    { jsonMode: true }
  );
  const parsedItems = parseQuizItems(responseText, batch.count);
  const usableItems = dedupeQuizItems(parsedItems)
    .map((item) => normalizeQuizItem({ ...item, type: batch.type }))
    .filter(isUsableQuizItem)
    .filter((item) => item.type === batch.type)
    .slice(0, batch.count);

  if (usableItems.length < batch.count) {
    console.warn("[Study Premium Quiz]: AI batch returned too few usable questions", {
      requested: batch.count,
      usable: usableItems.length,
      parsed: parsedItems.length,
      type: batch.type,
      responseChars: responseText.length,
    });
  }

  return usableItems;
}

interface FallbackConcept {
  subject: string;
  detail: string;
  statement: string;
}

function titleCaseTerm(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)([a-z])/g, (_match, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function conciseDetail(value: string) {
  return cleanSentence(value)
    .replace(/[?.!]+$/, "")
    .replace(/\s+/g, " ")
    .slice(0, 180);
}

function extractFallbackConcept(statement: string, index: number): FallbackConcept {
  const cleaned = conciseDetail(statement);
  const unitMatch = cleaned.match(/(?:si\s+unit|unit)\s+of\s+(.+?)\s+(?:is|=)\s+(.+)/i);
  if (unitMatch) {
    return {
      subject: titleCaseTerm(unitMatch[1]),
      detail: conciseDetail(unitMatch[2]),
      statement: cleaned,
    };
  }

  const statesMatch = cleaned.match(/^(.{3,80}?)\s+states\s+that\s+(.+)/i);
  if (statesMatch) {
    return {
      subject: titleCaseTerm(statesMatch[1]),
      detail: conciseDetail(statesMatch[2]),
      statement: cleaned,
    };
  }

  const definitionMatch = cleaned.match(/^(.{3,80}?)\s+(?:is|are|means|refers to|is called|are called)\s+(.+)/i);
  if (definitionMatch) {
    return {
      subject: titleCaseTerm(definitionMatch[1]),
      detail: conciseDetail(definitionMatch[2]),
      statement: cleaned,
    };
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  return {
    subject: words.slice(0, Math.min(5, words.length)).join(" ") || `Concept ${index + 1}`,
    detail: cleaned,
    statement: cleaned,
  };
}

function fallbackDistractors(
  concepts: FallbackConcept[],
  current: FallbackConcept,
  index: number
) {
  const otherConcepts = concepts.filter(
    (concept) => concept !== current && concept.detail && concept.detail.length >= 15
  );

  const poolSize = otherConcepts.length;
  if (poolSize === 0) return [];

  const offset = (index * 3) % poolSize;
  const picked: string[] = [];

  for (let i = 0; i < poolSize && picked.length < 3; i++) {
    const candidate = otherConcepts[(offset + i) % poolSize];
    if (
      candidate.detail &&
      !picked.includes(candidate.detail) &&
      candidate.detail.toLowerCase() !== current.detail.toLowerCase()
    ) {
      picked.push(candidate.detail);
    }
  }

  return picked;
}

function makeOptions(answer: string, distractors: string[], index: number) {
  const uniqueDistractors = Array.from(
    new Set(distractors.filter((option) => option && option.toLowerCase() !== answer.toLowerCase()))
  );
  const options = [answer, ...uniqueDistractors].slice(0, 4);

  const answerIndex = index % 4;
  const reordered = options.slice(0, 4);
  const [correct] = reordered.splice(0, 1);
  reordered.splice(answerIndex, 0, correct);
  return reordered;
}

function fallbackQuestionStem(type: NonNullable<StudyQuizItem["type"]>, subject: string, index: number) {
  const variants: Record<NonNullable<StudyQuizItem["type"]>, string[]> = {
    single: [
      `Which statement correctly describes ${subject}?`,
      `Which explanation is most accurate for ${subject}?`,
      `Which statement shows the correct understanding of ${subject}?`,
    ],
    numerical: [
      `Which option correctly applies or interprets ${subject}?`,
      `Which conclusion follows from ${subject}?`,
      `Which option is consistent with the relationship in ${subject}?`,
    ],
    multiple: [
      `Which statements correctly describe ${subject}?`,
      `Which options are consistent with ${subject}?`,
      `Which statements follow from ${subject}?`,
    ],
    fill_blank: [
      `${subject} is/means ___.`,
      `The correct completion for ${subject} is ___.`,
      `In this chapter, ${subject} is completed by ___.`,
    ],
    true_false: [
      `True or False: `,
      `State whether true or false: `,
      `Decide whether the statement is true or false: `,
    ],
  };

  const choices = variants[type];
  return choices[index % choices.length];
}

function typedFallbackQuestion(
  statement: string,
  type: NonNullable<StudyQuizItem["type"]> = "single",
  index = 0,
  concepts: FallbackConcept[] = []
): StudyQuizItem {
  const concept = extractFallbackConcept(statement, index);
  const distractors = fallbackDistractors(concepts, concept, index);
  const options = makeOptions(concept.detail, distractors, index);
  const subject = concept.subject || `concept ${index + 1}`;

  return {
    type: "single",
    question: fallbackQuestionStem("single", subject, index),
    options,
    answer: concept.detail,
    explanation: `The answer follows from the source concept: ${concept.statement}.`,
  };
}

function buildPremiumFallbackQuiz(
  context: string,
  questionCount: 25 | 30
): StudyQuizItem[] {
  const sentences = extractFallbackSentences(context);
  const fallbackStatement =
    cleanSentence(context).slice(0, 220) ||
    "The uploaded chapter contains readable study material for practice";
  const sourceStatements = sentences.length ? sentences : [fallbackStatement];
  const concepts = sourceStatements.map(extractFallbackConcept);
  const mix = premiumQuestionTypeMix(questionCount);
  const questions: StudyQuizItem[] = [];

  const quotas: Array<[NonNullable<StudyQuizItem["type"]>, number]> = [
    ["single", mix.single],
    ["numerical", mix.numerical],
    ["multiple", mix.multiple],
    ["fill_blank", mix.fill_blank],
    ["true_false", mix.true_false],
  ];

  for (const [type, quota] of quotas) {
    let typeQuestions: StudyQuizItem[] = [];
    let variantOffset = 0;

    while (typeQuestions.length < quota && variantOffset < questionCount * 6) {
      const index = questions.length + typeQuestions.length + variantOffset;
      const statement = sourceStatements[(index + variantOffset) % sourceStatements.length];
      const nextQuestion = typedFallbackQuestion(statement, type, index, concepts);
      typeQuestions = mergeUniqueQuizItems(typeQuestions, [nextQuestion], quota);
      variantOffset += 1;
    }

    questions.push(...typeQuestions);
  }

  return questions.slice(0, questionCount);
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
  const contextQuality = getStudyTextQuality(context);
  if (!contextQuality.looksUseful) {
    console.warn("[Study Quiz]: Unusable quiz context", {
      questionCount,
      contextChars: contextQuality.charCount,
      contextWords: contextQuality.wordCount,
      pdfInternalTokenRatio: contextQuality.pdfInternalTokenRatio,
      suspiciousTokenRatio: contextQuality.suspiciousTokenRatio,
    });
    throw new StudyQuizGenerationError(
      "UNREADABLE_CONTEXT",
      "The uploaded PDF did not contain enough readable study text for quiz generation. Please upload a text-selectable PDF or run OCR on scanned/image-based notes first."
    );
  }

  const avoidText = existingQuestions.length
    ? `\nDo not repeat: ${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("; ")}`
    : "";

  const jsonPrompt = [
    `You are an expert exam question generator for high school and university students.`,
    `Create exactly ${questionCount} high-quality Single-Correct Multiple-Choice Questions (MCQs) based ONLY on the core concepts, laws, definitions, and equations in the material below.`,
    `STRICT RULES:`,
    `- EVERY SINGLE question MUST be a Single-Correct MCQ with EXACTLY 4 distinct, complete, unique options (A, B, C, D).`,
    `- DO NOT generate True/False questions. DO NOT generate fill-in-the-blank questions.`,
    `- DO NOT ask meta-questions like "What is the primary purpose of the PDF document?", "What is the document about?", "Who is the author?", or "What formatting is used?".`,
    `- Ask ONLY deep, subject-matter questions testing actual scientific/academic concepts in the text (e.g. "What is centripetal acceleration?", "What is the formula for maximum height in projectile motion?").`,
    ...SUBJECT_QUESTION_QUALITY_RULES,
    `- Each question must cover a different concept, formula, definition, relationship, or application from the material.`,
    `- Avoid shallow sentence-copy questions; prefer application, comparison, cause-effect, misconception, formula-meaning, and reasoning questions.`,
    `- Ensure all 4 options (A, B, C, D) are completely unique after ignoring case, punctuation, and articles like a/an/the.`,
    `- Distractors must be realistic, relevant to the same concept, and must not use all-of-the-above, none-of-the-above, option labels, or unsupported filler.`,
    `- The answer must exactly match one option string, and the explanation must justify why that option is correct from the material.`,
    `- Before final JSON, silently verify that there are no repeated questions, no duplicate options, and no vague PDF/document metadata questions.`,
    avoidText,
    "",
    "OUTPUT FORMAT (STRICT JSON ONLY):",
    `{`,
    `  "questions": [`,
    `    {`,
    `      "question": "What is the primary function of...?",`,
    `      "options": ["First concept option text", "Second concept option text", "Third concept option text", "Fourth concept option text"],`,
    `      "answer": "First concept option text",`,
    `      "explanation": "Clear, detailed academic explanation derived from course material.",`,
    `      "type": "single",`,
    `      "category": "Concept Name"`,
    `    }`,
    `  ]`,
    `}`,
    "",
    "Course Material:",
    context,
  ].join("\n");

  const responseText = await generateText(jsonPrompt, 4000, { jsonMode: true });
  try {
    const jsonParsed = JSON.parse(responseText);
    const parsedItems = quizItemsFromUnknown(jsonParsed);
    const normalized = parsedItems.map(normalizeQuizItem).filter(isUsableStandardMcqItem);
    if (normalized.length > 0) {
      return mergeUniqueQuizItems([], normalized, questionCount);
    }
  } catch {
    // fallback to markdown parser if JSON fails
  }

  return dedupeQuizItems(parseQuizItems(responseText, questionCount).filter(isUsableStandardMcqItem)).slice(0, questionCount);
}

export async function generateGroundedQuiz(
  context: string,
  questionCount: 5 | 10
): Promise<StudyQuizItem[]> {
  let questions: StudyQuizItem[] = [];
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts && questions.length < questionCount; attempt += 1) {
    const remaining = questionCount - questions.length;
    const batchSize = attempt === 0 ? questionCount : Math.max(remaining, 3);
    try {
      const batch = await generateQuizBatch(
        context,
        batchSize,
        questions.map((item) => item.question)
      );
      questions = mergeUniqueQuizItems(questions, batch, questionCount);
    } catch (error) {
      if (
        error instanceof StudyQuizGenerationError &&
        error.code === "UNREADABLE_CONTEXT"
      ) {
        throw error;
      }
      console.warn("[Study Quiz]: AI quiz batch failed, using PDF fallback if needed", {
        attempt: attempt + 1,
        requested: questionCount,
        generated: questions.length,
        error: error instanceof Error ? error.message : String(error),
      });
      break;
    }
  }

  if (questions.length >= questionCount) {
    return questions.slice(0, questionCount);
  }

  const fallbackQuestions = buildFallbackQuiz(context, questionCount - questions.length);
  questions = mergeUniqueQuizItems(questions, fallbackQuestions, questionCount);

  if (questions.length >= questionCount) {
    return questions.slice(0, questionCount);
  }

  console.warn("[Study Quiz]: Not enough usable questions generated", {
    requested: questionCount,
    generated: questions.length,
    contextChars: getStudyTextQuality(context).charCount,
  });

  throw new StudyQuizGenerationError(
    "AI_OUTPUT_NOT_USABLE",
    questionCount === 10
      ? `Sparks AI generated ${questions.length || "no"} usable PDF-grounded questions, but 10 were requested. Please try 5 questions or upload a PDF with clearer study text.`
      : `Sparks AI generated ${questions.length || "no"} usable PDF-grounded questions. Please upload a PDF with clearer study text or try again.`
  );
}

export async function generatePremiumGroundedQuiz(
  context: string,
  questionCount: 25 | 30
): Promise<StudyQuizItem[]> {
  const contextQuality = getStudyTextQuality(context);
  if (!contextQuality.looksUseful) {
    throw new StudyQuizGenerationError(
      "UNREADABLE_CONTEXT",
      "The uploaded PDF did not contain enough readable study text for premium quiz generation."
    );
  }

  const questions: StudyQuizItem[] = [];
  let lastError: unknown;
  try {
    for (const batch of premiumQuestionBatches(questionCount)) {
      let batchQuestions: StudyQuizItem[] = [];

      for (let attempt = 0; attempt < 2 && batchQuestions.length < batch.count; attempt += 1) {
        const remainingBatch = {
          ...batch,
          count: batch.count - batchQuestions.length,
          startId: batch.startId + batchQuestions.length,
        };
        const generated = await generatePremiumQuizBatch(
          context,
          questionCount,
          remainingBatch,
          questions.concat(batchQuestions).map((item) => item.question)
        );
        batchQuestions = mergeUniqueQuizItems(batchQuestions, generated, batch.count);
      }

      if (batchQuestions.length < batch.count) {
        lastError = new Error(
          `Only ${batchQuestions.length} usable ${batch.type} questions were generated.`
        );
        break;
      }

      questions.push(...batchQuestions);
    }
  } catch (error) {
    if (
      error instanceof StudyQuizGenerationError &&
      error.code === "UNREADABLE_CONTEXT"
    ) {
      throw error;
    }
    lastError = error;
    console.warn("[Study Premium Quiz]: AI failed batched premium generation", {
      requested: questionCount,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const uniqueQuestions = dedupeQuizItems(questions).slice(0, questionCount);

  if (uniqueQuestions.length >= questionCount) {
    return uniqueQuestions;
  }

  console.warn("[Study Premium Quiz]: Batched generation did not produce a complete exam", {
    requested: questionCount,
    generated: uniqueQuestions.length,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw new StudyQuizGenerationError(
    "AI_OUTPUT_NOT_USABLE",
    `Sparks AI generated ${uniqueQuestions.length || "no"} usable premium questions, but ${questionCount} were requested. Please try again.`
  );
}

export async function answerGroundedDoubt(
  question: string,
  sources: StudySource[]
): Promise<string> {
  const context = sources
    .map((source, index) => {
      const content = source.content.replace(/\s+/g, " ").slice(0, 1500);
      return `[Source Page ${source.pageNumber}]:\n${content}`;
    })
    .join("\n\n");

  const prompt = [
    "You are Sparks AI, an intelligent, encouraging AI study assistant for students.",
    "Use the course material provided below as the main reference to answer the student's question thoroughly.",
    "SMART INSTRUCTIONS:",
    "- Smartly correct typos in student questions (e.g., 'motion in plain' -> 'Motion in a Plane', 'formla' -> 'formula').",
    "- If the student asks for a summary, main points, formulas, or key concepts, synthesize a clear, comprehensive breakdown from the material.",
    "- Explain concepts clearly step-by-step with bold technical terms.",
    "- Do NOT output generic refusal lines like 'I could not find this in your PDF' unless the material is completely empty.",
    "- Do NOT use LaTeX math code ($R$) or raw backslashes. Use plain readable text (e.g., R, g = 9.8 m/s², v²/r).",
    "",
    "Course Material:",
    context || "General course study material",
    "",
    `Student Question: ${question}`,
  ].join("\n");

  return generateText(prompt, 600);
}

export async function formatStudyTextForPdf(
  input: string,
  tag: "english" | "hindi" | "maths" | "summary" | "code" = "english"
): Promise<string> {
  let modeInstructions = "";

  switch (tag) {
    case "hindi":
      modeInstructions = [
        "MODE REQUIREMENT: COMPLETE HINDI TEXT / TRANSLATION & DEVANAGARI ENCODING.",
        "- Translate the COMPLETE input into fluent, clear Devanagari Hindi study notes.",
        "- Do not leave English paragraphs, English headings, or English explanations untranslated.",
        "- Preserve meaning, order, examples, questions, answers, numbers, formulas, and named entities.",
        "- Technical names may stay in English only when there is no natural Hindi equivalent.",
        "- If the input is already in Hindi, preserve 100% of all Hindi words, Devanagari characters, matras, and grammar exactly as written.",
        "- Format headings, questions, and answers in clean Devanagari Hindi.",
        "- The first line must be a Hindi title starting with #."
      ].join("\n");
      break;

    case "maths":
      modeInstructions = [
        "MODE REQUIREMENT: SCIENCE & MATHS FORMULAS.",
        "- Convert all mathematical equations, formulas, fractions, square roots, integrals, and physics/chemistry laws into clean TeX notation.",
        "- ALWAYS use $...$ for inline math and $$...$$ for display math (block equations on their own line).",
        "- NEVER use \\[...\\] or \\(...\\) delimiters — ONLY use dollar-sign notation.",
        "- Format equations like $V = IR$, $\\frac{a}{b}$, $\\sqrt{x^2 + y^2}$, $\\Omega$, $\\theta$, $\\pi$.",
        "- For block-level equations use $$...$$ on its own line, e.g.:\n$$I = \\frac{Q}{t}$$",
        "- Preserve all underlying questions, variables, and explanations."
      ].join("\n");
      break;

    case "summary":
      modeInstructions = [
        "MODE REQUIREMENT: HIGH-YIELD PDF SUMMARY & EXAM REVISION GUIDE.",
        "PRIMARY GOAL:",
        "- Read and understand the COMPLETE uploaded PDF before generating the summary.",
        "- Extract only information that is actually present in the PDF.",
        "- Do NOT invent facts, formulas, examples, characters, dates, definitions, or conclusions.",
        "- Prioritize important, exam-relevant information over minor details.",
        "- Keep the language clear, concise, structured, and easy to revise quickly.",

        "CONTENT ADAPTATION:",
        "- Automatically identify the type of PDF: literature/chapter, science, mathematics, computer science, history, business, theory notes, research material, or another academic subject.",
        "- Adapt the summary structure intelligently according to the PDF content.",
        "- If a requested section is not relevant to the PDF, replace it with a more appropriate equivalent instead of forcing irrelevant information.",
        "- Preserve important terminology, names, formulas, laws, dates, processes, examples, and technical keywords from the source.",

        "OUTPUT STRUCTURE:",

        "# [PDF / CHAPTER / TOPIC NAME] — HIGH-YIELD REVISION GUIDE",

        "## 1. EXECUTIVE SUMMARY & OVERVIEW",
        "- Write a concise 4-6 sentence overview explaining the central topic, chapter, argument, story, or concept.",
        "- Mention the most important idea first.",
        "- Make this section understandable even if the student has not recently read the PDF.",

        "## 2. KEY CONCEPTS, EVENTS & IDEAS",
        "- Present the most important information as structured bullet points.",
        "- Use short subheadings when the PDF contains multiple topics.",
        "- Include important events, concepts, theories, laws, processes, causes, effects, arguments, steps, or developments.",
        "- Arrange information in logical or chronological order whenever appropriate.",
        "- Highlight relationships such as cause → effect, problem → solution, and concept → application.",

        "## 3. IMPORTANT TERMS, FORMULAS, CHARACTERS & FACTS",
        "- Use a markdown table.",
        "- Use the most suitable first-column label depending on the subject.",
        "",
        "| Term / Character / Formula / Concept | Definition / Role | Significance |",
        "|---|---|---|",
        "| ... | ... | ... |",
        "",
        "- Include only genuinely important entries.",
        "- For mathematics/science, preserve formulas accurately using readable mathematical notation.",
        "- For literature, include major characters, themes, places, and important events.",
        "- For technical subjects, include commands, algorithms, definitions, protocols, components, or terminology when relevant.",

        "## 4. CRITICAL EXAM TAKEAWAYS",
        "- Extract the points most likely to help in exams, tests, viva, or quick revision.",
        "- Focus on definitions, differences, formulas, important facts, sequences, reasons, consequences, and frequently testable concepts.",
        "- Use callout blockquotes for especially important points.",
        "",
        "> Note: [Important fact, formula, rule, definition, or concept to remember]",
        "",
        "- Add multiple Note callouts when necessary, but avoid repeating earlier content.",

        "QUALITY RULES:",
        "- Do not copy large paragraphs directly from the PDF; summarize them.",
        "- Do not omit major topics simply to make the response shorter.",
        "- Do not repeat the same information across sections unless repetition is necessary for exam emphasis.",
        "- Prefer precise bullet points over long paragraphs.",
        "- Preserve numerical values, dates, formulas, names, and technical terminology accurately.",
        "- Clearly distinguish similar concepts where students may get confused.",
        "- When the PDF describes a process, present it step-by-step.",
        "- When comparisons are present, use a compact comparison table.",
        "- When causes/effects or advantages/disadvantages are important, present them separately.",
        "- Do not add citations, page numbers, external knowledge, or web information unless specifically requested.",

        "FORMATTING RULES:",
        "- Use clean Markdown.",
        "- Use # for the main title and ## for main sections.",
        "- Use ### only when useful for subtopics.",
        "- Use **bold** for critical keywords, formulas, dates, names, and concepts.",
        "- Keep paragraphs short.",
        "- Maintain proper spacing between headings, bullets, tables, and callouts.",
        "- Make the final output visually suitable for conversion into a well-formatted PDF.",

        "FINAL CHECK BEFORE RESPONDING:",
        "- Confirm internally that all major PDF topics were covered.",
        "- Remove irrelevant or duplicate points.",
        "- Ensure the summary can be used as a standalone revision guide.",
        "- Ensure every important fact comes from the uploaded PDF."

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
    let formatted = await generateText(prompt, 16384);

    if (tag === "hindi" && !looksLikeCompleteHindiOutput(input, formatted)) {
      formatted = await generateText(
        [
          "Translate and format the COMPLETE raw text below into Devanagari Hindi markdown.",
          "This is a strict repair pass because the previous output kept too much English.",
          "Rules:",
          "- Every heading and paragraph must be Hindi unless it is code, a formula, a unit, or a proper noun.",
          "- Keep the same meaning, order, examples, questions, answers, numbers, and formulas.",
          "- Start with one Hindi # title.",
          "- Return only the final markdown.",
          "",
          "Raw text:",
          input,
        ].join("\n"),
        16384
      );
    }

    if (tag === "hindi") {
      if (looksLikeCompleteHindiOutput(input, formatted)) {
        return formatted;
      }
      throw new Error("Hindi conversion did not produce complete Devanagari output.");
    }

    // For summary mode, allow shorter summarized text. For verbatim modes (english/code/hindi), check length safety.
    if (tag === "summary" && formatted && formatted.trim().length > 50) {
      return formatted;
    }

    if (formatted && formatted.trim().length >= input.trim().length * 0.6) {
      return formatted;
    }
  } catch (err) {
    console.error("[formatStudyTextForPdf Error]:", err);
    if (tag === "hindi" && needsHindiTranslation(input)) {
      throw new Error("Could not convert the complete text to Hindi. Please try again.");
    }
  }

  // Fallback: Preserve exact raw input with title heading
  const firstLine = input.trim().split("\n")[0] || "Study Document";
  const titleHeader = /^#\s+/.test(firstLine) ? "" : `# ${firstLine.replace(/^[#\s]+/, "")}\n\n`;
  return `${titleHeader}${input}`;
}

function looksLikeCompleteHindiOutput(input: string, output: string) {
  if (!needsHindiTranslation(input)) return true;

  const devanagari = (output.match(/[\u0900-\u097F]/g) || []).length;
  const latin = (output.match(/[A-Za-z]/g) || []).length;

  return devanagari >= 40 && devanagari >= latin;
}

function needsHindiTranslation(input: string) {
  const sourceLatin = (input.match(/[A-Za-z]/g) || []).length;
  const sourceDevanagari = (input.match(/[\u0900-\u097F]/g) || []).length;

  return sourceLatin >= 30 && sourceLatin > sourceDevanagari;
}
