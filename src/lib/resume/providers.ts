
import { buildResumePrompt, extractJsonObject } from "./prompt";
import {
  generatedResumeSchema,
  type GeneratedResume,
  type ResumeMakerInput,
} from "./schema";

const AI_REQUEST_TIMEOUT_MS = 25_000;

export class ResumeGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeGenerationError";
  }
}

function timeoutSignal() {
  return AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS);
}

function isTimeoutError(error: unknown) {
  return error instanceof DOMException && error.name === "TimeoutError";
}

async function generateWithGroq(prompt: string) {
  if (!process.env.GROQ_API_KEY) return null;

  const models = process.env.GROQ_MODEL
    ? [process.env.GROQ_MODEL]
    : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"];

  let lastError = "";

  for (const model of models) {
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
        signal: timeoutSignal(),
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
        throw new ResumeGenerationError("Resume AI timed out. Please try again with shorter details.");
      }
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (lastError) {
    throw new ResumeGenerationError(`Groq resume generation failed: ${lastError}`);
  }

  return null;
}

async function generateWithGemini(prompt: string) {
  if (!process.env.GEMINI_API_KEY) return null;

  const key = process.env.GEMINI_API_KEY.trim();
  const models = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL]
    : ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];

  let lastError = "";

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 3000,
              responseMimeType: "application/json",
            },
          }),
          signal: timeoutSignal(),
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
        throw new ResumeGenerationError("Resume AI timed out. Please try again with shorter details.");
      }
      lastError = error instanceof Error ? error.message : String(error);
    }
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
  const responseText =
    (await generateWithGroq(prompt)) ?? (await generateWithGemini(prompt));

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
