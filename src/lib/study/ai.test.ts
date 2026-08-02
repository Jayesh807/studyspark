/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test";
import { generateGroundedQuiz } from "./ai";

const originalGroqKey = process.env.GROQ_API_KEY;
const originalGroqModel = process.env.GROQ_MODEL;
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
  globalThis.fetch = originalFetch;
});

describe("generateGroundedQuiz", () => {
  const context = [
    "Newton's first law states that an object remains at rest or in uniform motion unless acted upon by an external force.",
    "Newton's second law states that force equals mass times acceleration.",
    "Newton's third law states that every action has an equal and opposite reaction.",
    "Momentum is the product of mass and velocity.",
    "Work is done when a force causes displacement.",
    "Energy is the capacity to do work.",
  ].join(" ");

  test("accepts live markdown quizzes with bullet-prefixed options", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const aiContent = [
      "1. What does Newton's first law state?",
      "- A) An object remains at rest or in uniform motion unless acted upon by an external force",
      "- B) Force equals mass times acceleration",
      "- C) Every action has an equal and opposite reaction",
      "- D) Energy is the capacity to do work",
      "Answer: A",
      "Explanation: This follows Newton's first law.",
      "",
      "2. What does Newton's second law state?",
      "- A) Momentum is mass times velocity",
      "- B) Force equals mass times acceleration",
      "- C) Work requires displacement",
      "- D) Energy is the capacity to do work",
      "Answer: B",
      "Explanation: This follows Newton's second law.",
      "",
      "3. True or False: Momentum is the product of mass and velocity.",
      "- A) True",
      "- B) False",
      "Answer: A",
      "Explanation: The material defines momentum this way.",
      "",
      "4. Work is done when force causes ___.",
      "- A) displacement",
      "- B) rest",
      "- C) mass",
      "- D) velocity",
      "Answer: A",
      "Explanation: The material links work with displacement.",
      "",
      "5. Energy is the capacity to do what?",
      "- A) remain at rest",
      "- B) accelerate only",
      "- C) do work",
      "- D) oppose reaction",
      "Answer: C",
      "Explanation: The material defines energy as capacity to do work.",
    ].join("\n");

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: aiContent } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const questions = await generateGroundedQuiz(context, 5);

    expect(questions).toHaveLength(5);
    expect(questions[0].answer).toBe(
      "An object remains at rest or in uniform motion unless acted upon by an external force"
    );
  });

  test("accepts markdown quizzes with bold labels and no spaces after option markers", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";

    const aiContent = [
      "**Question 1:** What does Newton's first law describe?",
      "**A)**Objects staying at rest or uniform motion unless acted on by force",
      "**B)**Force equals mass times acceleration",
      "**C)**Every action has an opposite reaction",
      "**D)**Energy is capacity to do work",
      "**Answer:** A",
      "",
      "**Question 2:** What does Newton's second law state?",
      "**A)**Momentum is mass times velocity",
      "**B)**Force equals mass times acceleration",
      "**C)**Work requires displacement",
      "**D)**Objects remain at rest",
      "**Answer:** B",
      "",
      "**Question 3:** True or False: Work is done when force causes displacement.",
      "**A)**True",
      "**B)**False",
      "**Answer:** A",
      "",
      "**Question 4:** Energy is the capacity to do what?",
      "**A)**Remain at rest",
      "**B)**Accelerate only",
      "**C)**Do work",
      "**D)**Oppose reaction",
      "**Answer:** C",
      "",
      "**Question 5:** Momentum is the product of which quantities?",
      "**A)**Mass and velocity",
      "**B)**Force and displacement",
      "**C)**Energy and work",
      "**D)**Action and reaction",
      "**Answer:** A",
    ].join("\n");

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: aiContent } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;

    const questions = await generateGroundedQuiz(context, 5);

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

    const questions = await generateGroundedQuiz(context, 5);

    expect(questions).toHaveLength(5);
    expect(questions.every((question) => question.answer === "True")).toBe(true);
  });
});
