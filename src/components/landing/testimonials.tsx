"use client";

import { useCallback, useRef, useState } from "react";
import { m } from "framer-motion";
import { Star, Quote } from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { SectionHeading } from "./section-heading";

function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ rotateX: -y * 10, rotateY: x * 10 });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <m.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={["glass rounded-3xl", className].filter(Boolean).join(" ")}
    >
      {children}
    </m.div>
  );
}

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  gradient: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maya Chen",
    role: "Computer Science · Stanford",
    initials: "MC",
    gradient: "from-violet-500 to-purple-500",
    quote:
      "I used to keep tasks in Notion, calendar in Google, and timer on my phone. StudySpark replaced all three — and it actually feels calm to open. The analytics view is what really hooked me. Being able to see exactly how many hours I spent on each subject per week completely changed how I prepare for exams.",
  },
  {
    name: "Diego Ramirez",
    role: "Medical Student · UNAM",
    initials: "DR",
    gradient: "from-fuchsia-500 to-pink-500",
    quote:
      "Med school is brutal with scheduling. I have anatomy labs, clinical rotations, and boards prep all at once. StudySpark's exam tracker with countdowns made my preparation feel measurable instead of overwhelming. I can actually see my progress building week by week instead of panicking the night before.",
  },
  {
    name: "Aisha Okafor",
    role: "Physics · ETH Zürich",
    initials: "AO",
    gradient: "from-rose-500 to-orange-500",
    quote:
      "Beautiful, fast, and genuinely free. The Pomodoro timer with subject tagging is genius — I finally know whether I'm actually spending balanced time across my courses or just focusing on the ones I enjoy. The study radio is a lovely bonus that keeps me focused during late-night problem sets.",
  },
  {
    name: "Liam O'Brien",
    role: "Law Student · Trinity College Dublin",
    initials: "LO",
    gradient: "from-emerald-500 to-teal-500",
    quote:
      "As a law student, I have hundreds of pages of readings every week. Breaking them into daily tasks with priorities was a game-changer. StudySpark helped me go from feeling constantly behind to actually being ahead of my reading schedule. The weekly planning view is exactly what I needed.",
  },
  {
    name: "Priya Sharma",
    role: "Engineering · IIT Delhi",
    initials: "PS",
    gradient: "from-amber-500 to-orange-500",
    quote:
      "The CGPA calculator alone saves me time every semester, but it's the focus timer and analytics combo that really makes StudySpark indispensable. I can see exactly which subjects are getting neglected and adjust before it's too late. It's like having a study coach in your browser.",
  },
  {
    name: "Sarah Kim",
    role: "Biology · University of Toronto",
    initials: "SK",
    gradient: "from-cyan-500 to-blue-500",
    quote:
      "I've tried every productivity app out there — Todoist, Forest, Motion, Google Calendar. Nothing was built for the way students actually work until StudySpark. The fact that my tasks, calendar, exams, and focus sessions are all in one place means I actually use it consistently instead of giving up after a week.",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Testimonials"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Testimonials"
          title="What Students Are"
          highlight="Saying About StudySpark"
          description="Students from universities around the world use StudySpark every day. Here's what they have to say about organizing their studies."
        />

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name} className="h-full">
              <TiltCard className="relative flex h-full flex-col gap-5 p-6 sm:p-7">
                <Quote className="size-8 text-violet-500/30" />
                <p className="flex-1 text-pretty text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 border-t border-violet-500/10 pt-4">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white shadow-md`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
