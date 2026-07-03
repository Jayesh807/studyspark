import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  addDays,
  subDays,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const now = new Date();

  // ── 1. Delete ALL existing data for this user ──────────────────────────────
  await db.focusSession.deleteMany({ where: { userId } });
  await db.exam.deleteMany({ where: { userId } });
  await db.event.deleteMany({ where: { userId } });
  await db.todo.deleteMany({ where: { userId } });
  await db.subject.deleteMany({ where: { userId } });
  await db.profile.deleteMany({ where: { userId } });

  // ── 2. Create demo subjects ────────────────────────────────────────────────
  const subjects = await db.subject.createMany({
    data: [
      {
        userId,
        name: "Mathematics",
        teacher: "Dr. Smith",
        credits: 4,
        attendance: 85,
        color: "violet",
        progress: 72,
      },
      {
        userId,
        name: "Computer Science",
        teacher: "Prof. Johnson",
        credits: 3,
        attendance: 92,
        color: "blue",
        progress: 65,
      },
      {
        userId,
        name: "Physics",
        teacher: "Dr. Williams",
        credits: 4,
        attendance: 78,
        color: "green",
        progress: 45,
      },
      {
        userId,
        name: "English Literature",
        teacher: "Ms. Davis",
        credits: 3,
        attendance: 95,
        color: "amber",
        progress: 80,
      },
      {
        userId,
        name: "Chemistry",
        teacher: "Dr. Brown",
        credits: 4,
        attendance: 70,
        color: "rose",
        progress: 35,
      },
    ],
  });

  // ── 3. Create demo todos ───────────────────────────────────────────────────
  const todayStart = setMinutes(setHours(now, 0), 0);

  await db.todo.createMany({
    data: [
      // 3 × status "todo"
      {
        userId,
        title: "Complete calculus problem set",
        description: "Chapter 7 problems 1-20 on integration techniques",
        priority: "high",
        category: "assignment",
        status: "todo",
        subject: "Mathematics",
        dueDate: todayStart,
        order: 0,
      },
      {
        userId,
        title: "Read Chapter 5 of Data Structures",
        description: "Binary trees and traversal algorithms",
        priority: "medium",
        category: "study",
        status: "todo",
        subject: "Computer Science",
        dueDate: addDays(todayStart, 1),
        order: 1,
      },
      {
        userId,
        title: "Prepare chemistry lab notebook",
        description: "Organize notes and observations from this week's lab",
        priority: "low",
        category: "revision",
        status: "todo",
        subject: "Chemistry",
        dueDate: addDays(todayStart, 5),
        order: 2,
      },
      // 4 × status "in-progress"
      {
        userId,
        title: "Write lab report for Physics experiment",
        description: "Measurements and analysis of the pendulum experiment",
        priority: "high",
        category: "assignment",
        status: "in-progress",
        subject: "Physics",
        dueDate: addDays(todayStart, 2),
        order: 3,
      },
      {
        userId,
        title: "Study for English mid-term essay",
        description: "Review themes in Victorian literature",
        priority: "medium",
        category: "exam",
        status: "in-progress",
        subject: "English Literature",
        dueDate: addDays(todayStart, 4),
        order: 4,
      },
      {
        userId,
        title: "Implement sorting algorithm project",
        description: "Compare quicksort, mergesort, and heapsort performance",
        priority: "high",
        category: "assignment",
        status: "in-progress",
        subject: "Computer Science",
        dueDate: addDays(todayStart, 6),
        order: 5,
      },
      {
        userId,
        title: "Review organic chemistry reactions",
        description: "Focus on substitution and elimination mechanisms",
        priority: "medium",
        category: "revision",
        status: "in-progress",
        subject: "Chemistry",
        dueDate: addDays(todayStart, 3),
        order: 6,
      },
      // 3 × status "completed"
      {
        userId,
        title: "Finish linear algebra homework",
        description: "Eigenvalues and eigenvectors worksheet",
        priority: "medium",
        category: "assignment",
        status: "completed",
        subject: "Mathematics",
        dueDate: subDays(todayStart, 1),
        order: 7,
      },
      {
        userId,
        title: "Read Hamlet Act III",
        description: "Analyze the soliloquy and dramatic structure",
        priority: "low",
        category: "study",
        status: "completed",
        subject: "English Literature",
        dueDate: subDays(todayStart, 2),
        order: 8,
      },
      {
        userId,
        title: "Complete physics problem set 4",
        description: "Thermodynamics problems on entropy",
        priority: "high",
        category: "assignment",
        status: "completed",
        subject: "Physics",
        dueDate: subDays(todayStart, 3),
        order: 9,
      },
    ],
  });

  // ── 4. Create demo events ──────────────────────────────────────────────────
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

  await db.event.createMany({
    data: [
      {
        userId,
        title: "Math Study Group",
        date: setMinutes(setHours(addDays(weekStart, 1), 14), 0), // Tue 2pm
        time: "14:00",
        description: "Weekly study group for calculus review",
        color: "violet",
      },
      {
        userId,
        title: "CS Office Hours",
        date: setMinutes(setHours(addDays(weekStart, 2), 10), 30), // Wed 10:30am
        time: "10:30",
        description: "Discuss project requirements with Prof. Johnson",
        color: "blue",
      },
      {
        userId,
        title: "Physics Lab Session",
        date: setMinutes(setHours(addDays(weekStart, 3), 13), 0), // Thu 1pm
        time: "13:00",
        description: "Electromagnetism lab — bring lab notebook",
        color: "green",
      },
      {
        userId,
        title: "English Literature Seminar",
        date: setMinutes(setHours(addDays(weekStart, 8), 11), 0), // Next Mon 11am
        time: "11:00",
        description: "Group discussion on Romantic poetry",
        color: "amber",
      },
      {
        userId,
        title: "Chemistry Exam Review",
        date: setMinutes(setHours(addDays(weekStart, 12), 15), 0), // Next Fri 3pm
        time: "15:00",
        description: "Final review session before the midterm",
        color: "rose",
      },
    ],
  });

  // ── 5. Create demo exams ───────────────────────────────────────────────────
  await db.exam.createMany({
    data: [
      {
        userId,
        subject: "Mathematics",
        examName: "Midterm Calculus",
        date: addDays(todayStart, 14),
        time: "09:00",
        location: "Hall B-201",
        priority: "high",
        progress: 30,
        notes: "Covers Chapters 1-7, focus on integration",
      },
      {
        userId,
        subject: "Computer Science",
        examName: "Data Structures Final",
        date: addDays(todayStart, 21),
        time: "14:00",
        location: "Lab C-105",
        priority: "high",
        progress: 55,
        notes: "Open book, review all tree algorithms",
      },
      {
        userId,
        subject: "Physics",
        examName: "Physics Lab Practical",
        date: addDays(todayStart, 10),
        time: "10:00",
        location: "Physics Lab A",
        priority: "medium",
        progress: 75,
        notes: "Hands-on experiment, bring calculator",
      },
      {
        userId,
        subject: "English Literature",
        examName: "English Essay Deadline",
        date: addDays(todayStart, 28),
        time: "23:59",
        location: "Online submission",
        priority: "medium",
        progress: 90,
        notes: "3000-word essay on Victorian literature themes",
      },
    ],
  });

  // ── 6. Create demo focus sessions (14 across last 7 days) ──────────────────
  const focusSessionData: {
    userId: string;
    duration: number;
    date: Date;
    completed: boolean;
    type: string;
    subject: string;
  }[] = [];

  // Day -6 (7 days ago)
  focusSessionData.push({
    userId,
    duration: 45,
    date: subDays(now, 6),
    completed: true,
    type: "focus",
    subject: "Mathematics",
  });
  focusSessionData.push({
    userId,
    duration: 30,
    date: subDays(now, 6),
    completed: true,
    type: "focus",
    subject: "Computer Science",
  });

  // Day -5
  focusSessionData.push({
    userId,
    duration: 60,
    date: subDays(now, 5),
    completed: true,
    type: "focus",
    subject: "Physics",
  });

  // Day -4
  focusSessionData.push({
    userId,
    duration: 25,
    date: subDays(now, 4),
    completed: true,
    type: "focus",
    subject: "English Literature",
  });
  focusSessionData.push({
    userId,
    duration: 15,
    date: subDays(now, 4),
    completed: true,
    type: "break",
    subject: "",
  });

  // Day -3
  focusSessionData.push({
    userId,
    duration: 50,
    date: subDays(now, 3),
    completed: true,
    type: "focus",
    subject: "Chemistry",
  });
  focusSessionData.push({
    userId,
    duration: 35,
    date: subDays(now, 3),
    completed: true,
    type: "focus",
    subject: "Mathematics",
  });

  // Day -2
  focusSessionData.push({
    userId,
    duration: 40,
    date: subDays(now, 2),
    completed: true,
    type: "focus",
    subject: "Computer Science",
  });

  // Day -1 (yesterday)
  focusSessionData.push({
    userId,
    duration: 55,
    date: subDays(now, 1),
    completed: true,
    type: "focus",
    subject: "Physics",
  });
  focusSessionData.push({
    userId,
    duration: 20,
    date: subDays(now, 1),
    completed: true,
    type: "break",
    subject: "",
  });
  focusSessionData.push({
    userId,
    duration: 30,
    date: subDays(now, 1),
    completed: true,
    type: "focus",
    subject: "English Literature",
  });

  // Day 0 (today)
  focusSessionData.push({
    userId,
    duration: 45,
    date: now,
    completed: true,
    type: "focus",
    subject: "Mathematics",
  });
  focusSessionData.push({
    userId,
    duration: 25,
    date: now,
    completed: true,
    type: "focus",
    subject: "Computer Science",
  });

  await db.focusSession.createMany({ data: focusSessionData });

  // ── 7. Create demo profile ─────────────────────────────────────────────────
  await db.profile.create({
    data: {
      userId,
      bio: "Computer Science major passionate about learning",
      goal: "Maintain a 3.8 GPA and stay ahead of deadlines",
      targetHours: 6,
      college: "State University",
      course: "B.S. Computer Science",
      semester: 4,
      avatar: "",
      studyStreak: 7,
    },
  });

  return NextResponse.json(
    { success: true, message: "Demo data seeded successfully" },
    { status: 201 },
  );
}
