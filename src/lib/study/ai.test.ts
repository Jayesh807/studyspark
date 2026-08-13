/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test";
import { generateGroundedQuiz, generatePremiumGroundedQuiz } from "./ai";

const originalGroqKey = process.env.GROQ_API_KEY;
const originalGroqModel = process.env.GROQ_MODEL;
const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalGeminiModel = process.env.GEMINI_MODEL;
const originalFetch = globalThis.fetch;

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

afterEach(() => {
  restoreEnvValue("GROQ_API_KEY", originalGroqKey);
  restoreEnvValue("GROQ_MODEL", originalGroqModel);
  restoreEnvValue("GEMINI_API_KEY", originalGeminiKey);
  restoreEnvValue("GEMINI_MODEL", originalGeminiModel);
  globalThis.fetch = originalFetch;
});

const baseContext = [
  "Rule Alpha states that a learner should review core ideas before solving advanced problems.",
  "Rule Beta states that examples connect definitions with applications.",
  "Rule Gamma states that feedback helps correct repeated mistakes.",
  "Retention score is the product of accuracy and revision frequency.",
  "Practice cycle is the process of attempt, check, and revise.",
  "Summary note is a short statement of the main idea.",
  "Application step is the use of a rule in a new situation.",
  "Balanced schedule keeps study time and rest time organized.",
].join(" ");

