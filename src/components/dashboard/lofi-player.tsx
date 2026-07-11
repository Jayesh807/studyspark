"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Music, Settings, Check, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

// Helper to extract YouTube Video ID from any standard link format
function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function getDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return "Custom Audio Stream";
  }
}

// Helper to format seconds as mm:ss
function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Default stream config (Lofi Girl stream requested by user)
const DEFAULT_YT_ID = "M8YHJcfgC6U";
const DEFAULT_URL = "https://youtu.be/M8YHJcfgC6U?si=pg_gHS8Pj-Os1AHC";

// Singleton states to persist playback session across mount/unmount
let _volume = 70;
let _muted = false;
let _currentType: "youtube" | "audio" = "youtube";
let _ytVideoId = DEFAULT_YT_ID;
let _audioUrl = "";
let _streamName = "Lofi Girl (Live)";
let _streamLabel = "Chilled beats";
let _inputUrlValue = DEFAULT_URL;

let _ytPlayer: any = null;
let _audioElement: HTMLAudioElement | null = null;
let _apiLoading = false;
let _apiReady = false;

// Global listeners registry to notify all mounted React instances of state changes
type Listener = () => void;
const listeners = new Set<Listener>();
function notifyAll() {
  listeners.forEach((fn) => fn());
}

// Initialize LocalStorage states safely on load
if (typeof window !== "undefined") {
  _volume = Number(localStorage.getItem("lofi-volume") ?? "70");
  _muted = localStorage.getItem("lofi-muted") === "true";
  _currentType = (localStorage.getItem("lofi-type") as "youtube" | "audio") ?? "youtube";
  _ytVideoId = localStorage.getItem("lofi-yt-videoid") ?? DEFAULT_YT_ID;
  _audioUrl = localStorage.getItem("lofi-audio-url") ?? "";
  _streamName = localStorage.getItem("lofi-stream-name") ?? "Lofi Girl (Live)";
  _streamLabel = localStorage.getItem("lofi-stream-label") ?? "Chilled beats";
  _inputUrlValue = localStorage.getItem("lofi-input-url") ?? DEFAULT_URL;
}

// Setup global container on body for YouTube iframe to prevent it from being unmounted by React
function getYTContainer(): HTMLDivElement | null {
  if (typeof window === "undefined") return null;
  let container = document.getElementById("global-yt-player-container") as HTMLDivElement;
  if (!container) {
    container = document.createElement("div");
    container.id = "global-yt-player-container";
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = "200px";
    container.style.height = "200px";
    container.style.zIndex = "-1000";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);

    const target = document.createElement("div");
    target.id = "yt-player-target";
    container.appendChild(target);
  }
  return container;
}

// Get or create HTML5 Audio Element singleton
function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!_audioElement) {
    _audioElement = new Audio();
    _audioElement.preload = "none";
    _audioElement.volume = _volume / 100;
  }
  return _audioElement;
}

