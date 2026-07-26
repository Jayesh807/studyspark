"use client";

import { m } from "framer-motion";
import {
  Timer,
  CalendarDays,
  BarChart3,
  ListTodo,
  Brain,
  Target,
  Coffee,
  Repeat,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { GlassCard } from "@/components/shared/motion";

const TIPS = [
  {
    icon: Timer,
    title: "Use the Pomodoro Technique to Build Focus",
    content:
      "The Pomodoro Technique, developed by Francesco Cirillo in the late 1980s, breaks study sessions into focused 25-minute blocks followed by 5-minute breaks. After four cycles, you take a longer 15–30 minute break. Research published in the journal Cognition shows that brief diversions from a task dramatically improve focus for prolonged periods. The structured intervals prevent mental fatigue and create a sense of urgency that keeps procrastination at bay. Start with one Pomodoro session and build from there — even two focused 25-minute blocks are more productive than three hours of distracted studying.",
    feature:
      "StudySpark's built-in Pomodoro timer lets you start a session with one click, tag it to a subject, and automatically log your focused hours.",
  },
  {
    icon: CalendarDays,
    title: "Plan Your Week Every Sunday Evening",
    content:
      "The most productive students share one habit: they plan their upcoming week before it starts. Spend fifteen to twenty minutes every Sunday evening reviewing your upcoming deadlines, scheduling study blocks, and identifying your top three priorities for the week. Research from the Dominican University of California found that people who write down their goals are 42% more likely to achieve them. Weekly planning transforms vague intentions into concrete commitments — and gives you a clear roadmap to follow when Monday morning arrives.",
    feature:
      "StudySpark's calendar and task planner make weekly planning fast. Add tasks, drag them onto your calendar, and see your entire week at a glance.",
  },
  {
    icon: BarChart3,
    title: "Track Your Study Hours to Find Hidden Patterns",
    content:
      "Most students dramatically overestimate how much time they spend studying. A study from the Bureau of Labor Statistics found that the average college student spends only about 3.5 hours per day on educational activities — significantly less than most students believe. By tracking your actual study hours, you discover patterns you'd otherwise miss: which subjects get neglected, which days are most productive, and whether your effort matches your goals. The simple act of measurement creates accountability and drives improvement without any extra willpower.",
    feature:
      "StudySpark's analytics dashboard automatically tracks every focus session and displays weekly heatmaps, subject breakdowns, and trend charts.",
  },
  {
    icon: ListTodo,
    title: "Break Big Assignments Into Small, Actionable Tasks",
    content:
      "A 10-page research paper isn't one task — it's at least eight: choose a topic, find sources, create an outline, write the introduction, draft body sections, write the conclusion, edit, and format citations. Psychologists call the tendency to avoid large tasks 'task paralysis,' and the most effective solution is breaking them into steps small enough that each one feels easy to start. When every task on your list can be completed in under an hour, starting becomes effortless. You build momentum with each checkmark, and the entire project moves forward steadily.",
    feature:
      "StudySpark lets you create tasks with priorities, categories, and due dates. Check off items as you go and watch your completion rate climb in your analytics.",
  },
  {
    icon: Brain,
    title: "Use Active Recall Instead of Re-Reading Notes",
    content:
      "Re-reading textbooks and highlighting notes feels productive, but cognitive science consistently shows it's one of the least effective study methods. Active recall — testing yourself on material without looking at your notes — is proven to be far more effective for long-term retention. A landmark study by Karpicke and Blunt (2011) in the journal Science found that students who practiced retrieval produced 50% more correct responses on a final test compared to those who used elaborative study techniques. Try closing your notes and writing down everything you can remember, then check what you missed.",
    feature:
      "Use StudySpark's task planner to schedule active recall sessions for each subject and track which topics need more review.",
  },
  {
    icon: Target,
    title: "Set Specific Study Goals, Not Vague Intentions",
    content:
      "There's a significant difference between 'study chemistry' and 'complete practice problems 1–15 from chapter 4 and review incorrect answers.' Specific, measurable goals give you a clear finish line for each study session. Edwin Locke's goal-setting theory, supported by over a thousand studies, demonstrates that specific and challenging goals lead to higher performance than easy or vague goals. Before each study session, write down exactly what you plan to accomplish. When you finish, you'll know whether you succeeded — and that certainty builds confidence over time.",
    feature:
      "StudySpark's task system supports detailed descriptions and priorities so you can define exactly what success looks like for each study session.",
  },
  {
    icon: Coffee,
    title: "Study at Your Peak Energy Times",
    content:
      "Not all study hours are created equal. Your circadian rhythm creates natural peaks and valleys of alertness throughout the day. Most people experience peak cognitive performance in the late morning (around 10 AM) and again in the late afternoon (around 4 PM), with a dip after lunch. Schedule your hardest subjects — the ones requiring deep thinking, problem-solving, or creative work — during your peak hours. Save administrative tasks like organizing notes, formatting papers, or reviewing flashcards for your lower-energy periods. Working with your biology rather than against it dramatically improves the quality of each study hour.",
    feature:
      "StudySpark's analytics reveal your most productive days and times, helping you optimize when you schedule your most demanding study sessions.",
  },
  {
    icon: Repeat,
    title: "Review Material at Spaced Intervals for Long-Term Retention",
    content:
      "Hermann Ebbinghaus discovered the 'forgetting curve' in 1885, showing that we forget approximately 70% of new information within 24 hours if we don't review it. Spaced repetition — reviewing material at increasing intervals (after 1 day, then 3 days, then 7 days, then 14 days) — counteracts this curve and moves information from short-term to long-term memory. Instead of cramming everything the night before an exam, spread your review sessions across weeks. Each review takes less time than the last, and by exam day, the material is solidly committed to memory.",
    feature:
      "Use StudySpark's calendar to schedule spaced review sessions for each subject, and track your study hours to ensure consistent coverage.",
  },
];

export function ProductivityTips() {
  return (
    <section
      id="productivity-tips"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Student productivity tips"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Study Smarter"
          title="Student Productivity Tips —"
          highlight="Study Smarter, Not Harder"
          description="Evidence-based strategies backed by cognitive science to help you make the most of every study session. These techniques work whether you're a freshman or a graduate student."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {TIPS.map((tip, i) => (
            <m.div
              key={tip.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
                delay: (i % 2) * 0.08,
              }}
            >
              <GlassCard className="h-full overflow-hidden p-5 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                      <tip.icon className="size-5" />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight leading-snug sm:text-lg">
                      {tip.title}
                    </h3>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tip.content}
                  </p>

                  <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-3.5 py-2.5">
                    <p className="text-xs leading-relaxed text-violet-700 dark:text-violet-300">
                      <span className="font-semibold">💡 With StudySpark:</span>{" "}
                      {tip.feature}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
