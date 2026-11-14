import { resolveGeminiModels } from "../ai/gemini-models";

import { buildResumePrompt, extractJsonObject } from "./prompt";
import {
  generatedResumeSchema,
  type GeneratedResume,
  type ResumeMakerInput,
} from "./schema";

/** Max time for a single provider/model attempt. */
const AI_REQUEST_TIMEOUT_MS = 22_000;
/**
 * Total time budget for all attempts combined. Kept below Netlify's
 * synchronous function limit so we can return a clear error instead of
 * having the platform kill the request.
 */
const AI_TOTAL_BUDGET_MS = 50_000;
/** Don't start a new attempt with less time than this left. */
const MIN_ATTEMPT_MS = 4_000;
const TIMEOUT_MESSAGE = "Resume AI timed out. Please try again with shorter details.";

export class ResumeGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeGenerationError";
  }
}

type Deadline = { endsAt: number; timedOut: boolean };

function createDeadline(): Deadline {
  return { endsAt: Date.now() + AI_TOTAL_BUDGET_MS, timedOut: false };
}

/** Returns an abort signal for the next attempt, or null if the budget is spent. */
function attemptSignal(deadline: Deadline) {
  const remaining = deadline.endsAt - Date.now();
  if (remaining < MIN_ATTEMPT_MS) return null;
  return AbortSignal.timeout(Math.min(AI_REQUEST_TIMEOUT_MS, remaining));
}

function isTimeoutError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

async function generateWithGroq(prompt: string, deadline: Deadline) {
  if (!process.env.GROQ_API_KEY) return null;

  const models = process.env.GROQ_MODEL
    ? [process.env.GROQ_MODEL]
    : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

  let lastError = "";

  for (const model of models) {
    const signal = attemptSignal(deadline);
    if (!signal) break;
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: "json_object" },
        }),
        signal,
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) return content.trim();
      }

      lastError = await response.text().catch(() => `HTTP ${response.status}`);
    } catch (error) {
      if (isTimeoutError(error)) {
        // Try the next (faster) model or provider with the remaining budget.
        deadline.timedOut = true;
        lastError = `${model} timed out`;
        continue;
      }
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (lastError) {
    console.warn(`Groq resume generation error (${lastError}), falling back to Gemini...`);
  }

  return null;
}

function geminiGenerationConfig(model: string) {
  return {
    temperature: 0.2,
    maxOutputTokens: 3000,
    responseMimeType: "application/json",
    // Gemini 3 models "think" by default, which can take longer than the
    // request budget. Resume writing doesn't need deep reasoning.
    ...(/gemini-3/i.test(model) ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
  };
}

async function generateWithGemini(prompt: string, deadline: Deadline) {
  if (!process.env.GEMINI_API_KEY) return null;

  const key = process.env.GEMINI_API_KEY.trim();
  const models = resolveGeminiModels(process.env.GEMINI_MODEL);

  let lastError = "";

  for (const model of models) {
    const signal = attemptSignal(deadline);
    if (!signal) break;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: geminiGenerationConfig(model),
          }),
          signal,
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) return content.trim();
      }

      const errorJson = await response.json().catch(() => ({}));
      lastError =
        typeof errorJson === "object" &&
          errorJson &&
          "error" in errorJson &&
          typeof errorJson.error === "object" &&
          errorJson.error &&
          "message" in errorJson.error
          ? String(errorJson.error.message)
          : `HTTP ${response.status}`;
    } catch (error) {
      if (isTimeoutError(error)) {
        deadline.timedOut = true;
        lastError = `${model} timed out`;
        continue;
      }
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (deadline.timedOut) {
    throw new ResumeGenerationError(TIMEOUT_MESSAGE);
  }

  if (lastError) {
    throw new ResumeGenerationError(`Gemini resume generation failed: ${lastError}`);
  }

  return null;
}

function normalizeResume(input: ResumeMakerInput, value: GeneratedResume): GeneratedResume {
  const inputProjectCount = input.projects.length;
  const inputExperienceCount = input.experience.length;
  const inputCertifications = input.certifications
    ? input.certifications
      .split(/[,\n;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
    : [];

  return {
    ...value,
    contact: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      location: input.location,
      links: input.links,
    },
    education: value.education.length ? value.education : input.education,
    certifications: value.certifications.length ? value.certifications : inputCertifications,
    experience: inputExperienceCount ? value.experience.slice(0, inputExperienceCount) : [],
    projects: inputProjectCount
      ? value.projects.slice(0, inputProjectCount).map((project, index) => ({
        ...project,
        link: project.link || input.projects[index]?.link,
      }))
      : [],
  };
}

export async function generateResume(input: ResumeMakerInput): Promise<GeneratedResume> {
  const prompt = buildResumePrompt(input);
  const deadline = createDeadline();
  const responseText =
    (await generateWithGroq(prompt, deadline)) ??
    (await generateWithGemini(prompt, deadline));

  if (!responseText && deadline.timedOut) {
    throw new ResumeGenerationError(TIMEOUT_MESSAGE);
  }

  if (!responseText) {
    throw new ResumeGenerationError(
      "Resume AI is not configured. Add GROQ_API_KEY or GEMINI_API_KEY in Netlify environment variables."
    );
  }

  try {
    const parsedJson = JSON.parse(extractJsonObject(responseText));
    const parsed = generatedResumeSchema.parse(parsedJson);
    return normalizeResume(input, parsed);
  } catch (error) {
    console.error("[Resume Maker]: invalid AI output", error, responseText);
    throw new ResumeGenerationError("AI returned an invalid resume format. Please try again.");
  }
}
