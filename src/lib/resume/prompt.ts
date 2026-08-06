import type { ResumeMakerInput } from "./schema";

const toneInstructions = {
  ats: "ATS-friendly, concise, keyword-aware, and easy to scan.",
  fresher:
    "Fresher-focused, honest about limited experience, and strong on education, skills, projects, and potential.",
  internship:
    "Internship-focused, student-friendly, and strong on projects, coursework, learning ability, and practical skills.",
  professional:
    "Professional, impact-oriented, and suitable for a candidate with work experience.",
} as const;

function formatList<T>(items: T[], formatter: (item: T, index: number) => string) {
  return items.map(formatter).join("\n");
}

export function buildResumePrompt(input: ResumeMakerInput) {
  const education = formatList(
    input.education,
    (item, index) =>
      `${index + 1}. ${item.degree} at ${item.school}${item.dates ? ` (${item.dates})` : ""}${item.details ? ` - ${item.details}` : ""}`
  );

  const experience = input.experience.length
    ? formatList(
        input.experience,
        (item, index) =>
          `${index + 1}. ${item.role}${item.organization ? `, ${item.organization}` : ""}${item.dates ? ` (${item.dates})` : ""}: ${item.details}`
      )
    : "No formal work experience provided.";

  const projects = input.projects.length
      ? formatList(
        input.projects,
        (item, index) =>
          `${index + 1}. ${item.name}${item.tech ? ` [${item.tech}]` : ""}${item.link ? ` (${item.link})` : ""}: ${item.details}`
      )
    : "No projects provided.";

  return [
    "You are StudySpark Resume Maker, an honest resume writing assistant for students and early-career candidates.",
    "Create a polished resume from the facts provided by the user.",
    "",
    "STRICT RULES:",
    "- Return ONLY valid JSON. Do not wrap it in markdown.",
    "- Do not invent jobs, companies, degrees, marks, certifications, dates, awards, metrics, links, or experience.",
    "- You may improve wording, organize facts, and infer common ATS keywords from the target role and listed skills.",
    "- If a metric is not provided, write impact without fake numbers.",
    "- Keep bullets truthful, specific, and action-oriented.",
    "- Keep the resume suitable for a one-page student/early-career resume.",
    "",
    "JSON shape:",
    `{
  "headline": "short role headline",
  "summary": "3-4 sentence professional summary",
  "contact": { "fullName": "", "email": "", "phone": "", "location": "", "links": "" },
  "skills": ["skill"],
  "experience": [{ "title": "", "organization": "", "dates": "", "bullets": ["bullet"] }],
  "projects": [{ "name": "", "tech": "", "link": "", "bullets": ["bullet"] }],
  "education": [{ "school": "", "degree": "", "dates": "", "details": "" }],
  "certifications": ["certification"],
  "achievements": ["achievement"],
  "atsKeywords": ["keyword"],
  "improvementTips": ["tip"]
}`,
    "",
    `Resume style: ${input.tone} - ${toneInstructions[input.tone]}`,
    `Target role: ${input.targetRole}`,
    "",
    "Candidate facts:",
    `Name: ${input.fullName}`,
    `Email: ${input.email ?? ""}`,
    `Phone: ${input.phone ?? ""}`,
    `Location: ${input.location ?? ""}`,
    `Links: ${input.links ?? ""}`,
    `Skills: ${input.skills}`,
    `Education:\n${education}`,
    `Experience:\n${experience}`,
    `Projects:\n${projects}`,
    `Certifications:\n${input.certifications ?? "None provided."}`,
    `Achievements:\n${input.achievements ?? "None provided."}`,
    "",
    "User custom instruction:",
    input.customPrompt || "No extra instruction.",
  ].join("\n");
}

export function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI returned text instead of resume JSON.");
  }

  return text.slice(start, end + 1);
}
