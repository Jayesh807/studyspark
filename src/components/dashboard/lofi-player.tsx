"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Music, Radio } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Module-level singleton audio — lives for the entire browser session,
// completely independent of React component mount/unmount cycles.
// ---------------------------------------------------------------------------
const STATIONS = [
  { name: "Groove Salad",   label: "Ambient / Lo-Fi", url: "https://ice1.somafm.com/groovesalad-256-mp3"    },
  { name: "Drone Zone",     label: "Deep Focus",      url: "https://ice1.somafm.com/dronezone-256-mp3"      },
  { name: "Sonic Universe", label: "Jazz / Chill",    url: "https://ice1.somafm.com/sonicuniverse-256-mp3"  },
];

// Singleton audio element — created once, never destroyed
let _audio: HTMLAudioElement | null = null;
let _stationIdx = 0;
let _volume = 0.7;
let _muted = false;

function getAudio(): HTMLAudioElement {
  if (!_audio && typeof window !== "undefined") {
    _audio = new Audio();
    _audio.preload = "none";
    _audio.volume = _volume;
  }
  return _audio!;
}

/** Call this on logout to stop music and reset state. */
export function stopRadio() {
  if (_audio && !_audio.paused) {
    _audio.pause();
  }
  notifyAll();
}

// Global listener registry so multiple mounts stay in sync
type Listener = () => void;
const listeners = new Set<Listener>();
function notifyAll() { listeners.forEach((fn) => fn()); }

// ---------------------------------------------------------------------------

interface LofiPlayerProps {
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function LofiPlayer({ onPlayingChange }: LofiPlayerProps = {}) {
  // Derive display state from the singleton — re-render by subscribing
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  useEffect(() => {
    listeners.add(refresh);

    const audio = getAudio();

    const onPlaying = () => { notifyAll(); onPlayingChange?.(true);  };
    const onPause   = () => { notifyAll(); onPlayingChange?.(false); };
    const onError   = () => { notifyAll(); onPlayingChange?.(false); };
    const onWaiting = () => notifyAll();

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause",   onPause);
    audio.addEventListener("error",   onError);
    audio.addEventListener("waiting", onWaiting);

    // Sync playing state into parent on mount (in case already playing)
    onPlayingChange?.(!audio.paused);

    return () => {
      listeners.delete(refresh);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause",   onPause);
      audio.removeEventListener("error",   onError);
      audio.removeEventListener("waiting", onWaiting);
      // NOTE: we do NOT pause or clear src here — music keeps playing!
    };
  }, [refresh, onPlayingChange]);

  const audio        = typeof window !== "undefined" ? getAudio() : null;
  const isPlaying    = audio ? !audio.paused : false;
  const isLoading    = audio ? audio.readyState < 3 && !audio.paused : false;
  const station      = STATIONS[_stationIdx];

  const handlePlay = () => {
    const a = getAudio();
    if (!a.paused) {
      a.pause();
    } else {
      if (!a.src || a.networkState === HTMLMediaElement.NETWORK_EMPTY) {
        a.src = station.url;
        a.load();
      }
      a.play().catch(() => {});
    }
    notifyAll();
  };

  const handleVolumeChange = (value: number[]) => {
    const v = value[0] / 100;
    _volume = v;
    const a = getAudio();
    a.volume = v;
    if (_muted && v > 0) {
      _muted = false;
      a.muted = false;
    }
    notifyAll();
  };

  const toggleMute = () => {
    const a = getAudio();
    _muted = !_muted;
    a.muted = _muted;
    notifyAll();
  };

  const nextStation = () => {
    _stationIdx = (_stationIdx + 1) % STATIONS.length;
    const a = getAudio();
    const wasPlaying = !a.paused;
    a.pause();
    a.src = STATIONS[_stationIdx].url;
    if (wasPlaying) {
      a.load();
      a.play().catch(() => {});
    }
    notifyAll();
  };

  return (
    <GlassCard className="p-4 sm:p-5 relative overflow-hidden group">
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
            {station.name}
            <span className="text-xs text-muted-foreground font-normal ml-1">• {station.label}</span>
          </p>
        </div>

        {/* Station Switcher */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 shrink-0"
          onClick={nextStation}
          title="Next station"
        >
          <Radio className="h-4 w-4" />
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
            value={[_muted ? 0 : Math.round(_volume * 100)]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1 cursor-pointer"
          />
        </div>
      </div>

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
          value={[_muted ? 0 : Math.round(_volume * 100)]}
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
