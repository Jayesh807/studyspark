"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Clock,
  Gauge,
  Keyboard,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  GlassCard,
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Difficulty = "easy" | "medium" | "hard";
type ChallengeStatus = "ready" | "typing" | "finished";

interface TypingPrompt {
  id: string;
  difficulty: Difficulty;
  title: string;
  text: string;
}

interface BestScore {
  wpm: number;
  accuracy: number;
  score: number;
}

interface LeaderboardResult {
  id: string;
  username: string;
  difficulty: Difficulty;
  promptTitle: string;
  wpm: number;
  accuracy: number;
  mistakes: number;
  score: number;
  durationSec: number;
  createdAt: string;
}

interface LeaderboardResponse {
  top: LeaderboardResult[];
  recent: LeaderboardResult[];
  mine: LeaderboardResult | null;
  serverTime: string;
  unavailable?: boolean;
}

interface SubmitLeaderboardResponse {
  result: LeaderboardResult | null;
  saved: boolean;
  unavailable?: boolean;
}

const STORAGE_PREFIX = "studyspark:typing-best:";

const PROMPTS: TypingPrompt[] = [
  {
    id: "easy-1",
    difficulty: "easy",
    title: "Morning Focus",
    text: "Small steps every day can turn a difficult subject into something familiar and friendly.",
  },
  {
    id: "easy-2",
    difficulty: "easy",
    title: "Clean Notes",
    text: "Good notes are short, clear, and easy to review before a test or class discussion.",
  },
  {
    id: "medium-1",
    difficulty: "medium",
    title: "Study Rhythm",
    text: "A focused study session works best when you remove distractions, choose one target, and review what you learned before moving on.",
  },
  {
    id: "medium-2",
    difficulty: "medium",
    title: "Revision Loop",
    text: "Revision becomes easier when you test yourself first, correct mistakes carefully, and return to weak topics after a short break.",
  },
  {
    id: "hard-1",
    difficulty: "hard",
    title: "Deep Practice",
    text: "Mastery grows when deliberate practice, patient feedback, and consistent reflection turn confusing material into patterns you can recognize quickly.",
  },
  {
    id: "hard-2",
    difficulty: "hard",
    title: "Exam Momentum",
    text: "Before an important exam, the strongest preparation combines timed practice, spaced revision, calm rest, and honest tracking of unfinished chapters.",
  },
];

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; target: number; className: string }
> = {
  easy: {
    label: "Easy",
    target: 25,
    className: "from-emerald-500 to-teal-500",
  },
  medium: {
    label: "Medium",
    target: 38,
    className: "from-violet-500 to-cyan-500",
  },
  hard: {
    label: "Hard",
    target: 52,
    className: "from-rose-500 to-amber-500",
  },
};

function scoreKey(userId: string | undefined, difficulty: Difficulty) {
  return `${STORAGE_PREFIX}${userId ?? "guest"}:${difficulty}`;
}

function readBestScore(userId: string | undefined, difficulty: Difficulty) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(scoreKey(userId, difficulty));
    return raw ? (JSON.parse(raw) as BestScore) : null;
  } catch {
    return null;
  }
}

function writeBestScore(
  userId: string | undefined,
  difficulty: Difficulty,
  score: BestScore
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scoreKey(userId, difficulty), JSON.stringify(score));
  } catch {
    // Best scores are a local bonus only.
  }
}

function countMistakes(input: string, target: string) {
  let mistakes = 0;
  for (let i = 0; i < input.length; i += 1) {
    if (input[i] !== target[i]) mistakes += 1;
  }
  return mistakes;
}

function calculateWpm(correctChars: number, elapsedSeconds: number) {
  if (elapsedSeconds <= 0) return 0;
  return Math.round(correctChars / 5 / (elapsedSeconds / 60));
}

function formatRelativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (Number.isNaN(elapsed)) return "just now";
  const seconds = Math.max(0, Math.round(elapsed / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: ReactNode;
  tone: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden p-4 sm:p-5">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </div>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
            tone
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassCard>
  );
}

function LeaderboardRow({
  result,
  rank,
  compact = false,
}: {
  result: LeaderboardResult;
  rank?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background/70 p-3 ring-1 ring-border/50">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
          rank === 1
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
        )}
      >
        {rank ? `#${rank}` : <Zap className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold">{result.username}</p>
          <p className="shrink-0 text-sm font-bold tabular-nums">{result.score}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {result.wpm} WPM * {result.accuracy}% * {compact ? formatRelativeTime(result.createdAt) : result.promptTitle}
        </p>
      </div>
    </div>
  );
}

