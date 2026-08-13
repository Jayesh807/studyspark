export default async function handler() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL;
  const secret = process.env.PUSH_CRON_SECRET;

  if (!siteUrl || !secret) {
    return new Response("Push cron is not configured", { status: 500 });
  }

  const response = await fetch(`${siteUrl}/api/push/schedule`, {
    headers: {
      authorization: `Bearer ${secret}`,
    },
  });

  const body = await response.text();
  return new Response(body, { status: response.status });
}

export const config = {
  schedule: "* * * * *",
};
