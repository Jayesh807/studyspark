"use client";

import { useState } from "react";
import { Percent, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/shared/motion";

export function PercentageCalculatorClient() {
  // Mode 1: What is X% of Y?
  const [percX, setPercX] = useState<string>("15");
  const [ofY, setOfY] = useState<string>("200");

  // Mode 2: X is what % of Y? (Marks Calculator)
  const [marksObtained, setMarksObtained] = useState<string>("85");
  const [totalMarks, setTotalMarks] = useState<string>("100");

  // Mode 3: Percentage Change (Old to New)
  const [oldVal, setOldVal] = useState<string>("60");
  const [newVal, setNewVal] = useState<string>("75");

  // Mode 1 Calculation
  const val1Num = (parseFloat(percX) || 0) * (parseFloat(ofY) || 0) / 100;

  // Mode 2 Calculation
  const val2Num = (parseFloat(totalMarks) || 0) > 0 ? ((parseFloat(marksObtained) || 0) / (parseFloat(totalMarks) || 1)) * 100 : 0;

  // Mode 3 Calculation
  const oldN = parseFloat(oldVal) || 0;
  const newN = parseFloat(newVal) || 0;
  const val3Num = oldN > 0 ? ((newN - oldN) / oldN) * 100 : 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Mode 2: Marks / Score Percentage */}
      <GlassCard className="p-6 flex flex-col justify-between border-violet-500/15 shadow-xl md:col-span-3 lg:col-span-1">
        <div>
          <div className="flex items-center gap-2 font-bold text-base text-foreground mb-4">
            <Percent className="size-4 text-violet-500" />
            Exam Mark Percentage
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Calculate your exam grade percentage from obtained marks and total marks.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Marks Obtained</label>
              <Input
                type="number"
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                placeholder="e.g. 85"
                className="h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Total Maximum Marks</label>
              <Input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="e.g. 100"
                className="h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-500/15 p-4 text-center border border-violet-500/20">
          <p className="text-xs text-violet-600 dark:text-violet-300 font-semibold uppercase tracking-wider">Score Percentage</p>
          <p className="text-3xl font-extrabold mt-1">{val2Num.toFixed(1)}%</p>
        </div>
      </GlassCard>

      {/* Mode 1: What is X% of Y? */}
      <GlassCard className="p-6 flex flex-col justify-between border-violet-500/15 shadow-xl md:col-span-3 lg:col-span-1">
        <div>
          <div className="flex items-center gap-2 font-bold text-base text-foreground mb-4">
            <Sparkles className="size-4 text-fuchsia-500" />
            What is X% of Y?
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Calculate exact percentage values for assignments, weightings, or discounts.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Percentage (%)</label>
              <Input
                type="number"
                value={percX}
                onChange={(e) => setPercX(e.target.value)}
                placeholder="e.g. 15"
                className="h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Total Amount (Y)</label>
              <Input
                type="number"
                value={ofY}
                onChange={(e) => setOfY(e.target.value)}
                placeholder="e.g. 200"
                className="h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-pink-500/15 p-4 text-center border border-fuchsia-500/20">
          <p className="text-xs text-fuchsia-600 dark:text-fuchsia-300 font-semibold uppercase tracking-wider">Calculated Value</p>
          <p className="text-3xl font-extrabold mt-1">{val1Num.toFixed(2)}</p>
        </div>
      </GlassCard>

      {/* Mode 3: Percentage Change */}
      <GlassCard className="p-6 flex flex-col justify-between border-violet-500/15 shadow-xl md:col-span-3 lg:col-span-1">
        <div>
          <div className="flex items-center gap-2 font-bold text-base text-foreground mb-4">
            <RefreshCw className="size-4 text-emerald-500" />
            Percentage Change
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Calculate the percentage increase or decrease between two scores.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Original Score (Old)</label>
              <Input
                type="number"
                value={oldVal}
                onChange={(e) => setOldVal(e.target.value)}
                placeholder="e.g. 60"
                className="h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">New Score (New)</label>
              <Input
                type="number"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                placeholder="e.g. 75"
                className="h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 p-4 text-center border border-emerald-500/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold uppercase tracking-wider">Change</p>
          <p className="text-3xl font-extrabold mt-1">
            {val3Num > 0 ? `+${val3Num.toFixed(1)}%` : `${val3Num.toFixed(1)}%`}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
