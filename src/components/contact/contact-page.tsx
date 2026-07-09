"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  LifeBuoy,
  Mail,
  MessageSquareText,
  Send,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/landing/navbar";
import { SectionHeading } from "@/components/landing/section-heading";
import { AnimatedBlobs } from "@/components/shared/animated-blobs";
import {
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CONTACT_CARDS: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  gradient: string;
}[] = [
  {
    icon: Mail,
    title: "Email Support",
    description:
      "Get help with your account, study workspace, billing questions or general product guidance.",
    href: "mailto:support@studysparks.cloud",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: BriefcaseBusiness,
    title: "Business Inquiries",
    description:
      "Talk to us about partnerships, education programs, campus rollouts or media opportunities.",
    href: "mailto:business@studysparks.cloud",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Wrench,
    title: "Technical Support",
    description:
      "Report bugs, performance issues or anything that gets in the way of a smooth study session.",
    href: "mailto:tech@studysparks.cloud",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const FAQS = [
  {
    question: "Is StudySpark free?",
    answer:
      "Yes. StudySpark is free to start, with tools for tasks, exams, calendars, focus sessions and study analytics in one student workspace.",
  },
  {
    question: "How can I reset my password?",
    answer:
      "Use the forgot password option on the login screen when available, or contact support with your username so we can help you recover access.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Send us a message through this page or email support@studysparks.cloud with a short description of what you need help with.",
  },
];

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Features", href: "/#features" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Login", href: "/login" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function ContactPage() {
  const router = useRouter();
  const setView = useAppStore((s) => s.setView);

  const startSignup = () => {
    setView("signup");
    router.push("/signup");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Thanks for reaching out. We will get back to you soon.");
    event.currentTarget.reset();
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />
      <main>
        <section className="relative px-4 pb-16 pt-32 sm:pb-24 sm:pt-40">
          <AnimatedBlobs variant="landing" />
          <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-gradient-to-b from-violet-500/15 via-fuchsia-500/10 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.55 0.21 277) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.21 277) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.08 },
              },
            }}
            className="mx-auto max-w-6xl"
          >
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300"
              >
                <MessageSquareText className="size-3.5" />
                Contact
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-6 text-balance text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Contact <span className="text-gradient">StudySpark</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                We&apos;re here to help. Whether you have a question, feedback,
                or a business inquiry, we&apos;d love to hear from you.
              </motion.p>
            </div>

            <StaggerContainer className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {CONTACT_CARDS.map((card) => (
                <StaggerItem key={card.title}>
                  <ContactCard {...card} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.div>
        </section>

        <section className="relative px-4 py-16 sm:py-24" aria-labelledby="contact-form-title">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow="Send a message"
                title="Tell us what you"
                highlight="need help with"
                description="Share a little context and the StudySpark team will route your message to the right place."
                align="left"
              />

              <GlassCard className="mt-8 p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
                    <LifeBuoy className="size-6" />
                  </div>
                  <div>
                    <h2 id="contact-form-title" className="text-lg font-semibold tracking-tight">
                      Support hours
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      We review messages regularly and prioritize anything that
                      blocks a student from planning, focusing or accessing an
                      account.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassCard className="relative overflow-hidden p-6 sm:p-8">
                <form className="relative space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full Name" htmlFor="full-name">
                      <Input
                        id="full-name"
                        name="fullName"
                        autoComplete="name"
                        placeholder="Your name"
                        required
                        className="h-12 rounded-xl bg-background/70 px-4"
                      />
                    </Field>
                    <Field label="Email Address" htmlFor="email">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        className="h-12 rounded-xl bg-background/70 px-4"
                      />
                    </Field>
                  </div>

                  <Field label="Subject" htmlFor="subject">
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help?"
                      required
                      className="h-12 rounded-xl bg-background/70 px-4"
                    />
                  </Field>

                  <Field label="Message" htmlFor="message">
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us a little more..."
                      required
                      minLength={10}
                      className="min-h-36 resize-y rounded-xl bg-background/70 px-4 py-3"
                    />
                  </Field>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/45 hover:brightness-110 sm:w-auto"
                  >
                    Send Message
                    <Send className="size-4" />
                  </Button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        <section className="relative px-4 py-16 sm:py-24" aria-labelledby="faq-title">
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              eyebrow="FAQ"
              title="Quick answers before"
              highlight="you reach out"
              description="A few common questions students ask when getting started with StudySpark."
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10"
            >
              <GlassCard className="p-4 sm:p-6">
                <Accordion type="single" collapsible className="w-full">
                  {FAQS.map((faq, index) => (
                    <AccordionItem
                      key={faq.question}
                      value={`faq-${index}`}
                      className="border-violet-500/10"
                    >
                      <AccordionTrigger className="rounded-xl px-2 text-base font-semibold hover:no-underline sm:px-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-2 text-sm leading-relaxed text-muted-foreground sm:px-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        <section className="relative px-4 py-20 sm:py-28" aria-label="Call to action">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
              <motion.div
                animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-20 -top-20 size-72 rounded-full bg-white/20 blur-3xl"
              />
              <motion.div
                animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-20 -right-20 size-80 rounded-full bg-fuchsia-300/30 blur-3xl"
              />
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-12 sm:py-20">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  <Sparkles className="size-3.5" />
                  Study calmer today
                </span>
                <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                  Ready to organize your studies?
                </h2>
                <p className="max-w-xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
                  Create your workspace, plan your week and bring every task,
                  exam and focus session into one calm dashboard.
                </p>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Button
                    size="lg"
                    onClick={startSignup}
                    className="h-12 rounded-xl bg-white px-7 text-base font-semibold text-violet-700 shadow-xl shadow-black/10 transition-all hover:scale-[1.03] hover:bg-white hover:shadow-2xl"
                  >
                    Get Started
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-xl border border-white/30 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-white/20"
                  >
                    <Link href="/">
                      <ArrowLeft className="size-4" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-violet-500/10 bg-background/60 px-4 py-8 backdrop-blur-xl">
        <nav
          aria-label="Contact footer"
          className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row"
        >
          <p className="text-sm text-muted-foreground">
            Study<span className="text-gradient font-semibold">Spark</span>
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </footer>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  description,
  href,
  gradient,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <GlassCard hover className="group relative h-full overflow-hidden p-6 sm:p-7">
      <div className="relative flex h-full flex-col">
        <motion.div
          whileHover={{ rotate: -6, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 350, damping: 15 }}
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            gradient
          )}
        >
          <Icon className="size-6" strokeWidth={2.2} />
        </motion.div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
        >
          Contact us
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </GlassCard>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
