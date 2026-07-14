import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Session-check endpoint: return 200 with null user when not authenticated.
    // Returning 401 here causes apiFetch to throw on the client, which is
    // unnecessary noise for a "check" endpoint and makes the auth flow fragile.
    if (!user) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 });
    }

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      profile,
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ user: null, profile: null }, { status: 200 });
  }
}
