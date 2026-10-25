import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { signGooglePending, signToken, verifyMobileGoogleTicket } from "@/lib/auth";

/**
 * Final step of mobile Google sign-in. The app sends the short-lived ticket it received
 * on its deep link plus the secret verifier it generated before opening the browser.
 * Only the app that started the flow knows the verifier, so a ticket that leaks via the
 * redirect is useless on its own.
 *
 * Response matches /api/auth/mobile-google: { token, user, profile } for existing users,
 * or { requiresUsername: true, pendingToken } for new ones.
 */

const schema = z.object({
  ticket: z.string().min(1, "Ticket is required"),
  verifier: z.string().min(43, "Invalid verifier").max(128, "Invalid verifier"),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const ticket = verifyMobileGoogleTicket(parsed.data.ticket);
    const expected = crypto
      .createHash("sha256")
      .update(parsed.data.verifier)
      .digest("base64url");

    if (!ticket || ticket.challenge !== expected) {
      return NextResponse.json(
        { error: "Google sign-in session expired. Please try again." },
        { status: 401 }
      );
    }

    if ("pending" in ticket) {
      return NextResponse.json({
        requiresUsername: true,
        pendingToken: signGooglePending(ticket.pending),
      });
    }

    const user = await db.user.findUnique({ where: { id: ticket.uid } });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    const profile = await db.profile.findUnique({ where: { userId: user.id } });

    return NextResponse.json({
      token: signToken(user.id),
      user: { id: user.id, username: user.username, email: user.email },
      profile,
      requiresUsername: false,
    });
  } catch (error) {
    console.error("Mobile Google exchange error:", error);
    return NextResponse.json(
      { error: "Google sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
