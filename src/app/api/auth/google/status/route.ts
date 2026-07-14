import { NextResponse } from "next/server";
import { isGoogleOAuthConfigured } from "@/lib/google-auth";

export async function GET() {
  return NextResponse.json({
    configured: isGoogleOAuthConfigured(),
    clientId: process.env.GOOGLE_CLIENT_ID || null,
  });
}