// Initialize YouTube API and Player
function initYTPlayer(onReadyCallback: () => void) {
  if (typeof window === "undefined") return;
  if (_ytPlayer) {
    onReadyCallback();
    return;
  }

  getYTContainer(); // Ensure container exists

  window.onYouTubeIframeAPIReady = () => {
    _apiReady = true;
    try {
      _ytPlayer = new window.YT.Player("yt-player-target", {
        height: "200",
        width: "200",
        videoId: _ytVideoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(_volume);
            if (_muted) event.target.mute();
            onReadyCallback();
          },
          onStateChange: () => {
            notifyAll();
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize YT Player", e);
    }
  };

  if (!_apiLoading) {
    _apiLoading = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  } else if (_apiReady) {
    window.onYouTubeIframeAPIReady();
  }
}

// Call this on logout to stop all playing music
export function stopRadio() {
  if (_audioElement) {
    _audioElement.pause();
  }
  if (_ytPlayer && typeof _ytPlayer.pauseVideo === "function") {
    try {
      _ytPlayer.pauseVideo();
    } catch { }
  }
  notifyAll();
}

interface LofiPlayerProps {
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function LofiPlayer({ onPlayingChange }: LofiPlayerProps = {}) {
  const [, forceUpdate] = useState(0);
  const [ytReady, setYtReady] = useState(!!_ytPlayer);
  const [showSettings, setShowSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState(_inputUrlValue);
  const [urlError, setUrlError] = useState("");
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  // Time polling effect
  useEffect(() => {
    let intervalId: any;

    const updateTimes = () => {
      if (isDragging) return;

      if (_currentType === "youtube") {
        if (_ytPlayer && typeof _ytPlayer.getCurrentTime === "function" && ytReady) {
          try {
            setCurrentTime(_ytPlayer.getCurrentTime());
            const d = _ytPlayer.getDuration();
            if (d && isFinite(d)) {
              setDuration(d);
            } else {
              setDuration(0);
            }
          } catch { }
        }
      } else {
        const audio = getAudioElement();
        if (audio) {
          setCurrentTime(audio.currentTime);
          const d = audio.duration;
          if (d && isFinite(d)) {
            setDuration(d);
          } else {
            setDuration(0);
          }
        }
      }
    };

    updateTimes();

    // Determine if it is playing using the exact same logic
    const audio = typeof window !== "undefined" ? getAudioElement() : null;
    let playing = false;
    if (_currentType === "youtube") {
      if (_ytPlayer && typeof _ytPlayer.getPlayerState === "function" && ytReady) {
        try {
          playing = _ytPlayer.getPlayerState() === 1;
        } catch { }
      }
    } else {
      playing = audio ? !audio.paused : false;
    }

    if (playing) {
      intervalId = setInterval(updateTimes, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [ytReady, isDragging]);

  const handleSeekChange = (val: number[]) => {
    setIsDragging(true);
    setCurrentTime(val[0]);
  };

  const handleSeekCommit = (val: number[]) => {
    const time = val[0];
    setCurrentTime(time);
    setIsDragging(false);
    if (_currentType === "youtube") {
      if (_ytPlayer && typeof _ytPlayer.seekTo === "function" && ytReady) {
        try {
          _ytPlayer.seekTo(time, true);
        } catch { }
      }
    } else {
      const audio = getAudioElement();
      if (audio) {
        audio.currentTime = time;
      }
    }
  };

  useEffect(() => {
    listeners.add(refresh);

    if (_currentType === "youtube") {
      initYTPlayer(() => setYtReady(true));
    }

    const audio = getAudioElement();
    const handleAudioEvent = () => notifyAll();

    if (audio) {
      audio.addEventListener("playing", handleAudioEvent);
      audio.addEventListener("pause", handleAudioEvent);
      audio.addEventListener("waiting", handleAudioEvent);
      audio.addEventListener("error", handleAudioEvent);
    }

    return () => {
      listeners.delete(refresh);
      if (audio) {
        audio.removeEventListener("playing", handleAudioEvent);
        audio.removeEventListener("pause", handleAudioEvent);
        audio.removeEventListener("waiting", handleAudioEvent);
        audio.removeEventListener("error", handleAudioEvent);
      }
    };
  }, [refresh]);

  // Determine global playing/loading states
  const audio = typeof window !== "undefined" ? getAudioElement() : null;
  let isPlaying = false;
  let isLoading = false;

  if (_currentType === "youtube") {
    if (_ytPlayer && typeof _ytPlayer.getPlayerState === "function" && ytReady) {
      try {
        const state = _ytPlayer.getPlayerState();
        isPlaying = state === 1; // 1 = PLAYING
        isLoading = state === 3; // 3 = BUFFERING
      } catch { }
    }
  } else {
    isPlaying = audio ? !audio.paused : false;
    isLoading = audio ? audio.readyState < 3 && !audio.paused : false;
  }

  const isLive = _ytVideoId === DEFAULT_YT_ID || duration === 0 || isNaN(duration) || !isFinite(duration);

  // Update topbar playing indicator state
  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  const handlePlay = () => {
    if (_currentType === "youtube") {
      if (!ytReady) {
        initYTPlayer(() => {
          setYtReady(true);
          if (_ytPlayer && typeof _ytPlayer.playVideo === "function") {
            try { _ytPlayer.playVideo(); } catch { }
          }
        });
        return;
      }
      if (isPlaying) {
        if (_ytPlayer && typeof _ytPlayer.pauseVideo === "function") {
          try { _ytPlayer.pauseVideo(); } catch { }
        }
      } else {
        if (audio) audio.pause();
        if (_ytPlayer && typeof _ytPlayer.playVideo === "function") {
          try { _ytPlayer.playVideo(); } catch { }
        }
      }
    } else {
      if (_ytPlayer && typeof _ytPlayer.pauseVideo === "function" && ytReady) {
        try { _ytPlayer.pauseVideo(); } catch { }
      }
      if (audio) {
        if (isPlaying) {
          audio.pause();
        } else {
          if (!audio.src || audio.src === window.location.href) {
            audio.src = _audioUrl;
            audio.load();
          }
          audio.play().catch(() => { });
        }
      }
    }
    notifyAll();
  };

  const handleVolumeChange = (value: number[]) => {
    const v = value[0];
    _volume = v;
    _muted = v === 0;
    localStorage.setItem("lofi-volume", String(v));
    localStorage.setItem("lofi-muted", String(_muted));

    if (audio) {
      audio.volume = v / 100;
      audio.muted = _muted;
    }
    if (_ytPlayer && typeof _ytPlayer.setVolume === "function" && ytReady) {
      try {
        _ytPlayer.setVolume(v);
        if (_muted) _ytPlayer.mute();
        else _ytPlayer.unMute();
      } catch { }
    }
    notifyAll();
  };

  const toggleMute = () => {
    _muted = !_muted;
    localStorage.setItem("lofi-muted", String(_muted));
    if (audio) {
      audio.muted = _muted;
    }
    if (_ytPlayer && ytReady) {
      try {
        if (_muted) _ytPlayer.mute();
        else _ytPlayer.unMute();
      } catch { }
    }
    notifyAll();
  };

  // Process the user's submitted custom URL
  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");
    setLoadSuccess(false);

    if (!customUrl.trim()) {
      setUrlError("Please enter a URL");
      return;
    }

    const wasPlaying = isPlaying;

    // Stop current playbacks
    if (audio) audio.pause();
    if (_ytPlayer && typeof _ytPlayer.pauseVideo === "function" && ytReady) {
      try { _ytPlayer.pauseVideo(); } catch { }
    }

    // Save current input string to localStorage
    _inputUrlValue = customUrl;
    localStorage.setItem("lofi-input-url", customUrl);

    // Try YouTube match first
    const ytId = getYoutubeId(customUrl);
    if (ytId) {
      _currentType = "youtube";
      _ytVideoId = ytId;

      // If it's the default song, keep the nice default titles
      if (ytId === DEFAULT_YT_ID) {
        _streamName = "Lofi Girl (Live)";
        _streamLabel = "Chilled beats";
      } else {
        _streamName = "Custom YouTube Stream";
        _streamLabel = "Play via YouTube API";
      }

      localStorage.setItem("lofi-type", "youtube");
      localStorage.setItem("lofi-yt-videoid", ytId);
      localStorage.setItem("lofi-stream-name", _streamName);
      localStorage.setItem("lofi-stream-label", _streamLabel);

      if (!_ytPlayer) {
        setYtReady(false);
        initYTPlayer(() => {
          setYtReady(true);
          if (wasPlaying && _ytPlayer && typeof _ytPlayer.playVideo === "function") {
            try { _ytPlayer.playVideo(); } catch { }
          }
        });
      } else {
        try {
          if (typeof _ytPlayer.cueVideoById === "function") {
            _ytPlayer.cueVideoById({ videoId: ytId });
          }
          if (wasPlaying && typeof _ytPlayer.playVideo === "function") {
            _ytPlayer.playVideo();
          }
        } catch { }
      }
    } else {
      // Treat as direct audio stream link
      try {
        new URL(customUrl); // validate URL format
        _currentType = "audio";
        _audioUrl = customUrl;
        _streamName = "Custom Audio Stream";
        _streamLabel = getDomainName(customUrl);

        localStorage.setItem("lofi-type", "audio");
        localStorage.setItem("lofi-audio-url", customUrl);
        localStorage.setItem("lofi-stream-name", _streamName);
        localStorage.setItem("lofi-stream-label", _streamLabel);

        if (audio) {
          audio.src = customUrl;
          if (wasPlaying) {
            audio.load();
            audio.play().catch(() => { });
          }
        }
      } catch {
        setUrlError("Invalid URL. Enter a YouTube link or a direct audio URL.");
        return;
      }
    }

    setLoadSuccess(true);
    notifyAll();
    setTimeout(() => setLoadSuccess(false), 2000);
  };

  return (
    <GlassCard className="p-4 sm:p-5 relative overflow-hidden group flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full border-border/50 transition-all shrink-0",
            isPlaying
              ? "bg-violet-500/10 text-violet-500 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
              : "bg-background/50 hover:bg-muted"
          )}
          onClick={handlePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <span className="h-4 w-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </Button>

        {/* Station Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Music className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
              Study Radio
            </span>
          </div>
          <p className="text-sm font-medium truncate text-foreground/90">
            {_streamName}
            <span className="text-xs text-muted-foreground font-normal ml-1">• {_streamLabel}</span>
          </p>
        </div>

        {/* Configure / URL Settings Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 shrink-0 transition-all",
            showSettings && "bg-violet-500/10 text-violet-500 rotate-45"
          )}
          onClick={() => setShowSettings(!showSettings)}
          title="Change Music Link"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Volume Control — desktop */}
        <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
            onClick={toggleMute}
          >
            {_muted || _volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[_muted ? 0 : _volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Seek/Progress Bar */}
      {!isLive && duration > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 px-1 border-t border-border/20 transition-all duration-300">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekCommit}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono leading-none">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(duration - currentTime)}</span>
          </div>
        </div>
      )}

      {/* Settings Input Form */}
      {showSettings && (
        <form onSubmit={handleLoadUrl} className="flex flex-col gap-2 pt-3 border-t border-border/40 transition-all">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Paste YouTube Video / Audio Stream Link
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="https://youtu.be/... or stream.mp3"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="h-9 text-xs bg-background/50 border-border/50 focus-visible:ring-violet-500"
            />
            <Button
              type="submit"
              size="sm"
              className={cn(
                "h-9 shrink-0 text-xs px-3 transition-all",
                loadSuccess ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-violet-500 hover:bg-violet-600 text-white"
              )}
            >
              {loadSuccess ? <Check className="h-4 w-4" /> : "Load"}
            </Button>
          </div>
          {urlError && (
            <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {urlError}
            </p>
          )}
        </form>
      )}

      {/* Volume Control — mobile */}
      <div className="flex sm:hidden items-center gap-3 mt-4 pt-4 border-t border-border/40">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
          onClick={toggleMute}
        >
          {_muted || _volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[_muted ? 0 : _volume]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="flex-1 cursor-pointer"
        />
      </div>

      {/* Decorative glow when playing */}
      {isPlaying && (
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}
    </GlassCard>
  );
}
