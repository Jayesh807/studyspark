import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, clearAuthCookie, verifyPassword } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json().catch(() => ({}));
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    // Fetch the user from the database including the hashed password
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify the password
    const isPasswordCorrect = await verifyPassword(password, dbUser.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    // Delete the user from the database.
    // Thanks to schema-level onDelete: Cascade on relations (Profile, Todo, Event, etc.),
    // all of the user's associated data will be automatically and permanently removed.
    await db.user.delete({
      where: { id: user.id },
    });

    // Clear the auth cookie
    await clearAuthCookie();

    return NextResponse.json({ success: true, message: "Account deleted permanently." });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
