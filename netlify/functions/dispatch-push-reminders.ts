export default async function handler() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    ""
  ).replace(/^"|"$/g, "");
  const secret = process.env.PUSH_CRON_SECRET;

  if (!siteUrl || !secret) {
    return new Response("Push cron is not configured", { status: 500 });
  }

  try {
    const response = await fetch(`${siteUrl}/api/push/schedule`, {
      headers: {
        authorization: `Bearer ${secret}`,
      },
    });

    const body = await response.text();
    return new Response(body, { status: response.status });
  } catch (error) {
    console.error("[Dispatch Push Reminders Error]:", error);
    return new Response("Could not dispatch push reminders", { status: 500 });
  }
}

export const config = {
  schedule: "* * * * *",
};
