"use client";
// Updated TextToPdfPanel: Cleaned layout to exactly match centered DoubtPanel styling

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Download,
  FileCode,
  FileText,
  Flag,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquareText,
  PartyPopper,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  Upload,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { apiFetch, handleError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { GlassCard, PageTransition, StaggerContainer, StaggerItem } from "@/components/shared/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { GeneratedResume, ResumeMakerInput } from "@/lib/resume/schema";

interface StudyDocument {
  id: string;
  fileName: string;
  pageCount: number;
  chunkCount: number;
  doubtCount: number;
  extractionSource?: "pdf-text" | "gemini-ocr";
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface ChatMessage {
  id: string;
  role: "student" | "assistant";
  text: string;
  found?: boolean;
  sources?: Array<{ pageNumber: number; score: number }>;
}

type StudyTool = "quiz" | "doubt" | "textToPdf" | "resume";
type ViewMode = "hub" | "quiz" | "doubt" | "textToPdf" | "resume";

function SubPageHeader({
  activeTool,
  document,
  quizCount,
  onCountChange,
  onBack,
  onSelectTool,
  uploading,
  onUpload,
  onDownloadQuiz,
  hasQuestions,
}: {
  activeTool: StudyTool;
  document: StudyDocument | null;
  quizCount?: 5 | 10;
  onCountChange?: (count: 5 | 10) => void;
  onBack: () => void;
  onSelectTool: (tool: StudyTool) => void;
  uploading?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onDownloadQuiz?: () => void;
  hasQuestions?: boolean;
}) {
  const headerFileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 w-full p-3 sm:p-4">
      {/* Hidden file input for header Change PDF button */}
      {onUpload && (
        <input
          type="file"
          ref={headerFileInputRef}
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
            e.target.value = "";
          }}
        />
      )}

      {/* Top row: Back button & Document / Active tool indicator */}
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 shadow-md transition-all shrink-0"
        >
          <ArrowLeft className="mr-1 sm:mr-1.5 h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="hidden sm:inline">Back to Hub</span>
          <span className="inline sm:hidden">Back</span>
        </Button>

        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
          <Badge className="hidden md:inline-flex border-transparent bg-cyan-500/10 text-cyan-400 px-2.5 py-1 font-bold text-xs ring-1 ring-cyan-500/30 shrink-0">
            {activeTool === "quiz" && (
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>AI Exam Simulator</span>
              </span>
            )}
            {activeTool === "doubt" && (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span>Sparks AI Assistant</span>
              </span>
            )}
            {activeTool === "textToPdf" && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Text to PDF Studio</span>
              </span>
            )}
            {activeTool === "resume" && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>AI Resume Maker</span>
              </span>
            )}
          </Badge>

          {uploading ? (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-2.5 sm:px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10 shrink-0"
            >
              <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin shrink-0" />
              <span className="hidden sm:inline">Indexing PDF...</span>
              <span className="inline sm:hidden">Indexing...</span>
            </motion.div>
          ) : document ? (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10 max-w-[150px] sm:max-w-[180px] truncate shrink-0"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{document.fileName}</span>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Bottom row: Mode pills & Right Action Group (5 Qs, 10 Qs, Change PDF, Download Quiz) */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 pt-2 border-t border-white/5 w-full">
        {/* Tool selector tabs with Glassmorphism and Sliding Animation */}
        <div className="flex items-center justify-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 shadow-inner overflow-x-auto scrollbar-none max-w-full mx-auto sm:mx-0">
          {(["quiz", "doubt", "textToPdf", "resume"] as const).map((tool) => {
            const isActive = activeTool === tool;
            let label = "";
            let Icon = BrainCircuit;
            let activeBg = "";

            if (tool === "quiz") {
              label = "Exam Mode";
              Icon = BrainCircuit;
              activeBg = "bg-cyan-500/80";
            } else if (tool === "doubt") {
              label = "Ask Doubts";
              Icon = Sparkles;
              activeBg = "bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80";
            } else if (tool === "textToPdf") {
              label = "Text to PDF";
              Icon = FileText;
              activeBg = "bg-emerald-600/80";
            } else {
              label = "Resume";
              Icon = FileText;
              activeBg = "bg-amber-600/80";
            }

            return (
              <button
                key={tool}
                type="button"
                onClick={() => onSelectTool(tool)}
                className="relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap focus:outline-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeSubTab"
                    className={cn(
                      "absolute inset-0 rounded-full backdrop-blur-sm shadow-sm z-0",
                      activeBg
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors z-10",
                    isActive ? "text-white" : "text-slate-400"
                  )}
                />
                <span
                  className={cn(
                    "transition-colors z-10",
                    isActive
                      ? "text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Group: 5 Qs, 10 Qs, Change PDF, Download Quiz with Glassmorphism */}
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/5 p-1 border border-white/10 shadow-inner text-xs font-semibold shrink-0 mx-auto sm:mx-0 overflow-x-auto max-w-full">
          {/* 5 Qs / 10 Qs buttons with Sliding Animation */}
          {activeTool === "quiz" && onCountChange && quizCount && (
            <>
              {([5, 10] as const).map((num) => {
                const isActive = quizCount === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onCountChange(num)}
                    className="relative h-8 rounded-full px-3 text-xs transition-all whitespace-nowrap flex items-center justify-center font-semibold focus:outline-none"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeQuizCount"
                        className="absolute inset-0 rounded-full bg-cyan-500/80 backdrop-blur-sm shadow-sm z-0"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span
                      className={cn(
                        "z-10 transition-colors",
                        isActive
                          ? "text-white font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {num} Qs
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {/* Change PDF button */}
          {onUpload && activeTool !== "resume" && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => headerFileInputRef.current?.click()}
              className="h-8 rounded-full px-3 text-xs font-semibold transition-all whitespace-nowrap bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center justify-center disabled:opacity-50"
            >
              {uploading ? "Indexing..." : "Change PDF"}
            </button>
          )}

          {/* Download Quiz button */}
          {activeTool === "quiz" && hasQuestions && onDownloadQuiz && (
            <button
              type="button"
              onClick={onDownloadQuiz}
              className="h-8 rounded-full px-3 text-xs font-bold transition-all whitespace-nowrap bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shadow-sm"
            >
              Download Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const LIMITS = [
  { label: "PDF only", value: "5 MB" },
  { label: "Pages", value: "30 max" },
  { label: "Quiz", value: "5 MCQs" },
  { label: "Doubts", value: "10 per PDF" },
  { label: "Text PDF", value: "15,000 chars" },
];

const TOOL_TABS = [
  {
    value: "quiz" as const,
    label: "Exam Mode",
    description: "Take timed practice tests",
    icon: BrainCircuit,
  },
  {
    value: "doubt" as const,
    label: "Ask Doubts",
    description: "Chat with your PDF",
    icon: MessageSquareText,
  },
  {
    value: "textToPdf" as const,
    label: "Text to PDF",
    description: "Format study notes",
    icon: FileText,
  },
];

function cleanLatexText(text: string) {
  return text
    .replace(/\$\\(?:Omega|ohm)\$/gi, "Ohm (Ω)")
    .replace(/\$\\text\{([^}]+)\}\$/gi, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\(?:Omega|ohm)/gi, "Ω")
    .replace(/\(\$\\?\\?\)/g, "")
    .replace(/\(\$\\/g, "(")
    .replace(/[\$\\]/g, "")
    .trim();
}

function FormattedAnswer({ text }: { text: string }) {
  const cleanedText = cleanLatexText(text);
  const lines = cleanedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length <= 1) {
    return <p className="whitespace-pre-wrap leading-relaxed">{cleanedText}</p>;
  }

  return (
    <div className="space-y-2 leading-relaxed">
      {lines.map((line, index) => {
        const headingMatch = line.match(/^(.+?):\s*(.*)$/);
        const bulletMatch = line.match(/^[-*]\s+(.+)$/);

        if (bulletMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
              <p>{bulletMatch[1]}</p>
            </div>
          );
        }

        if (headingMatch) {
          return (
            <div key={`${line}-${index}`}>
              <span className="font-bold text-cyan-700 dark:text-cyan-300">
                {headingMatch[1]}:
              </span>{" "}
              {headingMatch[2] && <span>{headingMatch[2]}</span>}
            </div>
          );
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}
function UploadPanel({
  document,
  busy,
  error,
  onUpload,
}: {
  document: StudyDocument | null;
  busy: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please select or drop a valid PDF file.");
      return;
    }
    void onUpload(file);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
    event.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0 && !busy) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if (busy) return;
        inputRef.current?.click();
      }}
      className="relative group cursor-pointer"
    >
      {/* Ambient Backdrop Glow */}
      <div
        className={cn(
          "absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 blur-xl transition-all duration-300",
          isDragging ? "opacity-100 blur-2xl scale-[1.02]" : "opacity-50 group-hover:opacity-80"
        )}
      />

      <GlassCard
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 sm:p-7 backdrop-blur-2xl transition-all duration-300 border-2",
          isDragging
            ? "border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/50"
            : "border-transparent hover:border-cyan-500/30"
        )}
      >
        {/* Flicker-free Absolute Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-background/90 backdrop-blur-md border-2 border-cyan-400 p-4 text-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-400 animate-bounce mb-2">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-extrabold text-cyan-300">Drop your PDF file here</h3>
            <p className="text-xs text-cyan-200/80">Sparks AI will index and process your course document instantly</p>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-500 ring-1 ring-cyan-500/30 shadow-inner">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Upload or Drag & Drop Study PDF</h2>
                <Badge className="border-transparent bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-500/30">
                  Drag & Drop
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Drag and drop your course PDF anywhere here or click <span className="font-bold text-foreground">Choose PDF</span>.
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleChange}
          />
          <Button
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="shrink-0 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:hover:scale-100"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {busy ? "Processing PDF..." : "Choose PDF"}
          </Button>
        </div>


        {document && (
          <div className="mt-4 flex flex-col gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 px-4 py-3 ring-1 ring-emerald-500/25 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs min-w-0">
                <span className="truncate font-bold text-foreground text-sm">{document.fileName}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-muted-foreground">{document.pageCount} pages</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-muted-foreground">{document.chunkCount} indexed chunks</span>
              </div>
            </div>
            <Badge className="w-fit border-transparent bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Ready & Indexed
            </Badge>
          </div>
        )}

        {error && (
          <div className="mt-4 flex gap-2 rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-700 ring-1 ring-rose-500/25 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function FullTestModeModal({
  documentName,
  questions,
  onClose,
}: {
  documentName: string;
  questions: QuizQuestion[];
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => questions.length * 60);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSubmitted(true);
          toast.warning("Time's up! Test submitted automatically.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted, submitted]);

  if (!mounted) return null;

  const currentItem = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = questions.reduce(
    (acc, q, i) => acc + (selectedAnswers[i] === q.answer ? 1 : 0),
    0
  );
  const accuracy = Math.round((score / total) * 100);
  const timeSpentSec = total * 60 - secondsLeft;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleFlag = (index: number) => {
    setFlagged((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setFlagged({});
    setSubmitted(false);
    setCurrentIndex(0);
    setSecondsLeft(total * 60);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/95 text-slate-100 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-300 select-none">
        {/* Full Screen Test Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-3.5 py-2.5 sm:px-6 sm:py-4 backdrop-blur-xl gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">Sparks AI Exam Simulator</span>
                <span className="shrink-0 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/40">
                  {total} Qs
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-md">{documentName}</p>
            </div>
          </div>

          {/* Live Timer & Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {!submitted && (
              <div
                className={cn(
                  "flex items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 font-mono text-xs sm:text-sm font-bold shadow-inner ring-1 transition-all",
                  secondsLeft < 60
                    ? "bg-rose-500/20 text-rose-400 ring-rose-500/50 animate-pulse"
                    : "bg-slate-800/80 text-cyan-300 ring-slate-700"
                )}
              >
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{formatTime(secondsLeft)}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!submitted) {
                  setShowConfirmExit(true);
                } else {
                  onClose();
                }
              }}
              className="rounded-xl border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Exit Test</span>
            </Button>
          </div>
        </header>

        {/* Content Area */}
        {!submitted ? (
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-4 sm:gap-6 p-3.5 sm:p-8">
            {/* Top Question Stepper & Palette */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-slate-900/60 p-3 sm:p-3.5 ring-1 ring-slate-800">
                <div className="text-xs font-semibold text-slate-400 shrink-0">
                  Q <span className="text-cyan-400 font-bold text-sm">{currentIndex + 1}</span> / {total}
                </div>
                {/* Question Palette Pills */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 max-w-full">
                  {questions.map((_, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAns = selectedAnswers[idx] !== undefined;
                    const isFlg = flagged[idx];

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                          "relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all",
                          isCurrent && "bg-cyan-500/25 text-cyan-300 ring-2 ring-cyan-400 font-extrabold shadow-lg shadow-cyan-500/30 scale-105",
                          !isCurrent && isFlg && "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40",
                          !isCurrent && !isFlg && isAns && "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
                          !isCurrent && !isFlg && !isAns && "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        )}
                      >
                        {idx + 1}
                        {isFlg && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-amber-400 ring-1 ring-slate-950" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Question Card */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4 sm:space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-bold text-indigo-300 ring-1 ring-indigo-500/40">
                    Question {currentIndex + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentIndex)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ring-1",
                      flagged[currentIndex]
                        ? "bg-amber-500/20 text-amber-400 ring-amber-500/40"
                        : "bg-slate-800/80 text-slate-400 ring-slate-700 hover:text-slate-200"
                    )}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{flagged[currentIndex] ? "Flagged for Review" : "Flag Question"}</span>
                    <span className="sm:hidden">{flagged[currentIndex] ? "Flagged" : "Flag"}</span>
                  </button>
                </div>

                {currentItem && (() => {
                  return (
                    <div>
                      <h3 className="text-base sm:text-xl font-bold leading-relaxed text-slate-100">
                        {currentItem.question}
                      </h3>
                    </div>
                  );
                })()}

                {/* Options List */}
                <div className="grid gap-2.5 sm:grid-cols-2 pt-1 sm:pt-2">
                  {currentItem?.options.map((option, optionIdx) => {
                    const letter = String.fromCharCode(65 + optionIdx);
                    const isSelected = selectedAnswers[currentIndex] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setSelectedAnswers((prev) => {
                            if (prev[currentIndex] === option) {
                              const updated = { ...prev };
                              delete updated[currentIndex];
                              return updated;
                            }
                            return {
                              ...prev,
                              [currentIndex]: option,
                            };
                          })
                        }
                        className={cn(
                          "group flex items-center justify-between rounded-2xl p-3 sm:p-4 text-left text-xs sm:text-sm font-medium transition-all ring-1",
                          isSelected
                            ? "bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-white ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/10"
                            : "bg-slate-800/50 text-slate-300 ring-slate-700/80 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 pr-2 min-w-0">
                          <span
                            className={cn(
                              "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all",
                              isSelected
                                ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-md"
                                : "bg-slate-700/80 text-slate-300 group-hover:bg-slate-600"
                            )}
                          >
                            {letter}
                          </span>
                          <span className="leading-snug text-xs sm:text-sm">{option}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stepper Footer Controls */}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="rounded-xl border-slate-700 bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {currentIndex < total - 1 ? (
                  <Button
                    onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:brightness-110"
                  >
                    Finish Test 🎯
                  </Button>
                )}
              </div>

              <Button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full sm:w-auto rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Submit Test ({answeredCount}/{total})
              </Button>
            </div>
          </div>
        ) : (
          /* Detailed Test Results Breakdown Screen */
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Top Score Summary Banner */}
            <div className="rounded-3xl border border-amber-500/40 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/30 to-yellow-500/20 ring-1 ring-amber-500/40 shadow-xl shadow-amber-500/20">
                <Trophy className="h-10 w-10 text-amber-400 animate-bounce" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
                  Test Results Breakdown
                </h2>
                <p className="text-sm text-slate-400 mt-1">{documentName}</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold">FINAL SCORE</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{score} / {total}</p>
                </div>
                <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold">ACCURACY</p>
                  <p className="text-2xl font-black text-cyan-400 mt-1">{accuracy}%</p>
                </div>
                <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold">TIME SPENT</p>
                  <p className="text-2xl font-black text-indigo-400 mt-1">{formatTime(timeSpentSec)}</p>
                </div>
                <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold">GRADE</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    {accuracy >= 90 ? "A+" : accuracy >= 75 ? "A" : accuracy >= 60 ? "B" : "C"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="rounded-2xl border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Test
                </Button>
                <Button
                  onClick={onClose}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 font-bold text-white shadow-lg hover:brightness-110"
                >
                  Back to Sparks AI
                </Button>
              </div>
            </div>

            {/* Question-by-Question Review List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Question Performance Review
              </h3>

              {questions.map((item, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === item.answer;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-3xl border p-6 space-y-4 backdrop-blur-xl transition-all",
                      isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-rose-950/20 border-rose-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-slate-300">
                          Q{idx + 1}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-3 py-0.5 text-xs font-extrabold border",
                            isCorrect
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                          )}
                        >
                          {isCorrect ? "Correct ✓" : "Incorrect ✗"}
                        </span>
                      </div>
                    </div>

                    <p className="text-base font-semibold text-slate-100">{item.question}</p>

                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
                        <span className="text-slate-400 block mb-1">Your Answer:</span>
                        <span className={cn("font-bold", isCorrect ? "text-emerald-400" : "text-rose-400")}>
                          {userAns ? userAns : "Not Answered"}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
                        <span className="text-slate-400 block mb-1">Correct Answer:</span>
                        <span className="font-bold text-emerald-400">{item.answer}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900/60 p-3.5 text-xs text-slate-300 border border-slate-800/80 leading-relaxed">
                      <span className="font-bold text-cyan-400 block mb-1">AI Explanation:</span>
                      {item.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Test Submission Confirmation Modal Popup */}
        {showConfirmSubmit && createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative max-w-md w-full rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-center shadow-2xl space-y-5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mx-auto shadow-lg shadow-cyan-500/10">
                <AlertCircle className="h-8 w-8 text-cyan-400" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
                  Confirm Test Submission 🎯
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Are you sure you want to finish and submit your exam test now?
                </p>
              </div>

              {/* Summary Status Pills */}
              <div className="grid grid-cols-2 gap-2.5 text-xs text-left">
                <div className="rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Answered Questions</span>
                  <span className="font-bold text-emerald-400 text-sm">{answeredCount} / {total}</span>
                </div>
                <div className="rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Unanswered</span>
                  <span className={cn("font-bold text-sm", total - answeredCount > 0 ? "text-amber-400" : "text-slate-400")}>
                    {total - answeredCount} Qs
                  </span>
                </div>
              </div>

              {total - answeredCount > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-center justify-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>You have {total - answeredCount} unanswered question{total - answeredCount > 1 ? "s" : ""}!</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 rounded-xl border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Review Answers
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    setSubmitted(true);
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-lg shadow-emerald-500/25 hover:brightness-110"
                >
                  Confirm & Submit
                </Button>
              </div>
            </motion.div>
          </div>,
          window.document.body
        )}

        {/* Exit Test Confirmation Modal Popup */}
        {showConfirmExit && createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative max-w-md w-full rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-center shadow-2xl space-y-5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 mx-auto shadow-lg shadow-rose-500/10">
                <AlertTriangle className="h-8 w-8 text-rose-400" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
                  Exit Test Confirmation ⚠️
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Are you sure you want to exit the exam? Your current progress and marked answers will be lost.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmExit(false)}
                  className="flex-1 rounded-xl border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-medium"
                >
                  Continue Test
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setShowConfirmExit(false);
                    onClose();
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 font-bold text-white shadow-lg shadow-rose-500/25 hover:brightness-110"
                >
                  Yes, Exit Test
                </Button>
              </div>
            </motion.div>
          </div>,
          window.document.body
        )}
      </div>
    </AnimatePresence>,
    window.document.body
  );
}

function CelebrationModal({
  score,
  total,
  onClose,
}: {
  score: number;
  total: number;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const particles = useMemo(() => Array.from({ length: 45 }), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
        {/* Background Crackers & Fireworks Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((_, i) => {
            const angle = (i / particles.length) * 360;
            const distance = 140 + (i % 6) * 55;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            const colors = ["#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#ec4899", "#8b5cf6", "#eab308"];
            const color = colors[i % colors.length];

            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: [0, x, x * 1.3],
                  y: [0, y, y + 50],
                  scale: [0, 1.8, 0],
                  opacity: [1, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 0.3,
                  delay: (i % 10) * 0.08,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "45%",
                  width: i % 2 === 0 ? "10px" : "15px",
                  height: i % 2 === 0 ? "10px" : "15px",
                  borderRadius: i % 3 === 0 ? "50%" : "3px",
                  backgroundColor: color,
                  boxShadow: `0 0 14px ${color}`,
                }}
              />
            );
          })}
        </div>

        {/* Congratulations Popup Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative max-w-md w-full rounded-3xl bg-background/95 border border-amber-500/40 p-7 text-center shadow-2xl backdrop-blur-2xl space-y-5"
        >
          {/* Trophy & Glow */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/30 to-yellow-500/20 ring-1 ring-amber-500/40 shadow-xl shadow-amber-500/20">
            <Trophy className="h-10 w-10 text-amber-400 animate-bounce" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              100% Score Achieved!
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent sm:text-3xl">
              Congratulations! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Outstanding work! You answered all <span className="font-bold text-foreground">{total}/{total}</span> questions correctly!
            </p>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4 ring-1 ring-border/50 flex items-center justify-around">
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold">SCORE</p>
              <p className="text-lg font-extrabold text-emerald-500">{score}/{total}</p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold">ACCURACY</p>
              <p className="text-lg font-extrabold text-amber-400">100%</p>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-105 hover:from-amber-400 hover:to-yellow-400"
          >
            Awesome! Continue
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>,
    window.document.body
  );
}

function QuizPanel({
  document,
  questions,
  busy,
  quizCount,
  onCountChange,
  onGenerate,
  onUpload,
}: {
  document: StudyDocument | null;
  questions: QuizQuestion[];
  busy: boolean;
  quizCount: 5 | 10;
  onCountChange: (count: 5 | 10) => void;
  onGenerate: () => Promise<void>;
  onUpload?: (file: File) => Promise<void>;
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isTestModeOpen, setIsTestModeOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      void onUpload(file);
    }
    e.target.value = "";
  };

  useEffect(() => {
    setSelectedAnswers({});
    setChecked(false);
    setShowCelebration(false);
  }, [questions]);

  const answeredCount = Object.keys(selectedAnswers).length;
  const score = questions.reduce(
    (total, item, index) => total + (selectedAnswers[index] === item.answer ? 1 : 0),
    0
  );

  const handleCheck = () => {
    setChecked(true);
    if (questions.length > 0 && score === questions.length) {
      setShowCelebration(true);
    }
  };

  const handleDownloadQuizPdf = async () => {
    if (!questions || questions.length === 0) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/study-search/quiz-to-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTitle: document?.fileName || "Course Study Material",
          questions,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate Quiz PDF");

      const contentType = res.headers.get("content-type") || "";
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      if (contentType.includes("text/html")) {
        const win = window.open(downloadUrl, "_blank");
        if (!win) {
          toast.error("Pop-up blocked. Please allow pop-ups to view/print your Quiz PDF.");
        } else {
          toast.success("Quiz PDF ready! Use 'Save as PDF' in the print view.");
        }
      } else {
        const a = window.document.createElement("a");
        a.href = downloadUrl;
        a.download = `${(document?.fileName || "Quiz_Paper").replace(/[^a-zA-Z0-9_\-]/g, "_")}_Quiz_Exam_Paper.pdf`;
        window.document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success("Quiz PDF generated & downloaded!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download Quiz PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 min-h-full my-auto py-4 sm:py-8">
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      {questions.length === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center py-6 text-center w-full max-w-xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-300">
          {document && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25 shadow-sm max-w-md sm:max-w-lg mb-1 truncate"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                PDF Indexed: <span className="font-normal text-slate-300">{document.fileName}</span>
              </span>
            </motion.div>
          )}
          <div className="space-y-2">
            <h3
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>No Quiz Generated Yet</span>
              <BrainCircuit className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400 shrink-0" />
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Generate {quizCount} interactive multiple-choice questions grounded in your course PDF.
            </p>
          </div>
        </div>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center py-6 text-center w-full max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Clean Title & Subtitle */}
          <div className="space-y-1.5">
            <h3
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-100 flex items-center justify-center gap-2.5 whitespace-nowrap"
            >
              <span>Ready for Exam Practice!</span>
              <Rocket className="h-8 w-8 sm:h-10 sm:w-10 text-pink-500 animate-bounce shrink-0" />
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto truncate">
              Grounded in <span className="font-semibold text-slate-200">{document?.fileName || "your study PDF"}</span>
            </p>
          </div>

          {/* 3 Pills aligned in 1 single row with uniform Cyan/Blue styling */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 max-w-full overflow-x-auto scrollbar-none pt-0.5 whitespace-nowrap">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-[15px] bg-cyan-500/10 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-cyan-400 border border-cyan-500/30 shrink-0">
              <BrainCircuit className="h-3.5 w-3.5" />
              {questions.length === quizCount ? questions.length : quizCount} MCQs
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-[15px] bg-cyan-500/10 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-cyan-400 border border-cyan-500/30 shrink-0">
              <Clock className="h-3.5 w-3.5" />
              {questions.length === quizCount ? questions.length : quizCount} Mins Duration
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-[15px] bg-cyan-500/10 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-cyan-400 border border-cyan-500/30 shrink-0">
              <Zap className="h-3.5 w-3.5" />
              Interactive Test
            </span>
          </div>

          {/* Action Buttons in 1 Row */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-xl pt-2">
            {questions.length === quizCount ? (
              <>
                <Button
                  type="button"
                  onClick={() => setIsTestModeOpen(true)}
                  className="h-11 sm:h-12 w-full rounded-[15px] bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-extrabold px-3 text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center border border-cyan-400/30"
                >
                  <span className="truncate">Start Exam Mode ({quizCount} Qs)</span>
                </Button>

                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void onGenerate()}
                  variant="outline"
                  className="h-11 sm:h-12 w-full rounded-[15px] border border-indigo-500/40 bg-slate-800/80 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 font-bold px-3 text-xs sm:text-sm shadow-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center"
                >
                  {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin shrink-0 text-indigo-400" /> : <RotateCcw className="mr-1.5 h-4 w-4 shrink-0 text-indigo-400" />}
                  <span className="truncate">{busy ? `Generating ${quizCount} Qs...` : `Re-generate ${quizCount} Qs`}</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={busy}
                onClick={() => void onGenerate()}
                className="col-span-2 h-12 w-full rounded-[15px] bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 text-white font-bold px-6 text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 transition-all flex items-center justify-center"
              >
                {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5 text-cyan-200" />}
                <span className="truncate">{busy ? `Generating ${quizCount} Questions Quiz...` : `Generate ${quizCount} Questions Quiz`}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Centered Bottom Input Bar (ChatGPT & Gemini Style) */}
      {questions.length === 0 && (
        <div className="relative group w-full max-w-xl sm:max-w-2xl mx-auto mt-auto pt-4 pb-16 sm:pb-0 px-2 sm:px-0">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-15 blur-sm transition duration-500 group-hover:opacity-30 group-focus-within:opacity-40 group-focus-within:blur-md" />
          <div
            onClick={() => {
              if (busy) return;
              if (!document) {
                fileInputRef.current?.click();
                return;
              }
              void onGenerate();
            }}
            className="relative flex items-center justify-between rounded-full bg-white/5 px-4 sm:px-6 py-3.5 sm:py-4.5 shadow-2xl backdrop-blur-md border border-white/10 cursor-pointer select-none focus-within:ring-2 focus-within:ring-cyan-500/70 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center min-w-0 flex-1 mr-2 sm:mr-3">
              <BrainCircuit className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-cyan-400 shrink-0 mr-2 sm:mr-3 animate-pulse" />
              <span className="text-xs sm:text-base text-slate-100 font-medium truncate">
                {document
                  ? busy
                    ? "Generating interactive quiz..."
                    : `Generate ${quizCount} Q MCQ Quiz`
                  : "Upload a PDF first to generate quiz"}
              </span>
            </div>

            <div className="ml-2 sm:ml-3 flex items-center shrink-0">
              <Button
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  if (busy) return;
                  if (!document) {
                    fileInputRef.current?.click();
                    return;
                  }
                  setChecked(false);
                  void onGenerate();
                }}
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-gradient-to-r from-cyan-500/80 via-indigo-500/80 to-purple-600/80 p-0 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center border border-white/10"
                aria-label="Generate Quiz"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 sm:h-5 sm:w-5 fill-current ml-0.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <CelebrationModal
          score={score}
          total={questions.length}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {isTestModeOpen && (
        <FullTestModeModal
          documentName={document?.fileName || "Course Study Material"}
          questions={questions}
          onClose={() => setIsTestModeOpen(false)}
        />
      )}
    </div>
  );
}

function DoubtPanel({
  document,
  messages,
  busy,
  remainingDoubts,
  onAsk,
  onUpload,
}: {
  document: StudyDocument | null;
  messages: ChatMessage[];
  busy: boolean;
  remainingDoubts: number;
  onAsk: (question: string) => Promise<void>;
  onUpload?: (file: File) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      void onUpload(file);
    }
    e.target.value = "";
  };

  const canAsk = Boolean(document) && question.trim().length >= 3 && remainingDoubts > 0 && !busy;
  const isChatting = messages.length > 0;

  const ALL_PROMPT_SETS = [
    [
      "Summarize only the real study topics from this PDF",
      "List the formulas and definitions found in this PDF",
      "Create 3 exam questions from this PDF content",
      "Explain the main concept from this PDF step-by-step",
    ],
    [
      "What questions can be asked from this PDF?",
      "Give a 60-second recap using only this PDF",
      "What are 5 key terms from this PDF I must memorize?",
      "Explain this PDF as if I am a beginner",
    ],
    [
      "Compare the main ideas mentioned in this PDF",
      "What real-world applications are mentioned in this PDF?",
      "What assumptions or limitations are stated in this PDF?",
      "Generate a practice problem from this PDF with solution",
    ],
    [
      "What are the key exam takeaways from this PDF?",
      "Provide a cheat sheet from this PDF only",
      "Explain the trickiest PDF concept in simple terms",
      "Create 3 true/false questions from this PDF",
    ],
  ];

  const currentPromptIndex = Math.floor(messages.length / 2) % ALL_PROMPT_SETS.length;
  const quickPrompts = ALL_PROMPT_SETS[currentPromptIndex];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canAsk) return;
    const nextQuestion = question.trim();
    setQuestion("");
    void onAsk(nextQuestion);
  };

  const handleChipClick = (promptText: string) => {
    if (!document || remainingDoubts <= 0 || busy) return;
    void onAsk(promptText);
  };

  return (
    <div className="flex flex-col w-full flex-1 h-full justify-between py-2 sm:py-4">
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      {!isChatting ? (
        <>
          <div className="my-auto flex flex-col items-center justify-center py-6 text-center w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {document && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25 shadow-sm max-w-md sm:max-w-lg mb-1 truncate"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  PDF Indexed: <span className="font-normal text-slate-300">{document.fileName}</span>
                </span>
              </motion.div>
            )}
            <div className="space-y-2">
              <h2
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>What can I help with today?</span>
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-violet-400 animate-pulse shrink-0" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Ask anything from your indexed PDF document. Answers are strictly grounded with exact page citations.
              </p>
            </div>

            {/* Gemini Quick Suggestion Chips */}
            {document && remainingDoubts > 0 && (
              <div className="w-full max-w-xl space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Questions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {quickPrompts.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      disabled={busy}
                      className="flex items-center gap-2 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 p-3.5 text-xs font-medium text-slate-200 border border-slate-800 transition-all hover:border-violet-500/40 hover:scale-[1.01] text-left group"
                    >
                      <Lightbulb className="h-4 w-4 text-violet-400 group-hover:text-fuchsia-400 shrink-0" />
                      <span className="truncate">{chip}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gemini Centered Bottom Floating Input Bar */}
          <form onSubmit={submit} className="relative group w-full max-w-xl sm:max-w-2xl mx-auto mt-auto pt-4 pb-16 sm:pb-0 px-2 sm:px-0">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-15 blur-sm transition duration-500 group-hover:opacity-30 group-focus-within:opacity-40 group-focus-within:blur-md" />
            <div
              onClick={() => {
                if (!document && !busy) {
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                "relative flex items-center rounded-full bg-white/5 px-4 sm:px-6 py-3.5 sm:py-4.5 shadow-2xl backdrop-blur-md border border-white/10 focus-within:ring-2 focus-within:ring-violet-500 hover:bg-white/10 transition-all",
                !document && "cursor-pointer"
              )}
            >
              <Sparkles className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-violet-400 shrink-0 mr-2 sm:mr-3 animate-pulse" />
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onClick={(e) => {
                  if (!document && !busy) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                disabled={!document || remainingDoubts <= 0}
                placeholder={
                  document
                    ? remainingDoubts <= 0
                      ? "Daily doubt limit reached"
                      : "Ask Sparks AI anything from your PDF..."
                    : "Upload a PDF first from the Hub to ask doubts"
                }
                className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed font-medium"
              />
              <div className="ml-3 flex items-center shrink-0">
                <Button
                  type={document ? "submit" : "button"}
                  disabled={document ? !canAsk : busy}
                  onClick={(e) => {
                    if (!document) {
                      e.stopPropagation();
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 p-0 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center border border-white/10"
                  aria-label="Ask doubt"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </form>
        </>
      ) : (
        <>
          <div className="scrollbar-thin my-4 min-h-0 flex-1 space-y-4 overflow-y-auto bg-transparent p-1 sm:p-2">
            {messages.map((message) => {
              const isStudent = message.role === "student";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-2.5 transition-all duration-300",
                    isStudent ? "justify-end" : "justify-start"
                  )}
                >
                  {!isStudent && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 ring-1 ring-violet-500/40 text-violet-400 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "w-fit max-w-[85%] sm:max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-md transition-all",
                      isStudent
                        ? "rounded-tr-sm bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 text-white shadow-violet-500/15 font-medium"
                        : message.found === false
                          ? "rounded-tl-sm bg-amber-500/10 text-amber-900 ring-1 ring-amber-500/30 dark:text-amber-200"
                          : "rounded-tl-sm bg-slate-900/90 backdrop-blur-xl text-slate-100 ring-1 ring-violet-500/20 border border-violet-500/10 shadow-xl"
                    )}
                  >
                    {isStudent ? (
                      <p className="whitespace-pre-wrap leading-relaxed font-medium">{message.text}</p>
                    ) : (
                      <FormattedAnswer text={message.text} />
                    )}

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-2.5">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">
                          Sources:
                        </span>
                        {message.sources.map((source) => (
                          <span
                            key={`${message.id}-${source.pageNumber}-${source.score}`}
                            className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-400 ring-1 ring-violet-500/25 transition-all hover:bg-violet-500/20"
                          >
                            <FileText className="h-3 w-3 text-violet-400" />
                            Page {source.pageNumber}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {busy && (
              <div className="flex items-center gap-2.5 rounded-3xl bg-slate-900/90 px-4 py-3 text-xs font-semibold text-slate-300 ring-1 ring-violet-500/30 w-fit backdrop-blur-xl shadow-lg animate-pulse">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
                Sparks AI is searching PDF chunks...
              </div>
            )}
            {!busy && remainingDoubts > 0 && (
              <div className="pt-3 pb-1 space-y-2 animate-in fade-in duration-300">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggested Questions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {quickPrompts.map((chip, idx) => (
                    <button
                      key={`chat-chip-${idx}`}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      disabled={busy}
                      className="flex items-center gap-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 p-3 text-xs font-medium text-slate-200 border border-slate-800 transition-all hover:border-violet-500/40 hover:scale-[1.01] text-left group"
                    >
                      <Lightbulb className="h-4 w-4 text-violet-400 group-hover:text-fuchsia-400 shrink-0" />
                      <span className="truncate">{chip}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Active Chat Input Bar */}
          <form onSubmit={submit} className="relative group mt-3">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-15 blur-sm transition duration-500 group-hover:opacity-30 group-focus-within:opacity-40 group-focus-within:blur-md" />
            <div className="relative flex items-center rounded-full bg-white/5 px-6 py-4.5 sm:py-5 shadow-2xl backdrop-blur-md border border-white/10 focus-within:ring-2 focus-within:ring-violet-500/70 hover:bg-white/10 transition-all">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={!document || remainingDoubts <= 0}
                placeholder={
                  document
                    ? remainingDoubts <= 0
                      ? "Daily doubt limit reached"
                      : "Ask follow-up question..."
                    : "Upload a PDF first to ask doubts"
                }
                className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed"
              />
              <div className="ml-3 flex items-center shrink-0">
                <Button
                  type="submit"
                  disabled={!canAsk}
                  className="h-11 w-11 rounded-full bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 p-0 text-white shadow-md backdrop-blur-sm transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center border border-white/10"
                  aria-label="Ask doubt"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function TextToPdfPanel({
  busy,
  pdfReady,
  onGenerate,
  onSaveAsPdf,
  onDownload,
}: {
  busy: boolean;
  pdfReady: boolean;
  onGenerate: (text: string, tag: "english" | "hindi" | "maths" | "summary" | "code") => Promise<void>;
  onSaveAsPdf: () => void;
  onDownload: () => void;
}) {
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState<"english" | "hindi" | "maths" | "summary" | "code">("english");

  const FORMAT_TAGS = [
    { id: "english", label: "English Text", icon: FileText },
    { id: "hindi", label: "Hindi Text", icon: Sparkles },
    { id: "maths", label: "Science or Maths", icon: BrainCircuit },
    { id: "summary", label: "Summary & Revision", icon: Lightbulb },
    { id: "code", label: "Code or Technical", icon: FileCode },
  ] as const;

  const canGenerate = text.trim().length >= 10 && text.trim().length <= 15000 && !busy;
  const isMultiLine = text.includes("\n") || text.length > 70;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canGenerate) return;
    void onGenerate(text.trim(), selectedTag);
  };

  return (
    <div className="flex flex-col items-center justify-between w-full flex-1 h-full py-2 sm:py-4 px-2 sm:px-4 overflow-y-auto min-h-full">
      {/* Upper Content: Title, Subtitle, Tags & Actions */}
      <div className="my-auto flex flex-col items-center justify-center py-2 sm:py-6 text-center w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="space-y-2 sm:space-y-3 w-full">
          <h3
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100 flex items-center justify-center gap-2"
          >
            <span>Create Formatted Study Notes</span>
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400 shrink-0" />
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed px-2">
            Select a format mode below and paste your content to generate a beautifully styled PDF.
          </p>

          {/* Interactive Content Format Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2 w-full max-w-3xl mx-auto">
            {FORMAT_TAGS.map((tagItem) => {
              const isSelected = selectedTag === tagItem.id;
              const Icon = tagItem.icon;
              return (
                <button
                  key={tagItem.id}
                  type="button"
                  onClick={() => setSelectedTag(tagItem.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all border whitespace-nowrap shrink-0",
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/40 shadow-md shadow-emerald-500/10 scale-105"
                      : "bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tagItem.label}</span>
                </button>
              );
            })}
          </div>

          {pdfReady && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                onClick={onSaveAsPdf}
                className="rounded-[15px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300"
              >
                Preview
              </Button>
              <Button
                type="button"
                onClick={onDownload}
                className="rounded-[15px] bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300"
              >
                Download PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Input Form Pinned to Bottom Dock */}
      <form onSubmit={submit} className="mt-auto flex flex-col items-center gap-3 w-full max-w-2xl sm:max-w-3xl mx-auto pt-2 pb-16 sm:pb-4 shrink-0 px-2 sm:px-0">
        <div
          className={cn(
            "relative group w-full mx-auto transition-all duration-500 ease-in-out",
            isMultiLine ? "max-w-2xl sm:max-w-3xl" : "max-w-xl sm:max-w-2xl"
          )}
        >
          <div
            className={cn(
              "absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-40 blur-md transition-all duration-500 group-hover:opacity-75 group-focus-within:opacity-100 group-focus-within:blur-lg",
              isMultiLine ? "rounded-3xl" : "rounded-full"
            )}
          />
          <div
            className={cn(
              "relative flex bg-slate-900/90 backdrop-blur-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl border border-slate-800 transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/60",
              isMultiLine ? "rounded-3xl items-end" : "rounded-full items-center"
            )}
          >
            <textarea
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canGenerate) submit(e);
                }
              }}
              placeholder="Paste notes or summary to generate a PDF..."
              className="w-full bg-transparent text-xs sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed resize-none min-h-[32px] max-h-[220px] overflow-y-auto leading-relaxed py-1 font-medium"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 220)}px`;
              }}
            />
            <div className="ml-2 sm:ml-3 flex items-center shrink-0 self-end pb-0.5">
              <Button
                type="submit"
                disabled={!canGenerate}
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-0 text-white shadow-md transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Generate PDF"
              >
                {busy ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const RESUME_SAMPLE: ResumeMakerInput = {
  fullName: "Asha Sharma",
  email: "asha@example.com",
  phone: "+91 98765 43210",
  location: "Indore, India",
  links: "github.com/asha-dev | linkedin.com/in/asha-sharma",
  targetRole: "Frontend Developer Intern",
  tone: "internship",
  education: [
    {
      school: "Amrita ahead",
      degree: "BCA",
      dates: "2023 - 2027",
      details: "Relevant coursework: Data Structures, Web Development, DBMS",
    },
  ],
  experience: [],
  projects: [
    {
      name: "Study Planner Dashboard",
      tech: "React, Next.js, TypeScript, Tailwind CSS",
      link: "github.com/asha-dev/study-planner",
      details:
        "Built a responsive dashboard for task management, calendar planning, focus sessions, and weekly study analytics.",
    },
    {
      name: "Typing Speed Practice Tool",
      tech: "JavaScript, React, CSS",
      link: "asha-dev.github.io/typing-practice",
      details:
        "Created an interactive typing practice interface with accuracy tracking, timer state, and result feedback.",
    },
  ],
  skills: "React, Next.js, TypeScript, JavaScript, Tailwind CSS, Git, REST APIs",
  certifications: "",
  achievements: "",
};

const emptyProject = () => ({ name: "", tech: "", link: "", details: "" });
const emptyExperience = () => ({ role: "", organization: "", dates: "", details: "" });

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resumeLinkHref(link: string) {
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function splitLinks(links?: string) {
  return (links || "")
    .split(/\s*\|\s*|\s*,\s*/)
    .map((link) => link.trim())
    .filter(Boolean);
}

const RESUME_DOCUMENT_CSS = `
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; color: #1e293b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9.8pt; line-height: 1.45; }
  .editable-resume { width: 100%; max-width: 794px; min-height: 920px; margin: 0 auto; background: #ffffff; color: #1e293b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px; }
  .editable-resume h1 { margin: 0 0 4px; color: #0f172a; font-size: 30px; line-height: 1.05; font-weight: 800; text-transform: uppercase; letter-spacing: 0; }
  .editable-resume .headline { margin: 4px 0 0; color: #2563eb; font-size: 15px; font-weight: 700; }
  .editable-resume .contact { margin: 8px 0 0; color: #475569; font-size: 12px; border-bottom: 2px solid #ef4444; padding-bottom: 8px; }
  .editable-resume a { color: #2563eb; text-decoration: none; }
  .editable-resume section { margin: 16px 0 0; page-break-inside: avoid; }
  .editable-resume h2 { margin: 0 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; color: #0f172a; font-size: 17px; font-weight: 700; text-transform: uppercase; letter-spacing: 0; page-break-after: avoid; }
  .editable-resume p { margin: 0; }
  .editable-resume .summary { margin-top: 8px; font-size: 14px; line-height: 1.55; }
  .editable-resume .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .editable-resume .skill { display: inline-block; background-color: #f3f4f6; padding: 6px 10px; border-radius: 4px; border: 1px solid #e5e7eb; font-weight: 700; font-size: 12px; }
  .editable-resume .item { margin-top: 8px; }
  .editable-resume .row { display: table; width: 100%; font-size: 14px; font-weight: 700; color: #0f172a; }
  .editable-resume .row-left, .editable-resume .row-right { display: table-cell; vertical-align: top; }
  .editable-resume .row-left { width: 70%; }
  .editable-resume .row-right { width: 30%; text-align: right; color: #64748b; font-weight: 400; }
  .editable-resume .accent { color: #2563eb; font-size: 13px; font-weight: 700; }
  .editable-resume .project-tech { margin-top: 1px; margin-bottom: 1px; line-height: 1.25; }
  .editable-resume .education-section h2 { font-size: 15px; margin-bottom: 8px; }
  .editable-resume .education-title { color: #0f172a; font-size: 14px; font-weight: 700; line-height: 1.25; }
  .editable-resume .education-detail { color: #1e293b; font-size: 12px; line-height: 1.35; margin-top: 3px; }
  .editable-resume .education-label { color: rgba(15, 23, 42, 0.7); font-weight: 700; }
  .editable-resume ul { margin: 4px 0 0 20px; padding: 0; color: #1e293b; font-size: 13px; line-height: 1.5; }
  .editable-resume li { margin: 0 0 2px; }
  @media print { .editable-resume { max-width: none; min-height: auto; padding: 0; } }
`;

function buildEditedResumeHtml(markup: string) {
  const printableMarkup = markup
    .replace(/\scontenteditable="[^"]*"/gi, "")
    .replace(/\sspellcheck="[^"]*"/gi, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${RESUME_DOCUMENT_CSS}</style>
</head>
<body>
  ${printableMarkup}
</body>
</html>`;
}

function buildResumeText(resume: GeneratedResume) {
  const lines = [
    resume.contact.fullName.toUpperCase(),
    resume.headline,
    [resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.links].filter(Boolean).join(" | "),
    "",
    "PROFESSIONAL SUMMARY",
    resume.summary,
    "",
    "TECHNICAL SKILLS",
    resume.skills.join(", "),
  ];

  if (resume.experience.length) {
    lines.push("", "PROFESSIONAL EXPERIENCE");
    resume.experience.forEach((exp) => {
      lines.push(`${exp.title}${exp.organization ? ` - ${exp.organization}` : ""}${exp.dates ? ` | ${exp.dates}` : ""}`);
      exp.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
    });
  }

  if (resume.projects.length) {
    lines.push("", "KEY PROJECTS");
    resume.projects.forEach((project) => {
      lines.push(`${project.name}${project.link ? ` | ${project.link}` : ""}`);
      if (project.tech) lines.push(project.tech);
      project.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
    });
  }

  lines.push("", "EDUCATION & CERTIFICATIONS");
  resume.education.forEach((edu) => {
    lines.push(`${edu.degree}, ${edu.school}${edu.dates ? ` | ${edu.dates}` : ""}`);
    if (edu.details) lines.push(edu.details);
  });
  resume.certifications.forEach((cert) => lines.push(`Certification: ${cert}`));
  resume.achievements.forEach((achievement) => lines.push(`Achievement: ${achievement}`));

  return lines.join("\n");
}

function buildResumeHtml(resume: GeneratedResume) {
  const contactItems = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    ...splitLinks(resume.contact.links),
  ].filter(Boolean) as string[];

  const contactHtml = contactItems
    .map((item) => {
      const href = resumeLinkHref(item);
      const isLinked = href && !item.includes(" ") && (item.includes(".") || item.includes("@"));
      return isLinked
        ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(item)}</a>`
        : escapeHtml(item);
    })
    .join(" <span>|</span> ");

  const section = (title: string, body: string, className = "") =>
    body ? `<section${className ? ` class="${className}"` : ""}><h2>${title}</h2>${body}</section>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #ffffff; color: #1e293b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9.8pt; line-height: 1.45; }
    h1 { margin: 0 0 4px; color: #0f172a; font-size: 21pt; line-height: 1.05; font-weight: 800; text-transform: uppercase; letter-spacing: 0; }
    .headline { color: #2563eb; font-size: 11pt; font-weight: 700; margin: 0 0 7px; }
    .contact { color: #475569; font-size: 8.8pt; border-bottom: 2px solid #ef4444; padding-bottom: 8px; margin-bottom: 12px; }
    a { color: #2563eb; text-decoration: none; }
    section { margin: 0 0 10px; page-break-inside: avoid; }
    h2 { margin: 0 0 7px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; color: #0f172a; font-size: 10.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; page-break-after: avoid; }
    p { margin: 0; }
    ul { margin: 3px 0 0 15px; padding: 0; }
    li { margin: 0 0 2px; }
    .title-row { display: table; width: 100%; margin-top: 2px; }
    .title-left, .title-right { display: table-cell; vertical-align: top; }
    .title-left { width: 70%; font-weight: 700; color: #0f172a; }
    .title-right { width: 30%; text-align: right; color: #64748b; font-size: 8.9pt; }
    .accent { color: #2563eb; font-weight: 700; }
    .project-tech { margin-top: 1px; margin-bottom: 1px; line-height: 1.25; }
    .education-section h2 { font-size: 10.2pt; margin-bottom: 7px; }
    .education-title { color: #0f172a; font-size: 9.8pt; font-weight: 700; line-height: 1.25; }
    .education-detail { color: #1e293b; font-size: 9pt; line-height: 1.35; margin-top: 2px; }
    .education-label { color: rgba(15, 23, 42, 0.7); font-weight: 700; }
    .skill { display: inline-block; background-color: #f3f4f6; padding: 3px 8px; border-radius: 4px; border: 1px solid #e5e7eb; margin-right: 5px; margin-bottom: 5px; font-weight: 700; font-size: 8.5pt; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(resume.contact.fullName)}</h1>
    <p class="headline">${escapeHtml(resume.headline)}</p>
    <p class="contact">${contactHtml}</p>
  </header>
  ${section("Professional Summary", `<p>${escapeHtml(resume.summary)}</p>`)}
  ${section("Technical Skills", resume.skills.map((skill) => `<span class="skill">${escapeHtml(skill)}</span>`).join(""))}
  ${section(
    "Professional Experience",
    resume.experience
      .map(
        (exp) => `<div class="item">
          <div class="title-row"><div class="title-left">${escapeHtml(exp.title)}${exp.organization ? ` - ${escapeHtml(exp.organization)}` : ""}</div><div class="title-right">${escapeHtml(exp.dates || "")}</div></div>
          <ul>${exp.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
        </div>`
      )
      .join("")
  )}
  ${section(
    "Key Projects",
    resume.projects
      .map((project) => {
        const link = project.link ? `<a href="${escapeHtml(resumeLinkHref(project.link))}" target="_blank" rel="noreferrer">${escapeHtml(project.link)}</a>` : "";
        return `<div class="item">
          <div class="title-row"><div class="title-left">${escapeHtml(project.name)}</div><div class="title-right">${link}</div></div>
          ${project.tech ? `<p class="accent project-tech">${escapeHtml(project.tech)}</p>` : ""}
          <ul>${project.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
        </div>`;
      })
      .join("")
  )}
  ${section(
    "Education & Certifications",
    resume.education
      .map(
        (edu) => `<div class="item">
          <div class="title-row"><div class="title-left education-title">${escapeHtml(edu.degree)}, ${escapeHtml(edu.school)}</div><div class="title-right">${escapeHtml(edu.dates || "")}</div></div>
          ${edu.details ? `<p class="education-detail"><strong class="education-label">Relevant coursework:</strong> ${escapeHtml(edu.details.replace(/^Relevant coursework:\s*/i, ""))}</p>` : ""}
        </div>`
      )
      .join("") +
      resume.certifications.map((cert) => `<p><strong>Certification:</strong> ${escapeHtml(cert)}</p>`).join("") +
      resume.achievements.map((achievement) => `<p><strong>Achievement:</strong> ${escapeHtml(achievement)}</p>`).join(""),
    "education-section"
  )}
</body>
</html>`;
}

function ResumePreview({
  resume,
  editable,
  previewRef,
}: {
  resume: GeneratedResume;
  editable: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={previewRef}
      className={cn(
        "editable-resume mx-auto min-h-[920px] w-full max-w-[794px] rounded-xl bg-white p-8 font-sans text-[#1e293b] shadow-2xl outline-none",
        editable && "ring-2 ring-amber-400 ring-offset-4 ring-offset-slate-950"
      )}
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={false}
    >
      <header>
        <h1 className="m-0 text-[30px] font-extrabold uppercase leading-none tracking-normal text-[#0f172a]">{resume.contact.fullName}</h1>
        <p className="headline mt-1 text-[15px] font-bold text-blue-600">{resume.headline}</p>
        <p className="contact mt-2 border-b-2 border-red-500 pb-2 text-[12px] text-[#475569]">
          {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" | ")}
          {splitLinks(resume.contact.links).map((link) => (
            <span key={link}>
              {" | "}
              <a href={resumeLinkHref(link)} target="_blank" rel="noreferrer" className="text-blue-600">
                {link}
              </a>
            </span>
          ))}
        </p>
      </header>

      <section className="mt-4">
        <h2 className="border-b border-slate-200 pb-1 text-[17px] font-bold uppercase tracking-normal text-[#0f172a]">Professional Summary</h2>
        <p className="summary mt-2 text-[14px] leading-relaxed">{resume.summary}</p>
      </section>

      <section className="mt-4">
        <h2 className="border-b border-slate-200 pb-1 text-[17px] font-bold uppercase tracking-normal text-[#0f172a]">Technical Skills</h2>
        <div className="skills mt-2 flex flex-wrap gap-2">
          {resume.skills.map((skill) => (
            <span key={skill} className="skill rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[12px] font-bold">
              {skill}
            </span>
          ))}
        </div>
      </section>

      {resume.experience.length > 0 && (
        <section className="mt-4">
          <h2 className="border-b border-slate-200 pb-1 text-[17px] font-bold uppercase tracking-normal text-[#0f172a]">Professional Experience</h2>
          {resume.experience.map((exp, index) => (
            <div key={`${exp.title}-${index}`} className="item mt-2">
              <div className="row flex justify-between gap-3 text-[14px] font-bold text-[#0f172a]">
                <span className="row-left">{exp.title}{exp.organization ? ` - ${exp.organization}` : ""}</span>
                <span className="row-right shrink-0 font-normal text-[#64748b]">{exp.dates}</span>
              </div>
              <ul className="mt-1 list-disc pl-5 text-[13px] leading-relaxed text-[#1e293b]">
                {exp.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resume.projects.length > 0 && (
        <section className="mt-4">
          <h2 className="border-b border-slate-200 pb-1 text-[17px] font-bold uppercase tracking-normal text-[#0f172a]">Key Projects</h2>
          {resume.projects.map((project, index) => (
            <div key={`${project.name}-${index}`} className="item mt-2">
              <div className="row flex justify-between gap-3 text-[14px] font-bold text-[#0f172a]">
                <span className="row-left">{project.name}</span>
                {project.link && (
                  <a href={resumeLinkHref(project.link)} target="_blank" rel="noreferrer" className="row-right shrink-0 font-normal text-blue-600">
                    {project.link}
                  </a>
                )}
              </div>
              {project.tech && <p className="accent project-tech mt-0.5 mb-0.5 text-[13px] font-bold leading-tight text-blue-600">{project.tech}</p>}
              <ul className="mt-0.5 list-disc pl-5 text-[13px] leading-relaxed text-[#1e293b]">
                {project.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="education-section mt-4">
        <h2 className="border-b border-slate-200 pb-1 text-[15px] font-bold uppercase tracking-normal text-[#0f172a]">Education & Certifications</h2>
        {resume.education.map((edu, index) => (
          <div key={`${edu.school}-${index}`} className="item mt-2">
            <div className="row flex justify-between gap-3 text-[14px] font-bold text-[#0f172a]">
              <span className="row-left education-title text-[14px] leading-tight text-[#0f172a]">{edu.degree}, {edu.school}</span>
              <span className="row-right shrink-0 font-normal text-[#64748b]">{edu.dates}</span>
            </div>
            {edu.details && <p className="education-detail mt-0.5 text-[12px] leading-snug text-[#1e293b]"><strong className="education-label font-bold text-[#0f172a]/70">Relevant coursework:</strong> {edu.details.replace(/^Relevant coursework:\s*/i, "")}</p>}
          </div>
        ))}
        {resume.certifications.map((cert) => <p key={cert} className="mt-1 text-[13px]"><strong>Certification:</strong> {cert}</p>)}
        {resume.achievements.map((achievement) => <p key={achievement} className="mt-1 text-[13px]"><strong>Achievement:</strong> {achievement}</p>)}
      </section>
    </div>
  );
}

function ResumeMakerPanel() {
  const [formData, setFormData] = useState<ResumeMakerInput>(RESUME_SAMPLE);
  const [resume, setResume] = useState<GeneratedResume | null>(null);
  const [editedResumeHtml, setEditedResumeHtml] = useState<string | null>(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [includeExperience, setIncludeExperience] = useState(false);
  const resumePreviewRef = useRef<HTMLDivElement | null>(null);

  const canSubmit = formData.fullName.trim() && formData.targetRole.trim() && formData.skills.trim();

  const updateProject = (index: number, patch: Partial<ResumeMakerInput["projects"][number]>) => {
    const projects = [...formData.projects];
    projects[index] = { ...projects[index], ...patch };
    setFormData({ ...formData, projects });
  };

  const updateExperience = (index: number, patch: Partial<ResumeMakerInput["experience"][number]>) => {
    const experience = [...formData.experience];
    experience[index] = { ...experience[index], ...patch };
    setFormData({ ...formData, experience });
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsGenerating(true);
    try {
      const payload: ResumeMakerInput = {
        ...formData,
        experience: includeExperience ? formData.experience.filter((item) => item.role.trim() && item.details.trim()) : [],
        projects: formData.projects.filter((item) => item.name.trim() && item.details.trim()),
      };
      const data = await apiFetch<{ resume: GeneratedResume }>("/api/ai/resume-maker", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResume(data.resume);
      setEditedResumeHtml(null);
      setIsEditingPreview(false);
      toast.success("AI resume generated");
    } catch (error) {
      handleError(error, "Could not generate resume");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTxt = () => {
    if (!resume) return;
    const text = resumePreviewRef.current?.innerText?.trim() || buildResumeText(resume);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${resume.contact.fullName.replace(/[^a-z0-9]+/gi, "_")}_Resume.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!resume) return;
    setIsDownloading(true);
    try {
      const currentPreviewHtml = resumePreviewRef.current?.outerHTML;
      const printableHtml = currentPreviewHtml
        ? buildEditedResumeHtml(currentPreviewHtml)
        : editedResumeHtml || buildResumeHtml(resume);
      const response = await fetch("/api/ai/resume-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "pdf",
          html: printableHtml,
          fileName: `${resume.contact.fullName.replace(/[^a-z0-9]+/gi, "_")}_Resume`,
        }),
      });
      if (!response.ok) throw new Error("Could not render PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${resume.contact.fullName.replace(/[^a-z0-9]+/gi, "_")}_Resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Resume PDF downloaded");
    } catch (error) {
      handleError(error, "Could not download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const startEditingPreview = () => {
    if (!resume) return;
    setIsEditingPreview(true);
    requestAnimationFrame(() => resumePreviewRef.current?.focus());
  };

  const finishEditingPreview = () => {
    if (!resumePreviewRef.current) return;
    setEditedResumeHtml(buildEditedResumeHtml(resumePreviewRef.current.outerHTML));
    setIsEditingPreview(false);
    toast.success("Resume edits saved for download");
  };

  const copyResume = async () => {
    if (!resume) return;
    const text = resumePreviewRef.current?.innerText?.trim() || buildResumeText(resume);
    await navigator.clipboard.writeText(text);
    toast.success("Resume copied");
  };

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1.05fr_.95fr]">
      <form
        onSubmit={handleGenerate}
        className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl scrollbar-thin scrollbar-thumb-indigo-500/70 scrollbar-track-transparent"
      >
        <div className="mb-5 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-extrabold uppercase text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Sparks AI Resume Builder
          </div>
          <h2 className="text-2xl font-extrabold text-white">Build an honest ATS resume</h2>
          <p className="text-sm text-slate-400">Add real facts in the fields. AI turns them into clean, recruiter-ready bullets.</p>
          <Button type="button" variant="outline" onClick={() => setFormData(RESUME_SAMPLE)} className="mt-2 rounded-xl border-white/15 bg-white/5 text-slate-100">
            <RotateCcw className="mr-2 h-4 w-4 text-amber-300" />
            Load Sample
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Full Name", "fullName"],
            ["Target Role", "targetRole"],
            ["Email", "email"],
            ["Phone", "phone"],
            ["Location", "location"],
            ["Links", "links"],
          ].map(([label, key]) => (
            <label key={key} className="space-y-1 text-xs font-bold text-slate-400">
              <span>{label}</span>
              <input
                value={String(formData[key as keyof ResumeMakerInput] || "")}
                onChange={(event) => setFormData({ ...formData, [key]: event.target.value })}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-amber-400/70"
              />
            </label>
          ))}
          <label className="space-y-1 text-xs font-bold text-slate-400 sm:col-span-2">
            <span>Resume Style</span>
            <select
              value={formData.tone}
              onChange={(event) => setFormData({ ...formData, tone: event.target.value as ResumeMakerInput["tone"] })}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-amber-400/70"
            >
              <option value="ats">ATS-friendly</option>
              <option value="fresher">Fresher</option>
              <option value="internship">Internship</option>
              <option value="professional">Professional</option>
            </select>
          </label>
        </div>

        <h3 className="mt-5 text-sm font-extrabold uppercase text-amber-300">Education</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["College / School", "school"],
            ["Degree / Course", "degree"],
            ["Dates", "dates"],
            ["Details", "details"],
          ].map(([label, key]) => (
            <label key={key} className="space-y-1 text-xs font-bold text-slate-400">
              <span>{label}</span>
              <input
                value={String(formData.education[0]?.[key as keyof ResumeMakerInput["education"][number]] || "")}
                onChange={(event) => {
                  const education = [...formData.education];
                  education[0] = { ...education[0], [key]: event.target.value };
                  setFormData({ ...formData, education });
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-amber-400/70"
              />
            </label>
          ))}
        </div>

        <h3 className="mt-5 text-sm font-extrabold uppercase text-amber-300">Projects</h3>
        <div className="mt-3 space-y-3">
          {formData.projects.map((project, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-black/15 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Project #{index + 1}</span>
                {formData.projects.length > 1 && (
                  <button type="button" onClick={() => setFormData({ ...formData, projects: formData.projects.filter((_, i) => i !== index) })} className="text-slate-400 hover:text-red-300">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input value={project.name} onChange={(e) => updateProject(index, { name: e.target.value })} placeholder="Project Name" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none" />
                <input value={project.tech || ""} onChange={(e) => updateProject(index, { tech: e.target.value })} placeholder="Tech Stack" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none" />
                <input value={project.link || ""} onChange={(e) => updateProject(index, { link: e.target.value })} placeholder="Project Link / GitHub URL" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none sm:col-span-2" />
                <textarea value={project.details} onChange={(e) => updateProject(index, { details: e.target.value })} placeholder="Project details and impact" className="min-h-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none sm:col-span-2" />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, projects: [...formData.projects, emptyProject()] })} className="rounded-xl border-white/15 bg-white/5 text-slate-100">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Project
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase text-amber-300">Work Experience</h3>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <input type="checkbox" checked={includeExperience} onChange={(e) => setIncludeExperience(e.target.checked)} />
            Include experience
          </label>
        </div>
        {includeExperience && (
          <div className="mt-3 space-y-3">
            {(formData.experience.length ? formData.experience : [emptyExperience()]).map((exp, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-black/15 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Experience #{index + 1}</span>
                  {formData.experience.length > 1 && (
                    <button type="button" onClick={() => setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== index) })} className="text-slate-400 hover:text-red-300">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input value={exp.role} onChange={(e) => updateExperience(index, { role: e.target.value })} placeholder="Role" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none" />
                  <input value={exp.organization || ""} onChange={(e) => updateExperience(index, { organization: e.target.value })} placeholder="Organization" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none" />
                  <input value={exp.dates || ""} onChange={(e) => updateExperience(index, { dates: e.target.value })} placeholder="Dates" className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none sm:col-span-2" />
                  <textarea value={exp.details} onChange={(e) => updateExperience(index, { details: e.target.value })} placeholder="Responsibility, impact, tools used" className="min-h-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none sm:col-span-2" />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, experience: [...formData.experience, emptyExperience()] })} className="rounded-xl border-white/15 bg-white/5 text-slate-100">
              <Plus className="mr-2 h-4 w-4" />
              Add Experience
            </Button>
          </div>
        )}

        <div className="mt-5 space-y-3">
          <label className="block space-y-1 text-xs font-bold text-slate-400">
            <span>Skills</span>
            <textarea value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none" />
          </label>
          <label className="block space-y-1 text-xs font-bold text-slate-400">
            <span>Certifications</span>
            <textarea value={formData.certifications || ""} onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} placeholder="Google Cloud Digital Leader, freeCodeCamp Responsive Web Design" className="min-h-16 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none" />
          </label>
          <label className="block space-y-1 text-xs font-bold text-slate-400">
            <span>Achievements</span>
            <textarea value={formData.achievements || ""} onChange={(e) => setFormData({ ...formData, achievements: e.target.value })} placeholder="Hackathon wins, open source, awards" className="min-h-16 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none" />
          </label>
        </div>

        <Button type="submit" disabled={!canSubmit || isGenerating} className="mt-5 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate AI Resume
        </Button>
      </form>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Resume Preview</h2>
            <p className="text-sm text-slate-400">Copy, download, or edit directly after checking the output.</p>
          </div>
          <div className="flex gap-2">
            {resume && (
              isEditingPreview ? (
                <Button type="button" onClick={finishEditingPreview} className="rounded-xl bg-amber-600 text-white hover:bg-amber-500">
                  <Check className="mr-2 h-4 w-4" />
                  Done
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={startEditingPreview} className="rounded-xl border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20">
                  Edit
                </Button>
              )
            )}
            <Button type="button" variant="outline" disabled={!resume || isEditingPreview} onClick={copyResume} className="rounded-xl border-white/15 bg-white/5 text-slate-100">
              Copy
            </Button>
            <Button type="button" variant="outline" disabled={!resume || isEditingPreview} onClick={downloadTxt} className="rounded-xl border-white/15 bg-white/5 text-slate-100">
              <Download className="mr-2 h-4 w-4" />
              TXT
            </Button>
            <Button type="button" variant="outline" disabled={!resume || isDownloading || isEditingPreview} onClick={downloadPdf} className="rounded-xl border-white/15 bg-white/5 text-slate-100">
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              PDF
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-amber-500/25 bg-black/15 p-4 scrollbar-thin scrollbar-thumb-indigo-500/70 scrollbar-track-transparent">
          {resume ? (
            <ResumePreview resume={resume} editable={isEditingPreview} previewRef={resumePreviewRef} />
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-14 w-14 text-amber-300" />
              <h3 className="text-xl font-extrabold text-white">Resume preview appears here</h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Generate an honest, ATS-friendly resume from your real education, skills, experience, and projects.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SparksIntroSplash({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 2.2, filter: "blur(28px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none overflow-hidden"
    >
      {/* Dark Subtle Ambient Mesh & Radial Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-500/25 via-indigo-500/20 to-purple-500/25 blur-3xl opacity-70" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-7 text-center px-4 max-w-sm">
        {/* Netflix-Style Cinematic Zooming 3-Star Constellation */}
        <motion.div
          initial={{ scale: 0.15, opacity: 0, filter: "blur(12px)" }}
          animate={{ scale: [0.15, 1.3, 1], opacity: [0, 1, 1], filter: ["blur(12px)", "blur(0px)", "blur(0px)"] }}
          transition={{ duration: 1.1, ease: [0.215, 0.61, 0.355, 1] }}
          className="relative flex items-center justify-center h-28 w-28 sm:h-32 sm:w-32"
        >
          {/* Shockwave Glow Expansion Aura */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 2.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 blur-xl"
          />

          {/* Main Glowing Aura */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/25 blur-2xl animate-pulse" />

          {/* Center Main Star */}
          <div className="relative z-10 text-cyan-400 drop-shadow-[0_0_24px_rgba(6,182,212,0.95)]">
            <Sparkles className="h-16 w-16 sm:h-20 sm:w-20 fill-cyan-400/20" />
          </div>

          {/* Top-Left Star */}
          <div className="absolute top-1 left-1 z-20 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 fill-cyan-300/30" />
          </div>

          {/* Bottom-Right Star */}
          <div className="absolute bottom-1 right-1 z-20 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 fill-cyan-300/30" />
          </div>
        </motion.div>

        {/* Title & Modern Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 flex flex-col items-center"
        >
          <h1 className="text-xl sm:text-2xl font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            SPARKS AI WORKSPACE
          </h1>

          {/* Linear Smooth Progress Bar */}
          <div className="w-48 h-[3px] rounded-full bg-slate-800/80 overflow-hidden relative border border-slate-700/50">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 1.3, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 shadow-sm shadow-cyan-400"
            />
          </div>

          <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
            Initializing Engine
          </p>
        </motion.div>
      </div>
    </motion.div>,
    window.document.body
  );
}

export function StudySearchPage() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("hub");
  const [activeTool, setActiveTool] = useState<StudyTool>("quiz");
  const [document, setDocument] = useState<StudyDocument | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remainingDoubts, setRemainingDoubts] = useState<number>(10);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [asking, setAsking] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPdfBlobHtml, setIsPdfBlobHtml] = useState(false);
  const [showIntroSplash, setShowIntroSplash] = useState(true);

  const [isPortalDragging, setIsPortalDragging] = useState(false);
  const portalDragCounter = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePortalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    portalDragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0 && !uploading) {
      setIsPortalDragging(true);
    }
  };

  const handlePortalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handlePortalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    portalDragCounter.current -= 1;
    if (portalDragCounter.current <= 0) {
      portalDragCounter.current = 0;
      setIsPortalDragging(false);
    }
  };

  const handlePortalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    portalDragCounter.current = 0;
    setIsPortalDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        toast.error("Please select or drop a valid PDF file.");
        return;
      }
      void uploadPdf(file);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const statusText = useMemo(() => {
    if (uploading) return "Processing PDF and creating embeddings";
    if (document) return "Ready for quiz and doubt chat";
    return "Upload a study PDF to begin";
  }, [document, uploading]);

  const handleOpenTool = (tool: StudyTool) => {
    setActiveTool(tool);
    setViewMode(tool);
  };

  const uploadPdf = async (file: File) => {
    setUploading(true);
    setQuestions([]);
    setMessages([]);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/study-search/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Could not upload PDF"
        );
      }
      setDocument(data.document);
      setRemainingDoubts(10);
      toast.success(
        data.document?.extractionSource === "gemini-ocr"
          ? "PDF indexed with OCR. Select a feature below to begin!"
          : "PDF indexed. Select a feature below to begin!"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload PDF";
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const [quizCount, setQuizCount] = useState<5 | 10>(5);

  const generateQuiz = async () => {
    if (!document) return;
    setGeneratingQuiz(true);
    try {
      const result = await apiFetch<{ quiz: { questions: QuizQuestion[] } }>(
        `/api/study-search/documents/${document.id}/quiz`,
        {
          method: "POST",
          body: JSON.stringify({ count: quizCount }),
        }
      );
      setQuestions(result.quiz.questions);
      toast.success(`${result.quiz.questions.length} quiz questions generated`);
    } catch (error) {
      handleError(error, "Could not generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const askDoubt = async (question: string) => {
    if (!document) return;
    const studentMessage: ChatMessage = {
      id: `student-${Date.now()}`,
      role: "student",
      text: question,
    };
    setMessages((current) => [...current, studentMessage]);
    setAsking(true);

    try {
      const result = await apiFetch<{
        answer: string;
        found: boolean;
        sources: Array<{ pageNumber: number; score: number }>;
        remainingDoubts: number;
      }>(`/api/study-search/documents/${document.id}/doubt`, {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      setRemainingDoubts(result.remainingDoubts);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: result.answer,
          found: result.found,
          sources: result.sources,
        },
      ]);
    } catch (error) {
      handleError(error, "Could not answer doubt");
    } finally {
      setAsking(false);
    }
  };

  const generatePdf = async (
    text: string,
    formatTag: "english" | "hindi" | "maths" | "summary" | "code" = "english"
  ) => {
    setGeneratingPdf(true);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    try {
      const response = await fetch("/api/study-search/text-to-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, formatTag }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not create PDF"
        );
      }

      const contentType = response.headers.get("content-type") || "";
      const isHtml = contentType.includes("text/html");
      setIsPdfBlobHtml(isHtml);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      if (isHtml) {
        toast.success("Document ready! Click 'Save as PDF' or 'Download' to save.");
      } else {
        toast.success("PDF ready! Click Download to save it.");
      }
    } catch (error) {
      handleError(error, "Could not create PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const saveAsPdf = () => {
    if (!pdfBlobUrl) return;
    const win = window.open(pdfBlobUrl, "_blank");
    if (!win) {
      toast.error("Pop-up blocked. Please allow pop-ups to view/print your document.");
    } else {
      toast.success("Print view opened! Select 'Save as PDF' to save your document.");
    }
  };

  const downloadPdf = () => {
    if (!pdfBlobUrl) return;
    if (isPdfBlobHtml) {
      const win = window.open(pdfBlobUrl, "_blank");
      if (!win) {
        toast.error("Pop-up blocked. Please allow pop-ups to view/print your document.");
      } else {
        toast.success("Opening print window! Select 'Save as PDF' to save.");
      }
    } else {
      const link = window.document.createElement("a");
      link.href = pdfBlobUrl;
      link.download = "study-notes.pdf";
      link.click();
      toast.success("PDF downloaded");
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      <PageTransition className="relative space-y-4">
        {/* Full Screen High-Tech Intro Splash Overlay */}
        <AnimatePresence>
          {showIntroSplash && (
            <SparksIntroSplash onComplete={() => setShowIntroSplash(false)} />
          )}
        </AnimatePresence>

        {/* Ambient Mesh Backdrop Glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-72 w-full max-w-4xl -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400/25 via-indigo-400/20 to-purple-400/25 dark:from-cyan-500/15 dark:via-indigo-500/15 dark:to-purple-500/15 blur-3xl opacity-80 dark:opacity-70" />

        {viewMode === "hub" ? (
          /* MAIN SPARKS AI HUB VIEW */
          <StaggerContainer delay={0.05} className="space-y-5 animate-in fade-in duration-300">
            {/* Header Card */}
            <StaggerItem>
              <div className="dashboard-surface flex flex-col gap-4 p-5 sm:p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 mb-1">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
                      <span>Sparks AI Workspace Hub</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                      Launch AI tools to generate quizzes, ask grounded doubts, format notes into PDFs, or build an ATS resume.
                    </p>
                  </div>
                </div>

                {/* Stat Widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-3 rounded-xl bg-background/50 p-3 border border-border/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Indexed Document</p>
                      <p className="text-xs font-bold truncate text-foreground">
                        {document ? document.fileName : "No PDF Uploaded"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-background/50 p-3 border border-border/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Exam Quiz</p>
                      <p className="text-xs font-bold text-foreground">
                        {questions.length > 0 ? `${questions.length} MCQs Generated` : "Ready (5 or 10 Qs)"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-background/50 p-3 border border-border/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Daily Doubts</p>
                      <p className="text-xs font-bold text-foreground">
                        {remainingDoubts} / 10 Left
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-background/50 p-3 border border-border/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PDF Exporter</p>
                      <p className="text-xs font-bold text-foreground">
                        15,000 Chars Limit
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </StaggerItem>

            {/* 3 Interactive Feature Launcher Cards */}
            <StaggerItem>
              <div className="space-y-3 pt-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  Select AI Feature to Launch
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Card 1: Exam Mode */}
                  <div
                    onClick={() => handleOpenTool("quiz")}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border border-cyan-500/30 bg-background/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 flex flex-col justify-between"
                  >
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all" />

                    <div className="space-y-4 relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
                        <BrainCircuit className="h-6 w-6" />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Feature #1</span>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                          AI Exam Mode
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Generate 5 or 10 interactive multiple-choice questions grounded in your course PDF and take timed exam tests.
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 relative z-10">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTool("quiz");
                        }}
                        className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-bold text-white shadow-md transition-all group-hover:brightness-110"
                      >
                        Launch Exam Mode →
                      </Button>
                    </div>
                  </div>

                  {/* Card 2: Ask Doubts (Gemini UI) */}
                  <div
                    onClick={() => handleOpenTool("doubt")}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border border-violet-500/30 bg-background/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400 hover:shadow-2xl hover:shadow-violet-500/20 flex flex-col justify-between"
                  >
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all" />

                    <div className="space-y-4 relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
                        <Sparkles className="h-6 w-6" />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Feature #2 • Sparks AI Chat</span>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-violet-400 transition-colors">
                          Ask Doubts AI
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Interactive AI chat grounded in your PDF notes with exact page citations & quick prompt chips.
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 relative z-10">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTool("doubt");
                        }}
                        className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold text-white shadow-md transition-all group-hover:brightness-110"
                      >
                        Launch Ask Doubts →
                      </Button>
                    </div>
                  </div>

                  {/* Card 3: Text to PDF Studio */}
                  <div
                    onClick={() => handleOpenTool("textToPdf")}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border border-emerald-500/30 bg-background/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 flex flex-col justify-between"
                  >
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />

                    <div className="space-y-4 relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                        <FileText className="h-6 w-6" />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Feature #3</span>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                          Text to PDF Studio
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Convert notes, text summaries, and unicode formulas into beautifully formatted, printable PDF documents.
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 relative z-10">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTool("textToPdf");
                        }}
                        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-md transition-all group-hover:brightness-110"
                      >
                        Launch Text to PDF →
                      </Button>
                    </div>
                  </div>

                  {/* Card 4: AI Resume Maker */}
                  <div
                    onClick={() => handleOpenTool("resume")}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border border-amber-500/30 bg-background/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/20 flex flex-col justify-between"
                  >
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all" />

                    <div className="space-y-4 relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                        <FileText className="h-6 w-6" />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Feature #4</span>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-amber-400 transition-colors">
                          AI Resume Maker
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Generate honest ATS resumes with editable previews, project links, work experience, and PDF downloads.
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 relative z-10">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTool("resume");
                        }}
                        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-bold text-white shadow-md transition-all group-hover:brightness-110"
                      >
                        Launch Resume Maker →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        ) : (
          /* DEDICATED FULL-SCREEN SUB-PAGE VIEW (React Portal overlaying entire screen including sidebar & topbar) */
          mounted && typeof window !== "undefined" ? (
            createPortal(
              <div
                onDragEnter={handlePortalDragEnter}
                onDragOver={handlePortalDragOver}
                onDragLeave={handlePortalDragLeave}
                onDrop={handlePortalDrop}
                className="fixed inset-0 z-[9999] h-screen w-screen overflow-y-auto bg-slate-950 text-slate-100 p-3.5 sm:p-6 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200"
              >
                {isPortalDragging && (
                  <div className="absolute inset-3 z-50 pointer-events-none rounded-3xl border-2 border-dashed border-cyan-400/80 bg-cyan-500/5 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 rounded-full bg-slate-900/95 px-5 py-2.5 text-xs sm:text-sm font-bold text-cyan-300 border border-cyan-500/50 shadow-2xl shadow-cyan-500/20">
                      <UploadCloud className="h-5 w-5 text-cyan-400 animate-bounce" />
                      <span>Drop PDF file to add & index...</span>
                    </div>
                  </div>
                )}

                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-4 h-full items-center">
                  <SubPageHeader
                    activeTool={activeTool}
                    document={document}
                    uploading={uploading}
                    quizCount={quizCount}
                    onCountChange={setQuizCount}
                    onBack={() => setViewMode("hub")}
                    onUpload={uploadPdf}
                    hasQuestions={questions.length > 0}
                    onDownloadQuiz={async () => {
                      if (!questions || questions.length === 0) return;
                      toast.loading("Generating Quiz PDF...", { id: "quiz-pdf" });
                      try {
                        const res = await fetch("/api/study-search/quiz-to-pdf", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            documentTitle: document?.fileName || "Course Study Material",
                            questions,
                          }),
                        });
                        if (!res.ok) throw new Error("Failed to generate Quiz PDF");
                        const contentType = res.headers.get("content-type") || "";
                        const blob = await res.blob();
                        const downloadUrl = window.URL.createObjectURL(blob);
                        if (contentType.includes("text/html")) {
                          const win = window.open(downloadUrl, "_blank");
                          if (!win) {
                            toast.error("Pop-up blocked. Please allow pop-ups.", { id: "quiz-pdf" });
                          } else {
                            toast.success("Quiz PDF ready in print view!", { id: "quiz-pdf" });
                          }
                        } else {
                          const a = window.document.createElement("a");
                          a.href = downloadUrl;
                          a.download = `${(document?.fileName || "Quiz_Paper").replace(/[^a-zA-Z0-9_\-]/g, "_")}_Quiz_Exam_Paper.pdf`;
                          window.document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(downloadUrl);
                          toast.success("Quiz PDF downloaded!", { id: "quiz-pdf" });
                        }
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to download Quiz PDF", { id: "quiz-pdf" });
                      }
                    }}
                    onSelectTool={(tool) => {
                      setActiveTool(tool);
                      setViewMode(tool);
                    }}
                  />

                  <div className="flex-1 flex flex-col items-center justify-between min-h-0 h-full w-full overflow-hidden">
                    {activeTool === "quiz" ? (
                      <QuizPanel
                        document={document}
                        questions={questions}
                        busy={generatingQuiz || uploading}
                        quizCount={quizCount}
                        onCountChange={setQuizCount}
                        onGenerate={generateQuiz}
                        onUpload={uploadPdf}
                      />
                    ) : activeTool === "doubt" ? (
                      <DoubtPanel
                        document={document}
                        messages={messages}
                        busy={asking || uploading}
                        remainingDoubts={remainingDoubts}
                        onAsk={askDoubt}
                        onUpload={uploadPdf}
                      />
                    ) : activeTool === "textToPdf" ? (
                      <TextToPdfPanel
                        busy={generatingPdf}
                        pdfReady={Boolean(pdfBlobUrl)}
                        onGenerate={generatePdf}
                        onSaveAsPdf={saveAsPdf}
                        onDownload={downloadPdf}
                      />
                    ) : (
                      <ResumeMakerPanel />
                    )}
                  </div>
                </div>
              </div>,
              window.document.body
            )
          ) : null
        )}
      </PageTransition>
    </div>
  );
}

export default StudySearchPage;

