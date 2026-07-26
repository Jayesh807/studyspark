"use client";

import { useState } from "react";
import { Calendar, Sparkles, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/shared/motion";

export function AgeCalculatorClient() {
  const [birthDate, setBirthDate] = useState<string>("2004-05-15");
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const calculateAge = () => {
    if (!birthDate) return { years: 0, months: 0, days: 0, totalDays: 0, totalHours: 0 };
    const birth = new Date(birthDate);
    const target = new Date(targetDate || new Date());

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) {
      return { years: 0, months: 0, days: 0, totalDays: 0, totalHours: 0 };
    }

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const diffTime = Math.max(0, target.getTime() - birth.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalHours = totalDays * 24;

    return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days), totalDays, totalHours };
  };

  const result = calculateAge();

  return (
    <GlassCard className="p-6 sm:p-8 border-violet-500/15 shadow-2xl">
      <div className="flex items-center gap-2 font-bold text-lg text-foreground border-b border-border/40 pb-4 mb-6">
        <Calendar className="size-5 text-violet-500" />
        Calculate Exact Chronological Age
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Date of Birth
          </label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-11 bg-background/50 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Age at Target Date (Defaults to Today)
          </label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-11 bg-background/50 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Main Result Display */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-purple-500/15 p-6 border border-violet-500/20 text-center">
        <div className="flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          <Sparkles className="size-4" /> Calculated Age
        </div>
        <div className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          {result.years} <span className="text-lg font-medium text-muted-foreground">years,</span> {result.months} <span className="text-lg font-medium text-muted-foreground">months,</span> {result.days} <span className="text-lg font-medium text-muted-foreground">days</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-violet-500/15 pt-4 text-xs">
          <div>
            <p className="text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="size-3.5" /> Total Days
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">{result.totalDays.toLocaleString()} days</p>
          </div>
          <div>
            <p className="text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="size-3.5" /> Total Hours
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">{result.totalHours.toLocaleString()} hours</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