describe("generateGroundedQuiz", () => {
  test("accepts live markdown quizzes with bullet-prefixed options", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const aiContent = [
      "1. What does Rule Alpha state?",
      "- A) A learner should review core ideas before solving advanced problems",
      "- B) Examples connect definitions with applications",
      "- C) Feedback helps correct repeated mistakes",
      "- D) A summary note is the main idea",
      "Answer: A",
      "Explanation: This follows Rule Alpha.",
      "",
      "2. What does Rule Beta state?",
      "- A) Retention score is accuracy times revision frequency",
      "- B) Examples connect definitions with applications",
      "- C) Practice cycle includes attempt, check, and revise",
      "- D) Balanced schedule organizes study and rest",
      "Answer: B",
      "Explanation: This follows Rule Beta.",
      "",
      "3. True or False: Retention score is the product of accuracy and revision frequency.",
      "- A) True",
      "- B) False",
      "Answer: A",
      "Explanation: The material defines retention score this way.",
      "",
      "4. Practice cycle is the process of attempt, check, and ___.",
      "- A) revise",
      "- B) ignore",
      "- C) delay",
      "- D) remove",
      "Answer: A",
      "Explanation: The material lists revise as the final step.",
      "",
      "5. A summary note is a short statement of what?",
      "- A) a random example",
      "- B) a repeated mistake",
      "- C) the main idea",
      "- D) rest time only",
      "Answer: C",
      "Explanation: The material defines a summary note as the main idea.",
    ].join("\n");

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: aiContent } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const questions = await generateGroundedQuiz(baseContext, 5);

    expect(questions).toHaveLength(5);
    expect(questions[0].answer).toBe(
      "A learner should review core ideas before solving advanced problems"
    );
  });

  test("accepts markdown quizzes with bold labels and no spaces after option markers", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const aiContent = [
      "**Question 1:** What does Rule Alpha describe?",
      "**A)**Reviewing core ideas before advanced problems",
      "**B)**Connecting examples with applications",
      "**C)**Correcting repeated mistakes",
      "**D)**Writing only final answers",
      "**Answer:** A",
      "",
      "**Question 2:** What does Rule Beta state?",
      "**A)**Retention score combines accuracy and revision frequency",
      "**B)**Examples connect definitions with applications",
      "**C)**Practice cycle requires no checking",
      "**D)**Balanced schedule removes rest time",
      "**Answer:** B",
      "",
      "**Question 3:** True or False: Practice cycle includes attempt, check, and revise.",
      "**A)**True",
      "**B)**False",
      "**Answer:** A",
      "",
      "**Question 4:** Summary note is a short statement of what?",
      "**A)**A delayed task",
      "**B)**A random fact",
      "**C)**The main idea",
      "**D)**A rest-only plan",
      "**Answer:** C",
      "",
      "**Question 5:** Retention score is the product of which quantities?",
      "**A)**Accuracy and revision frequency",
      "**B)**Examples and definitions",
      "**C)**Attempt and delay",
      "**D)**Study time and rest time",
      "**Answer:** A",
    ].join("\n");

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: aiContent } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const questions = await generateGroundedQuiz(baseContext, 5);

    expect(questions).toHaveLength(5);
    expect(questions[2].options).toEqual(["True", "False"]);
  });

  test("builds PDF-grounded fallback questions when AI output cannot be parsed", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "I cannot format the quiz right now." } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const questions = await generateGroundedQuiz(baseContext, 5);

    expect(questions).toHaveLength(5);
    expect(questions.every((question) => question.answer === "True")).toBe(true);
  });

  test("rejects AI questions with duplicate option text", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const aiContent = {
      questions: [
        {
          question: "Which statement correctly describes Rule Beta?",
          options: [
            "Examples connect definitions with applications",
            "Examples connect definitions with applications",
            "Feedback helps correct repeated mistakes",
            "Summary note states the main idea",
          ],
          answer: "Examples connect definitions with applications",
          explanation: "The material states Rule Beta this way.",
        },
        {
          question: "What is retention score?",
          options: [
            "The product of accuracy and revision frequency",
            "The process of attempt and check",
            "A short statement of the main idea",
            "A schedule without rest time",
          ],
          answer: "The product of accuracy and revision frequency",
          explanation: "The material defines retention score this way.",
        },
        {
          question: "What does Rule Gamma state?",
          options: [
            "Feedback helps correct repeated mistakes",
            "Examples remove definitions",
            "Application step avoids new situations",
            "Practice cycle skips revision",
          ],
          answer: "Feedback helps correct repeated mistakes",
          explanation: "The material states Rule Gamma this way.",
        },
        {
          question: "What does the practice cycle include?",
          options: [
            "Attempt, check, and revise",
            "Delay, ignore, and repeat",
            "Accuracy only",
            "Rest time only",
          ],
          answer: "Attempt, check, and revise",
          explanation: "The material defines the practice cycle this way.",
        },
        {
          question: "What is a summary note?",
          options: [
            "A short statement of the main idea",
            "A list of unrelated facts",
            "A repeated mistake",
            "An advanced problem without review",
          ],
          answer: "A short statement of the main idea",
          explanation: "The material defines a summary note this way.",
        },
      ],
    };

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(aiContent) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const questions = await generateGroundedQuiz(baseContext, 5);

    expect(questions).toHaveLength(5);
    expect(questions.some((question) => question.question.includes("Rule Beta"))).toBe(false);
    expect(
      questions.every(
        (question) =>
          new Set(question.options.map((option) => option.toLowerCase())).size ===
          question.options.length
      )
    ).toBe(true);
  });
});

