export type ResumeTone = "ats" | "fresher" | "internship" | "professional";

export interface ResumeEducationInput {
  school: string;
  degree: string;
  dates?: string;
  details?: string;
}

export interface ResumeExperienceInput {
  role: string;
  organization?: string;
  dates?: string;
  details: string;
}

export interface ResumeProjectInput {
  name: string;
  tech?: string;
  link?: string;
  details: string;
}

export interface ResumeMakerInput {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: string;
  targetRole: string;
  tone: ResumeTone;
  education: ResumeEducationInput[];
  experience: ResumeExperienceInput[];
  projects: ResumeProjectInput[];
  skills: string;
  certifications?: string;
  achievements?: string;
  customPrompt?: string;
}

export interface GeneratedResume {
  headline: string;
  summary: string;
  contact: {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    links?: string;
  };
  skills: string[];
  experience: {
    title: string;
    organization?: string;
    dates?: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    tech?: string;
    link?: string;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    dates?: string;
    details?: string;
  }[];
  certifications: string[];
  achievements: string[];
  atsKeywords: string[];
  improvementTips: string[];
}