function PromptText({
  target,
  input,
}: {
  target: string;
  input: string;
}) {
  const words = useMemo(() => {
    const parts = target.match(/\S+\s*/g) ?? [target];
    return parts.map((word, index) => ({
      text: word,
      startIndex: parts.slice(0, index).join("").length,
    }));
  }, [target]);

  return (
    <div
      className="min-h-[300px] overflow-hidden rounded-[8px] bg-white p-3 font-mono text-[26px] font-medium leading-[58px] tracking-[0.16em] text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-200 sm:min-h-[380px] sm:p-4 sm:text-[34px] sm:leading-[72px] sm:tracking-[0.2em] dark:bg-zinc-950/85 dark:text-zinc-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:ring-zinc-800"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, transparent calc(100% - 1px), hsl(var(--border) / 0.78) calc(100% - 1px))",
        backgroundSize: "100% 72px",
      }}
      aria-label="Typing prompt"
    >
      {words.map((word, wordIndex) => {
        return (
          <span
            key={`${word.text}-${wordIndex}`}
            className="inline-block max-w-full whitespace-pre-wrap break-words align-baseline"
          >
            {word.text.split("").map((char, offset) => {
              const index = word.startIndex + offset;
              const typed = input[index];
              const isCurrent = index === input.length;
              const state =
                typed == null
                  ? "pending"
                  : typed === char
                    ? "correct"
                    : "wrong";
              return (
                <span
                  key={`${char}-${index}`}
                  className={cn(
                    "relative rounded-[5px] px-[3px]",
                    state === "correct" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/18 dark:text-emerald-300",
                    state === "wrong" && "bg-rose-100 text-rose-600 dark:bg-rose-500/18 dark:text-rose-300",
                    isCurrent && "text-zinc-900 dark:text-white"
                  )}
                >
                  {char}
                  {isCurrent && (
                    <motion.span
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-sky-500"
                    />
                  )}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

export function TypingChallengePage() {
  const userId = useAppStore((state) => state.user?.id);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [promptIndex, setPromptIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChallengeStatus>("ready");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [savedRunKey, setSavedRunKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const prompts = useMemo(
    () => PROMPTS.filter((prompt) => prompt.difficulty === difficulty),
    [difficulty]
  );
  const prompt = prompts[promptIndex % prompts.length] ?? prompts[0];
  const elapsedSeconds =
    startedAt == null
      ? 0
      : Math.max(0, ((finishedAt ?? Date.now()) - startedAt) / 1000);
  const mistakes = countMistakes(input, prompt.text);
  const correctChars = input
    .split("")
    .filter((char, index) => char === prompt.text[index]).length;
  const accuracy =
    input.length === 0 ? 100 : Math.max(0, Math.round((correctChars / input.length) * 100));
  const wpm = calculateWpm(correctChars, elapsedSeconds);
  const progress = Math.round((input.length / prompt.text.length) * 100);
  const targetWpm = DIFFICULTY_META[difficulty].target;
  const score = Math.max(0, Math.round(wpm * accuracy - mistakes * 12));
  const bestScore = readBestScore(userId, difficulty);

  const loadLeaderboard = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLeaderboardLoading(true);
      try {
        const data = await apiFetch<LeaderboardResponse>(
          `/api/typing-leaderboard?difficulty=${difficulty}`
        );
        setLeaderboard(data);
      } catch (error) {
        console.error("Failed to load typing leaderboard:", error);
        setLeaderboard({
          top: [],
          recent: [],
          mine: null,
          serverTime: new Date().toISOString(),
          unavailable: true,
        });
      } finally {
        if (showLoading) setLeaderboardLoading(false);
      }
    },
    [difficulty]
  );

  useEffect(() => {
    let active = true;
    const load = () => {
      if (!active) return;
      void loadLeaderboard(true);
    };
    const timer = window.setTimeout(load, 0);
    const interval = window.setInterval(() => {
      if (active) void loadLeaderboard(false);
    }, 5000);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadLeaderboard]);

  const playTypingSound = (kind: "key" | "backspace" | "button" = "key") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      const context =
        audioContextRef.current ??
        new AudioContextClass({ latencyHint: "interactive" });
      audioContextRef.current = context;
      if (context.state === "suspended") {
        void context.resume();
      }

      const now = context.currentTime;
      const isBackspace = kind === "backspace";
      const isButton = kind === "button";

      const clickBuffer = context.createBuffer(
        1,
        Math.floor(context.sampleRate * (isBackspace ? 0.022 : 0.016)),
        context.sampleRate
      );
      const clickData = clickBuffer.getChannelData(0);
      for (let i = 0; i < clickData.length; i += 1) {
        const fade = 1 - i / clickData.length;
        clickData[i] = (Math.random() * 2 - 1) * fade * fade;
      }

      const clickSource = context.createBufferSource();
      const clickFilter = context.createBiquadFilter();
      const clickGain = context.createGain();
      clickSource.buffer = clickBuffer;
      clickFilter.type = "bandpass";
      clickFilter.frequency.setValueAtTime(
        (isBackspace ? 1800 : 3000) + Math.random() * 550,
        now
      );
      clickFilter.Q.setValueAtTime(isBackspace ? 1.1 : 1.8, now);
      clickGain.gain.setValueAtTime(0.0001, now);
      clickGain.gain.exponentialRampToValueAtTime(
        isButton ? 0.12 : isBackspace ? 0.14 : 0.13,
        now + 0.002
      );
      clickGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + (isBackspace ? 0.024 : 0.017)
      );

      const thock = context.createOscillator();
      const thockGain = context.createGain();
      thock.type = "triangle";
      thock.frequency.setValueAtTime(
        (isBackspace ? 82 : 120) + Math.random() * 30,
        now
      );
      thock.frequency.exponentialRampToValueAtTime(
        (isBackspace ? 58 : 76) + Math.random() * 18,
        now + 0.032
      );
      thockGain.gain.setValueAtTime(0.0001, now);
      thockGain.gain.exponentialRampToValueAtTime(
        isBackspace ? 0.06 : 0.045,
        now + 0.004
      );
      thockGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + (isBackspace ? 0.052 : 0.04)
      );

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, now);
      compressor.knee.setValueAtTime(8, now);
      compressor.ratio.setValueAtTime(3, now);

      clickSource.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(compressor);
      thock.connect(thockGain);
      thockGain.connect(compressor);
      compressor.connect(context.destination);

      clickSource.start(now);
      clickSource.stop(now + (isBackspace ? 0.026 : 0.02));
      thock.start(now);
      thock.stop(now + (isBackspace ? 0.06 : 0.048));
    } catch {
      // Typing sound is a small enhancement; ignore unsupported audio contexts.
    }
  };

  const handleTypingKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Backspace") {
      playTypingSound("backspace");
    } else if (event.key.length === 1 || event.key === "Enter") {
      playTypingSound("key");
    }
  };

  const submitTypingResult = useCallback(
    async (result: {
      runKey: string;
      wpm: number;
      accuracy: number;
      mistakes: number;
      score: number;
      durationSec: number;
    }) => {
      if (savedRunKey === result.runKey) return;
      setSavedRunKey(result.runKey);
      try {
        await apiFetch<SubmitLeaderboardResponse>("/api/typing-leaderboard", {
          method: "POST",
          body: JSON.stringify({
            difficulty,
            promptTitle: prompt.title,
            wpm: result.wpm,
            accuracy: result.accuracy,
            mistakes: result.mistakes,
            score: result.score,
            durationSec: result.durationSec,
          }),
        });
        await loadLeaderboard(false);
      } catch (error) {
        setSavedRunKey(null);
        console.error("Failed to save typing score:", error);
      }
    },
    [difficulty, loadLeaderboard, prompt.title, savedRunKey]
  );

  const finishChallenge = (nextInput: string) => {
    const doneAt = Date.now();
    const nextMistakes = countMistakes(nextInput, prompt.text);
    const nextCorrect = nextInput
      .split("")
      .filter((char, index) => char === prompt.text[index]).length;
    const nextElapsed = startedAt ? Math.max(0.1, (doneAt - startedAt) / 1000) : 0.1;
    const nextAccuracy = Math.max(0, Math.round((nextCorrect / nextInput.length) * 100));
    const nextWpm = calculateWpm(nextCorrect, nextElapsed);
    const nextScore = Math.max(0, Math.round(nextWpm * nextAccuracy - nextMistakes * 12));

    setStatus("finished");
    setFinishedAt(doneAt);
    const betterThanBest = !bestScore || nextScore > bestScore.score;
    setNewBest(betterThanBest);
    if (!bestScore || nextScore > bestScore.score) {
      writeBestScore(userId, difficulty, {
        wpm: nextWpm,
        accuracy: nextAccuracy,
        score: nextScore,
      });
    }
    void submitTypingResult({
      runKey: `${prompt.id}:${startedAt ?? doneAt}:${doneAt}`,
      wpm: nextWpm,
      accuracy: nextAccuracy,
      mistakes: nextMistakes,
      score: nextScore,
      durationSec: nextElapsed,
    });
  };

  const handleInput = (value: string) => {
    if (status === "finished") return;
    const next = value.slice(0, prompt.text.length);
    if (status === "ready") {
      setStatus("typing");
      setStartedAt(Date.now());
      setFinishedAt(null);
    }
    setInput(next);
    if (next.length >= prompt.text.length) {
      finishChallenge(next);
    }
  };

  const clickWithSound = (action: () => void) => {
    playTypingSound("button");
    action();
  };

  const reset = () => {
    setInput("");
    setStatus("ready");
    setStartedAt(null);
    setFinishedAt(null);
    setNewBest(false);
    setSavedRunKey(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const nextPrompt = () => {
    setPromptIndex((index) => index + 1);
    setInput("");
    setStatus("ready");
    setStartedAt(null);
    setFinishedAt(null);
    setNewBest(false);
    setSavedRunKey(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const changeDifficulty = (value: Difficulty) => {
    setDifficulty(value);
    setPromptIndex(0);
    setInput("");
    setStatus("ready");
    setStartedAt(null);
    setFinishedAt(null);
    setNewBest(false);
    setSavedRunKey(null);
  };

  return (
    <PageTransition className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300">
            <Keyboard className="h-3.5 w-3.5" />
            Skill game
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Typing Challenge
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Type the paragraph quickly and accurately. Build speed for notes, assignments, coding, and exam prep.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={difficulty}
            onValueChange={(value) =>
              clickWithSound(() => changeDifficulty(value as Difficulty))
            }
          >
            <SelectTrigger
              onClick={() => playTypingSound("button")}
              className="w-full rounded-[5px] sm:w-40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((item) => (
                <SelectItem key={item} value={item}>
                  {DIFFICULTY_META[item].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => clickWithSound(nextPrompt)}
            variant="outline"
            className="rounded-[5px]"
          >
            <RefreshCw className="h-4 w-4" />
            New Text
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          icon={Gauge}
          label="WPM"
          value={<AnimatedCounter value={wpm} />}
          tone="from-violet-500 to-cyan-500"
        />
        <StatCard
          icon={Target}
          label="Accuracy"
          value={`${accuracy}%`}
          tone="from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={XCircle}
          label="Mistakes"
          value={<AnimatedCounter value={mistakes} />}
          tone="from-rose-500 to-pink-500"
        />
        <StatCard
          icon={Clock}
          label="Time"
          value={`${elapsedSeconds.toFixed(1)}s`}
          tone="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={Trophy}
          label="Score"
          value={<AnimatedCounter value={score} />}
          tone="from-blue-500 to-indigo-500"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <GlassCard className="overflow-hidden p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-400">
                <Sparkles className="h-3.5 w-3.5" />
                {prompt.title}
              </div>
              <h2 className="mt-3 text-xl font-bold tracking-tight">
                {status === "finished" ? "Challenge complete" : "Start typing below"}
              </h2>
            </div>
            <div
              className={cn(
                "rounded-2xl bg-gradient-to-br px-4 py-3 text-sm font-bold text-white shadow-lg",
                DIFFICULTY_META[difficulty].className
              )}
            >
              Target {targetWpm} WPM
            </div>
          </div>

          <div
            className="relative cursor-text rounded-[8px] focus-within:ring-4 focus-within:ring-violet-500/20"
            onClick={() => inputRef.current?.focus()}
          >
            <PromptText target={prompt.text} input={input} />
            <textarea
              ref={inputRef}
              value={input}
              disabled={status === "finished"}
              onChange={(event) => handleInput(event.target.value)}
              spellCheck={false}
              aria-label="Typing challenge input"
              onKeyDown={handleTypingKeyDown}
              className="absolute inset-0 z-10 h-full w-full resize-none border-0 bg-transparent p-0 text-transparent opacity-0 caret-transparent outline-none"
            />
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
              <span>{input.length}/{prompt.text.length} characters</span>
              <span>{progress}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => clickWithSound(reset)}
              variant="outline"
              className="rounded-[5px]"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
            <Button
              onClick={() => clickWithSound(nextPrompt)}
              className="rounded-[5px] bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
            >
              <RefreshCw className="h-4 w-4" />
              New Challenge
            </Button>
          </div>
        </GlassCard>

        <aside className="space-y-6">
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Trophy className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Live Leaderboard</h2>
                  <p className="text-xs text-muted-foreground">
                    Updates every few seconds.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => clickWithSound(() => void loadLeaderboard(true))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Refresh leaderboard"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {leaderboardLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[66px] animate-pulse rounded-2xl bg-muted/45 ring-1 ring-border/40"
                  />
                ))}
              </div>
            ) : leaderboard?.unavailable ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-center">
                <Trophy className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">Leaderboard unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your typing game still works. Scores will appear when the database connection is available.
                </p>
              </div>
            ) : !leaderboard || leaderboard.top.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-center">
                <Trophy className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">No scores yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete a challenge to claim the first spot.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.top.slice(0, 5).map((result, index) => (
                  <LeaderboardRow
                    key={result.id}
                    result={result}
                    rank={index + 1}
                  />
                ))}
              </div>
            )}

            {leaderboard?.mine && (
              <div className="mt-4 rounded-2xl bg-cyan-500/10 p-3 ring-1 ring-cyan-500/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                  Your best
                </p>
                <p className="mt-1 text-sm font-bold">
                  {leaderboard.mine.score} pts * {leaderboard.mine.wpm} WPM * {leaderboard.mine.accuracy}%
                </p>
              </div>
            )}
          </GlassCard>

          {leaderboard?.recent && leaderboard.recent.length > 0 && (
            <GlassCard className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Recent Runs</h2>
                  <p className="text-xs text-muted-foreground">Latest completed challenges.</p>
                </div>
              </div>
              <div className="space-y-2">
                {leaderboard.recent.slice(0, 4).map((result) => (
                  <LeaderboardRow key={result.id} result={result} compact />
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Best Score</h2>
                <p className="text-xs text-muted-foreground">
                  Saved locally for this difficulty.
                </p>
              </div>
            </div>
            {bestScore ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-muted/35 p-3 text-center ring-1 ring-border/50">
                  <p className="text-lg font-bold">{bestScore.wpm}</p>
                  <p className="text-[10px] text-muted-foreground">WPM</p>
                </div>
                <div className="rounded-2xl bg-muted/35 p-3 text-center ring-1 ring-border/50">
                  <p className="text-lg font-bold">{bestScore.accuracy}%</p>
                  <p className="text-[10px] text-muted-foreground">ACC</p>
                </div>
                <div className="rounded-2xl bg-muted/35 p-3 text-center ring-1 ring-border/50">
                  <p className="text-lg font-bold">{bestScore.score}</p>
                  <p className="text-[10px] text-muted-foreground">PTS</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-center">
                <Trophy className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">No best yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Finish one run to set your record.
                </p>
              </div>
            )}
            {newBest && (
              <div className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                New personal best!
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Modes</h2>
                <p className="text-xs text-muted-foreground">Pick your training level.</p>
              </div>
            </div>
            <StaggerContainer className="space-y-2">
              {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((item) => {
                const active = item === difficulty;
                return (
                  <StaggerItem key={item}>
                    <button
                      onClick={() => clickWithSound(() => changeDifficulty(item))}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl p-3 text-left transition-colors",
                        active
                          ? "bg-gradient-to-r from-violet-500/15 to-cyan-500/10 ring-1 ring-violet-500/25"
                          : "bg-background/70 ring-1 ring-border/50 hover:bg-accent/60"
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold">
                          {DIFFICULTY_META[item].label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target {DIFFICULTY_META[item].target} WPM
                        </span>
                      </span>
                      {active && <CheckCircle2 className="h-4 w-4 text-violet-500" />}
                    </button>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </GlassCard>
        </aside>
      </div>
    </PageTransition>
  );
}

export default TypingChallengePage;
