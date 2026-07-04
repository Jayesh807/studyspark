import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function escapeCSV(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "todos";

  try {
    let csv: string;
    let filename: string;

    switch (type) {
      case "todos": {
        const todos = await db.todo.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });
        csv = toCSV(
          ["Title", "Description", "Priority", "Category", "Status", "Subject", "Due Date", "Created At"],
          todos.map((t) => [
            t.title,
            t.description,
            t.priority,
            t.category,
            t.status,
            t.subject,
            t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "",
            new Date(t.createdAt).toLocaleDateString(),
          ])
        );
        filename = `studyspark-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "subjects": {
        const subjects = await db.subject.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });
        csv = toCSV(
          ["Name", "Teacher", "Credits", "Attendance %", "Progress %", "Color", "Notes"],
          subjects.map((s) => [
            s.name,
            s.teacher,
            String(s.credits),
            String(s.attendance),
            String(s.progress),
            s.color,
            s.notes,
          ])
        );
        filename = `studyspark-subjects-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "exams": {
        const exams = await db.exam.findMany({
          where: { userId: user.id },
          orderBy: { date: "asc" },
        });
        csv = toCSV(
          ["Exam Name", "Subject", "Date", "Time", "Location", "Priority", "Progress %", "Notes"],
          exams.map((e) => [
            e.examName,
            e.subject,
            new Date(e.date).toLocaleDateString(),
            e.time,
            e.location,
            e.priority,
            String(e.progress),
            e.notes,
          ])
        );
        filename = `studyspark-exams-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "focus": {
        const sessions = await db.focusSession.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 500,
        });
        csv = toCSV(
          ["Date", "Duration (min)", "Type", "Subject", "Completed"],
          sessions.map((s) => [
            new Date(s.date).toLocaleDateString(),
            String(s.duration),
            s.type,
            s.subject,
            s.completed ? "Yes" : "No",
          ])
        );
        filename = `studyspark-focus-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "all-json": {
        // Full data backup as a single JSON file
        const [profile, todos, subjects, exams, events, focusSessions] = await Promise.all([
          db.profile.findUnique({ where: { userId: user.id } }),
          db.todo.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
          db.subject.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
          db.exam.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
          db.event.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
          db.focusSession.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
        ]);

        const backup = {
          meta: {
            app: "StudySpark",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            username: user.username,
          },
          user: {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
          },
          profile,
          todos,
          subjects,
          exams,
          events,
          focusSessions,
          stats: {
            todoCount: todos.length,
            subjectCount: subjects.length,
            examCount: exams.length,
            eventCount: events.length,
            focusSessionCount: focusSessions.length,
            totalFocusMinutes: focusSessions.reduce((sum, s) => sum + s.duration, 0),
          },
        };

        const json = JSON.stringify(backup, null, 2);
        const jsonFilename = `studyspark-backup-${new Date().toISOString().slice(0, 10)}.json`;
        return new NextResponse(json, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${jsonFilename}"`,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid export type. Use: todos, subjects, exams, focus, all-json" },
          { status: 400 }
        );
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
