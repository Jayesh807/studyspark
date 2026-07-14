import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores"
    )
    .optional(),
  bio: z.string().max(500).optional(),
  goal: z.string().max(200).optional(),
  targetHours: z.number().int().min(1).max(24).optional(),
  college: z.string().max(100).optional(),
  course: z.string().max(100).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  avatar: z.string().max(200000).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { username, ...profileData } = parsed.data;

    if (username && username !== user.username) {
      const existing = await db.user.findUnique({ where: { username } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    const [updatedUser, profile] = await db.$transaction([
      username
        ? db.user.update({
            where: { id: user.id },
            data: { username },
            select: { id: true, username: true, email: true },
          })
        : db.user.findUniqueOrThrow({
            where: { id: user.id },
            select: { id: true, username: true, email: true },
          }),
      db.profile.upsert({
        where: { userId: user.id },
        update: profileData,
        create: { userId: user.id, ...profileData },
      }),
    ]);

    return NextResponse.json({
      user: updatedUser,
      profile,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
