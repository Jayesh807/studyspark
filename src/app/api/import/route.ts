import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/import?mode=merge|replace
 * Body: a StudySpark JSON backup (the same shape produced by GET /api/export?type=all-json)
 *
 * mode=merge (default): adds the backup records to the current account (new IDs).
 * mode=replace: deletes the current account's records first, then imports the backup.
 *
 * Returns a summary of imported counts.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode = (req.nextUrl.searchParams.get("mode") ?? "merge") as "merge" | "replace";
  if (mode !== "merge" && mode !== "replace") {
    return NextResponse.json({ error: "Invalid mode. Use 'merge' or 'replace'." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Validate top-level shape
  const backup = body as Record<string, unknown>;
  if (!backup || typeof backup !== "object" || !Array.isArray((backup as any).meta ? undefined : undefined)) {
    // soft check below
  }
  const meta = (backup as any)?.meta;
  if (!meta || meta.app !== "StudySpark") {
    return NextResponse.json(
      { error: "This doesn't look like a StudySpark backup file. Missing or invalid meta.app." },
      { status: 400 }
    );
  }

  const isArr = (v: unknown): v is any[] => Array.isArray(v);

  try {
    const result = await db.$transaction(async (tx) => {
      // Replace mode: wipe current user's data first (order matters for FKs — none here besides profile)
      if (mode === "replace") {
        await tx.todo.deleteMany({ where: { userId: user.id } });
        await tx.event.deleteMany({ where: { userId: user.id } });
        await tx.subject.deleteMany({ where: { userId: user.id } });
        await tx.exam.deleteMany({ where: { userId: user.id } });
        await tx.focusSession.deleteMany({ where: { userId: user.id } });
        // keep profile + badges
      }

      const counts = {
        todos: 0,
        subjects: 0,
        exams: 0,
        events: 0,
        focusSessions: 0,
        profileUpdated: false,
      };

      // --- Profile (upsert: merge mode updates fields, replace mode restores) ---
      const p = (backup as any).profile;
      if (p && typeof p === "object") {
        const data = {
          bio: String(p.bio ?? ""),
          goal: String(p.goal ?? ""),
          targetHours: Number.isFinite(p.targetHours) ? Number(p.targetHours) : 6,
          college: String(p.college ?? ""),
          course: String(p.course ?? ""),
          semester: Number.isFinite(p.semester) ? Number(p.semester) : 1,
          avatar: String(p.avatar ?? ""),
          studyStreak: Number.isFinite(p.studyStreak) ? Number(p.studyStreak) : 0,
        };
        await tx.profile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...data },
          update: data,
        });
        counts.profileUpdated = true;
      }

      // --- Todos ---
      if (isArr((backup as any).todos)) {
        for (const t of (backup as any).todos) {
          if (!t || typeof t.title !== "string" || !t.title.trim()) continue;
          await tx.todo.create({
            data: {
              userId: user.id,
              title: String(t.title).slice(0, 200),
              description: String(t.description ?? ""),
              priority: ["low", "medium", "high"].includes(t.priority) ? t.priority : "medium",
              category: ["general", "study", "assignment", "revision", "exam"].includes(t.category)
                ? t.category
                : "general",
              status: ["todo", "in-progress", "completed"].includes(t.status) ? t.status : "todo",
              subject: String(t.subject ?? ""),
              dueDate: t.dueDate ? new Date(t.dueDate) : null,
              order: Number.isFinite(t.order) ? Number(t.order) : 0,
            },
          });
          counts.todos++;
        }
      }

      // --- Subjects ---
      if (isArr((backup as any).subjects)) {
        for (const s of (backup as any).subjects) {
          if (!s || typeof s.name !== "string" || !s.name.trim()) continue;
          await tx.subject.create({
            data: {
              userId: user.id,
              name: String(s.name).slice(0, 120),
              teacher: String(s.teacher ?? ""),
              credits: Number.isFinite(s.credits) ? Number(s.credits) : 3,
              attendance: Number.isFinite(s.attendance) ? Number(s.attendance) : 0,
              color: String(s.color ?? "violet"),
              progress: Number.isFinite(s.progress) ? Math.min(100, Math.max(0, Number(s.progress))) : 0,
              notes: String(s.notes ?? ""),
            },
          });
          counts.subjects++;
        }
      }

      // --- Exams ---
      if (isArr((backup as any).exams)) {
        for (const e of (backup as any).exams) {
          if (!e || typeof e.examName !== "string" || !e.examName.trim()) continue;
          const date = e.date ? new Date(e.date) : null;
          if (!date || isNaN(date.getTime())) continue;
          await tx.exam.create({
            data: {
              userId: user.id,
              subject: String(e.subject ?? ""),
              examName: String(e.examName).slice(0, 200),
              date,
              time: String(e.time ?? ""),
              location: String(e.location ?? ""),
              priority: ["low", "medium", "high"].includes(e.priority) ? e.priority : "medium",
              progress: Number.isFinite(e.progress) ? Math.min(100, Math.max(0, Number(e.progress))) : 0,
              notes: String(e.notes ?? ""),
            },
          });
          counts.exams++;
        }
      }

      // --- Events ---
      if (isArr((backup as any).events)) {
        for (const ev of (backup as any).events) {
          if (!ev || typeof ev.title !== "string" || !ev.title.trim()) continue;
          const date = ev.date ? new Date(ev.date) : null;
          if (!date || isNaN(date.getTime())) continue;
          await tx.event.create({
            data: {
              userId: user.id,
              title: String(ev.title).slice(0, 200),
              date,
              time: String(ev.time ?? ""),
              description: String(ev.description ?? ""),
              color: String(ev.color ?? "violet"),
            },
          });
          counts.events++;
        }
      }

      // --- Focus sessions ---
      if (isArr((backup as any).focusSessions)) {
        for (const f of (backup as any).focusSessions) {
          if (!f || !Number.isFinite(f.duration)) continue;
          const date = f.date ? new Date(f.date) : new Date();
          if (isNaN(date.getTime())) continue;
          await tx.focusSession.create({
            data: {
              userId: user.id,
              duration: Math.max(0, Math.min(600, Number(f.duration))),
              date,
              completed: f.completed !== false,
              type: ["focus", "break"].includes(f.type) ? f.type : "focus",
              subject: String(f.subject ?? ""),
            },
          });
          counts.focusSessions++;
        }
      }

      return counts;
    });

    return NextResponse.json({
      success: true,
      mode,
      imported: result,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed. The backup file may be corrupted." },
      { status: 500 }
    );
  }
}
