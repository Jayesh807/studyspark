import { describe, expect, it } from "bun:test";
import { buildResumePrompt, extractJsonObject } from "./prompt";
import { resumeMakerInputSchema } from "./schema";

const sampleInput = resumeMakerInputSchema.parse({
  fullName: "Asha Sharma",
  email: "asha@example.com",
  targetRole: "Frontend Developer Intern",
  tone: "internship",
  education: [
    {
      school: "Delhi Technical College",
      degree: "B.Tech Computer Science",
      dates: "2023 - 2027",
    },
  ],
  experience: [],
  projects: [
    {
      name: "Study Planner",
      tech: "React, Next.js",
      link: "github.com/asha-dev/study-planner",
      details: "Built a task planner with calendar view and local storage.",
    },
  ],
  skills: "React, Next.js, TypeScript, Tailwind CSS",
  customPrompt: "Make it ATS friendly for frontend internships.",
});

describe("resume prompt", () => {
  it("keeps user facts and honesty rules in the prompt", () => {
    const prompt = buildResumePrompt(sampleInput);

    expect(prompt).toContain("Asha Sharma");
    expect(prompt).toContain("Frontend Developer Intern");
    expect(prompt).toContain("github.com/asha-dev/study-planner");
    expect(prompt).toContain("Do not invent jobs");
    expect(prompt).toContain("Make it ATS friendly");
  });

  it("extracts JSON from model text", () => {
    expect(extractJsonObject("Here is JSON:\n{\"headline\":\"Developer\"}\nThanks")).toBe(
      "{\"headline\":\"Developer\"}"
    );
  });
});
