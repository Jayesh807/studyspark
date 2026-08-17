export const SITE_URL = "https://studysparks.cloud";
export const SITE_NAME = "StudySpark";
export const SITE_DISPLAY_NAME = "Study Sparks";
export const SITE_DESCRIPTION =
  "StudySparks offers AI study tools to turn PDFs, lecture notes, and study materials into quizzes, practice tests, questions, and study guides. Create AI-generated quizzes with different question types and difficulty levels to prepare smarter for exams.";

export const SITE_CONTACT_EMAIL = "support@studysparks.cloud";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
