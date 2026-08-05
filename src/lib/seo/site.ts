export const SITE_URL = "https://studysparks.cloud";
export const SITE_NAME = "StudySpark";
export const SITE_DISPLAY_NAME = "Study Sparks";
export const SITE_DESCRIPTION =
  "StudySpark helps students plan revision, focus with timers, organize study tasks, and review progress with practical educational tools.";

export const SITE_CONTACT_EMAIL = "support@studysparks.cloud";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

