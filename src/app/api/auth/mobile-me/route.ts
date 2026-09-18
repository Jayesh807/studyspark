import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Mobile-specific "who am I" endpoint: reads Authorization: Bearer <token>
// instead of the httpOnly cookie used by the web app.

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, createdAt: true },
    });

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
    console.error("Mobile me error:", error);
    return NextResponse.json({ user: null, profile: null }, { status: 200 });
  }
}
