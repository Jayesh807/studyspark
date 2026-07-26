"use client";

import { useState } from "react";
import { Plus, Trash2, RefreshCw, Calculator, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/shared/motion";

interface CourseRow {
  id: string;
  name: string;
  grade: number; // 4.0 scale
  credits: number;
}

const GRADE_OPTIONS = [
  { label: "A / A+ (4.0)", value: 4.0 },
  { label: "A- (3.7)", value: 3.7 },
  { label: "B+ (3.3)", value: 3.3 },
  { label: "B (3.0)", value: 3.0 },
  { label: "B- (2.7)", value: 2.7 },
  { label: "C+ (2.3)", value: 2.3 },
  { label: "C (2.0)", value: 2.0 },
  { label: "C- (1.7)", value: 1.7 },
  { label: "D+ (1.3)", value: 1.3 },
  { label: "D (1.0)", value: 1.0 },
  { label: "F (0.0)", value: 0.0 },
];

export function CgpaCalculatorClient() {
  const [scale, setScale] = useState<"4" | "10">("4");
  const [courses, setCourses] = useState<CourseRow[]>([
    { id: "1", name: "Course 1", grade: 4.0, credits: 3 },
    { id: "2", name: "Course 2", grade: 3.7, credits: 3 },
    { id: "3", name: "Course 3", grade: 3.3, credits: 4 },
  ]);

  const addCourse = () => {
    setCourses((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `Course ${prev.length + 1}`,
        grade: 4.0,
        credits: 3,
      },
    ]);
  };

  const removeCourse = (id: string) => {
    if (courses.length <= 1) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof CourseRow, value: string | number) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const resetAll = () => {
    setCourses([
      { id: "1", name: "Course 1", grade: 4.0, credits: 3 },
      { id: "2", name: "Course 2", grade: 3.7, credits: 3 },
      { id: "3", name: "Course 3", grade: 3.3, credits: 4 },
    ]);
  };

  // Calculations
  const totalCredits = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
  const totalPoints = courses.reduce((acc, c) => acc + c.grade * (Number(c.credits) || 0), 0);
  const rawGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  // Scale adjustment if 10.0 scale selected
  const displayedGpa = scale === "10" ? (rawGpa * 2.5).toFixed(2) : rawGpa.toFixed(2);
  const percentageApprox = scale === "10" ? (Number(displayedGpa) * 9.5).toFixed(1) : (rawGpa * 25).toFixed(1);

  return (
    <GlassCard className="p-6 sm:p-8 overflow-hidden shadow-2xl border-violet-500/15">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="size-5 text-violet-500" />
            Interactive Grade Point Calculator
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Add your subjects, credit weightings, and grades to view your CGPA instantly.
          </p>
        </div>

        {/* Scale Toggle */}
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-1 border border-border/40 text-xs font-semibold">
          <button
            onClick={() => setScale("4")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              scale === "4" ? "bg-violet-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            4.0 Scale
          </button>
          <button
            onClick={() => setScale("10")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              scale === "10" ? "bg-violet-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            10.0 Scale
          </button>
        </div>
      </div>

      {/* Course List */}
      <div className="mt-6 space-y-3">
        <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          <span className="col-span-5">Course / Subject Name</span>
          <span className="col-span-4">Grade Achieved</span>
          <span className="col-span-2">Credits</span>
          <span className="col-span-1 text-center">Action</span>
        </div>

        {courses.map((course, idx) => (
          <div
            key={course.id}
            className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-center rounded-2xl bg-muted/20 p-3 border border-border/30 hover:border-violet-500/20 transition-all"
          >
            <div className="w-full sm:col-span-5">
              <Input
                value={course.name}
                onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                placeholder={`Course ${idx + 1}`}
                className="h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
            <div className="w-full sm:col-span-4">
              <Select
                value={course.grade.toString()}
                onValueChange={(val) => updateCourse(course.id, "grade", parseFloat(val))}
              >
                <SelectTrigger className="h-10 text-sm bg-background/50 rounded-xl">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g.label} value={g.value.toString()}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:col-span-2">
              <Input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={course.credits}
                onChange={(e) => updateCourse(course.id, "credits", parseFloat(e.target.value) || 0)}
                placeholder="Credits"
                className="h-10 text-sm bg-background/50 rounded-xl text-center"
              />
            </div>
            <div className="w-full sm:col-span-1 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCourse(course.id)}
                disabled={courses.length <= 1}
                className="h-9 w-9 text-muted-foreground hover:text-rose-500 rounded-xl"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={addCourse}
          className="rounded-xl border-dashed border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
        >
          <Plus className="size-4 mr-1.5" /> Add Course
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetAll}
          className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
        >
          <RefreshCw className="size-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Result Display Card */}
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-purple-500/15 p-6 border border-violet-500/20 text-center">
        <div className="flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          <Sparkles className="size-4" /> Calculated Result
        </div>
        <div className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {displayedGpa} <span className="text-base font-normal text-muted-foreground">/ {scale === "10" ? "10.0" : "4.0"}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs border-t border-violet-500/15 pt-4">
          <div>
            <p className="text-muted-foreground">Total Credits</p>
            <p className="text-base font-bold text-foreground mt-0.5">{totalCredits}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Approx. Percentage</p>
            <p className="text-base font-bold text-foreground mt-0.5">{percentageApprox}%</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
