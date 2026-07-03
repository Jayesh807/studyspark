"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { SectionHeading } from "./section-heading";

/* -------------------------------------------------------------------------- */
/*  3D Tilt Card — applies perspective transform on hover                      */
/* -------------------------------------------------------------------------- */

function TiltCard({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hover || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ rotateX: -y * 10, rotateY: x * 10 });
    },
    [hover]
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        y: hover ? -4 : 0,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={["glass rounded-3xl", className].filter(Boolean).join(" ")}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Testimonials data + component                                              */
/* -------------------------------------------------------------------------- */

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
    role: "CS Student · Stanford",
    initials: "MC",
    gradient: "from-violet-500 to-purple-500",
    quote:
      "I used to keep tasks in Notion, calendar in Google, and timer on my phone. StudySpark replaced all three — and it actually feels calm to open.",
  },
  {
    name: "Diego Ramirez",
    role: "Med Student · UNAM",
    initials: "DR",
    gradient: "from-fuchsia-500 to-pink-500",
    quote:
      "The analytics view is the reason I stay. Seeing my focus hours charted across weeks finally made exam prep feel measurable instead of overwhelming.",
  },
  {
    name: "Aisha Okafor",
    role: "Physics · ETH Zürich",
    initials: "AO",
    gradient: "from-rose-500 to-orange-500",
    quote:
      "Beautiful, fast, free. The exam tracker with countdowns is genuinely useful — I always know what's coming and how ready I am. Nothing else I tried came close.",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative scroll-mt-24 px-4 py-20 sm:py-28"
      aria-label="Testimonials"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by students"
          highlight="everywhere"
          description="Thousands of students use StudySpark every day. Here's what a few of them have to say."
        />

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name} className="h-full">
              <TiltCard hover className="relative flex h-full flex-col gap-5 p-6 sm:p-7">
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
