import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(800)
  .optional()
  .transform((value) => (value ? value : undefined));

export const resumeToneSchema = z.enum([
  "ats",
  "fresher",
  "internship",
  "professional",
]);

export const resumeEducationSchema = z.object({
  school: z.string().trim().min(2).max(120),
  degree: z.string().trim().min(2).max(120),
  dates: optionalText,
  details: optionalText,
});

export const resumeExperienceSchema = z.object({
  role: z.string().trim().min(2).max(120),
  organization: optionalText,
  dates: optionalText,
  details: z.string().trim().min(10).max(1200),
});

export const resumeProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tech: optionalText,
  link: optionalText,
  details: z.string().trim().min(10).max(1200),
});

export const resumeMakerInputSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: optionalText,
  phone: optionalText,
  location: optionalText,
  links: optionalText,
  targetRole: z.string().trim().min(2).max(100),
  tone: resumeToneSchema.default("ats"),
  education: z.array(resumeEducationSchema).min(1).max(4),
  experience: z.array(resumeExperienceSchema).max(6).default([]),
  projects: z.array(resumeProjectSchema).max(6).default([]),
  skills: z.string().trim().min(5).max(1600),
  certifications: optionalText,
  achievements: optionalText,
  customPrompt: z.string().trim().max(1000).optional(),
});

const generatedBulletSchema = z.string().trim().min(8).max(220);

export const generatedResumeSchema = z.object({
  headline: z.string().trim().min(5).max(120),
  summary: z.string().trim().min(30).max(700),
  contact: z.object({
    fullName: z.string().trim().min(2).max(80),
    email: optionalText,
    phone: optionalText,
    location: optionalText,
    links: optionalText,
  }),
  skills: z.array(z.string().trim().min(1).max(60)).min(4).max(30),
  experience: z.array(
    z.object({
      title: z.string().trim().min(2).max(120),
      organization: optionalText,
      dates: optionalText,
      bullets: z.array(generatedBulletSchema).min(2).max(5),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string().trim().min(2).max(120),
      tech: optionalText,
      link: optionalText,
      bullets: z.array(generatedBulletSchema).min(2).max(5),
    })
  ),
  education: z.array(resumeEducationSchema).min(1).max(4),
  certifications: z.array(z.string().trim().min(2).max(180)).max(8).default([]),
  achievements: z.array(z.string().trim().min(4).max(180)).max(8),
  atsKeywords: z.array(z.string().trim().min(2).max(60)).min(5).max(25),
  improvementTips: z.array(z.string().trim().min(8).max(180)).min(2).max(8),
});

export type ResumeMakerInput = z.infer<typeof resumeMakerInputSchema>;
export type GeneratedResume = z.infer<typeof generatedResumeSchema>;