describe("generatePremiumGroundedQuiz", () => {
  test("accepts premium JSON with option objects and correct answer ids", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const typeForId = (id: number) => {
      if (id <= 5) return "single_correct";
      if (id <= 10) return "numerical";
      if (id <= 15) return "multiple_correct";
      if (id <= 20) return "fill_blank";
      return "true_false";
    };

    const questions = Array.from({ length: 25 }, (_, index) => {
      const id = index + 1;
      const type = typeForId(id);
      const isTrueFalse = type === "true_false";
      const correctAnswers = type === "multiple_correct" ? ["A", "C"] : ["A"];

      return {
        id,
        type,
        difficulty: id % 5 === 0 ? "hard" : id % 2 === 0 ? "medium" : "easy",
        topic: "Sample Study Rules",
        question:
          type === "fill_blank"
            ? `For sample case ${id}, Rule Beta connects definitions with ___.`
            : `For sample case ${id}, which study-rule statement is correct?`,
        options: isTrueFalse
          ? [
              { id: "A", text: "True" },
              { id: "B", text: "False" },
            ]
          : [
              { id: "A", text: `Rule Beta connects definitions with applications in case ${id}` },
              { id: "B", text: `Rule Gamma removes feedback from mistakes in case ${id}` },
              { id: "C", text: `Application step uses a rule in a new situation in case ${id}` },
              { id: "D", text: `Summary note is unrelated to main ideas in case ${id}` },
            ],
        correctAnswers,
        explanation: `The correct answer follows from the sample study material for case ${id}.`,
      };
    });

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  examTitle: "Sample Study Rules Premium Exam",
                  subject: "Sample Subject",
                  chapter: "Sample Study Rules",
                  questions,
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const generated = await generatePremiumGroundedQuiz(baseContext, 25);

    expect(generated).toHaveLength(25);
    expect(generated[0].type).toBe("single");
    expect(generated[0].options[0]).toBe(
      "Rule Beta connects definitions with applications in case 1"
    );
    expect(generated[0].answer).toBe(
      "Rule Beta connects definitions with applications in case 1"
    );
    expect(generated[10].type).toBe("multiple");
    expect(generated[10].answers).toEqual([
      "Rule Beta connects definitions with applications in case 11",
      "Application step uses a rule in a new situation in case 11",
    ]);
    expect(generated[20].options).toEqual(["True", "False"]);
    expect(generated[20].answer).toBe("True");
  });

  test("generates 30-question premium exams from section-sized AI batches", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const makeQuestion = (
      id: number,
      type: "single_correct" | "numerical" | "multiple_correct" | "fill_blank" | "true_false"
    ) => {
      const isTrueFalse = type === "true_false";
      return {
        id,
        type,
        difficulty: id % 3 === 0 ? "hard" : id % 2 === 0 ? "medium" : "easy",
        topic: "Sample Study Rules",
        question:
          type === "fill_blank"
            ? `For premium batch case ${id}, Rule Alpha asks learners to review core ___.`
            : `For premium batch case ${id}, which study-rule statement is correct?`,
        options: isTrueFalse
          ? [
              { id: "A", text: "True" },
              { id: "B", text: "False" },
            ]
          : [
              { id: "A", text: `Rule Alpha reviews core ideas before advanced problems in case ${id}` },
              { id: "B", text: `Rule Beta separates definitions from applications in case ${id}` },
              { id: "C", text: `Summary note ignores main ideas in case ${id}` },
              { id: "D", text: `Application step uses a rule in a new situation in case ${id}` },
            ],
        correctAnswers: type === "multiple_correct" ? ["A", "D"] : ["A"],
        explanation: `This follows from the sample study material for case ${id}.`,
      };
    };

    const batches = [
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 1, "single_correct")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 6, "numerical")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 11, "numerical")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 16, "multiple_correct")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 21, "fill_blank")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 26, "true_false")),
    ];
    let callIndex = 0;

    globalThis.fetch = (async () => {
      const questions = batches[callIndex] ?? [];
      callIndex += 1;
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  examTitle: "Sample Study Rules Premium Exam",
                  subject: "Sample Subject",
                  chapter: "Sample Study Rules",
                  questions,
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const generated = await generatePremiumGroundedQuiz(baseContext, 30);

    expect(generated).toHaveLength(30);
    expect(callIndex).toBe(6);
    expect(generated.filter((question) => question.type === "numerical")).toHaveLength(10);
    expect(generated.filter((question) => question.type === "true_false")).toHaveLength(5);
  });

  test("accepts ChatGPT-style markdown premium batches without explicit type fields", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const markdownBatch = (start: number, answers = "A") =>
      Array.from({ length: 5 }, (_, index) => {
        const id = start + index;
        return [
          `**Q${id}.** Which statement correctly applies the uploaded concept in case ${id}?`,
          `A. Rule Alpha reviews core ideas before advanced problems in case ${id}`,
          `B. Rule Beta separates definitions from applications in case ${id}`,
          `C. Feedback helps correct repeated mistakes in case ${id}`,
          `D. Summary notes ignore main ideas in case ${id}`,
          `Answer: ${answers}`,
          `Explanation: The response follows the uploaded sample material in case ${id}.`,
        ].join("\n");
      }).join("\n\n---\n\n");

    const batches = [
      markdownBatch(1),
      markdownBatch(6),
      markdownBatch(11),
      markdownBatch(16, "A, C"),
      markdownBatch(21),
      Array.from({ length: 5 }, (_, index) => {
        const id = 26 + index;
        return [
          `**Q${id}.** True or False: Rule Gamma says feedback helps correct repeated mistakes in case ${id}.`,
          "A. True",
          "B. False",
          "Answer: A",
          `Explanation: The statement follows the uploaded sample material in case ${id}.`,
        ].join("\n");
      }).join("\n\n---\n\n"),
    ];
    let callIndex = 0;

    globalThis.fetch = (async () => {
      const content = batches[callIndex] ?? "";
      callIndex += 1;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const generated = await generatePremiumGroundedQuiz(baseContext, 30);

    expect(generated).toHaveLength(30);
    expect(generated[0].type).toBe("single");
    expect(generated[15].type).toBe("multiple");
    expect(generated[15].answers).toEqual([
      "Rule Alpha reviews core ideas before advanced problems in case 16",
      "Feedback helps correct repeated mistakes in case 16",
    ]);
    expect(generated[25].type).toBe("true_false");
    expect(generated[25].options).toEqual(["True", "False"]);
  });

  test("rejects premium exams instead of showing fallback questions when AI batches are unusable", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "I cannot generate valid JSON for this section." } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    await expect(generatePremiumGroundedQuiz(baseContext, 30)).rejects.toThrow(
      "Sparks AI generated no usable premium questions"
    );
  });

  test("requests Gemini premium batches in JSON mode", async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_MODEL;
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_MODEL = "test-gemini-model";

    const makeQuestion = (
      id: number,
      type: "single_correct" | "numerical" | "multiple_correct" | "fill_blank" | "true_false"
    ) => {
      const isTrueFalse = type === "true_false";
      return {
        id,
        type,
        difficulty: "medium",
        topic: "Sample Study Rules",
        question:
          type === "fill_blank"
            ? `For Gemini JSON case ${id}, Rule Beta connects definitions with ___.`
            : `For Gemini JSON case ${id}, which study-rule statement is correct?`,
        options: isTrueFalse
          ? [
              { id: "A", text: "True" },
              { id: "B", text: "False" },
            ]
          : [
              { id: "A", text: `Rule Alpha reviews core ideas before advanced problems in case ${id}` },
              { id: "B", text: `Rule Beta separates definitions from applications in case ${id}` },
              { id: "C", text: `Feedback helps correct repeated mistakes in case ${id}` },
              { id: "D", text: `Summary notes ignore main ideas in case ${id}` },
            ],
        correctAnswers: type === "multiple_correct" ? ["A", "C"] : ["A"],
        explanation: `This follows from the sample study material for case ${id}.`,
      };
    };

    const batches = [
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 1, "single_correct")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 6, "numerical")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 11, "multiple_correct")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 16, "fill_blank")),
      Array.from({ length: 5 }, (_, index) => makeQuestion(index + 21, "true_false")),
    ];
    const responseMimeTypes: Array<string | undefined> = [];
    let callIndex = 0;

    globalThis.fetch = (async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        generationConfig?: { responseMimeType?: string };
      };
      responseMimeTypes.push(body.generationConfig?.responseMimeType);
      const questions = batches[callIndex] ?? [];
      callIndex += 1;
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      examTitle: "Sample Study Rules Premium Exam",
                      subject: "Sample Subject",
                      chapter: "Sample Study Rules",
                      questions,
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const generated = await generatePremiumGroundedQuiz(baseContext, 25);

    expect(generated).toHaveLength(25);
    expect(callIndex).toBe(5);
    expect(responseMimeTypes).toEqual([
      "application/json",
      "application/json",
      "application/json",
      "application/json",
      "application/json",
    ]);
  });
});
