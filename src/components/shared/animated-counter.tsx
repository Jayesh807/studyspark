"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

interface CounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);
  const animatedRef = useRef(false);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  // Animate when in view (or fallback after 2s)
  useEffect(() => {
    if (inView && !animatedRef.current) {
      animatedRef.current = true;
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  // Fallback: if IntersectionObserver hasn't fired after 2s, animate anyway
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!animatedRef.current) {
        animatedRef.current = true;
        motionValue.set(value);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [value, motionValue]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplay(latest);
    });
  }, [spring]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: inView || display > 0 ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
  );
}
