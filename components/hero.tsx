"use client";

import { useEffect, useRef, useState, useCallback } from "react";


/**
 * CONFIG
 */
const STATIC_LOGO_SRC = "/images/hero-gifs/static-logo.png";

const GIF_SOURCES = [
  "/images/hero-gifs/animation-1.gif",
  "/images/hero-gifs/animation-2.gif",
  "/images/hero-gifs/animation-3.gif",
  "/images/hero-gifs/animation-4.gif",
  "/images/hero-gifs/animation-5.gif",
  "/images/hero-gifs/animation-6.gif",
  "/images/hero-gifs/animation-7.gif",
];

/** How long to show the static logo before the first animation */
const INITIAL_DELAY = 5000;
/** How long each GIF plays (should match or exceed the actual GIF duration) */
const GIF_PLAY_DURATION = 3600;
/** Pause on the static logo between animations */
const PAUSE_BETWEEN = 4000;

/**
 * GIF Sequencer — instant swap approach (no crossfade).
 *
 * The GIFs have an internal loop count of 1. To "reset" them we must
 * force the browser to re-fetch a fresh copy each time by appending a
 * unique query string.
 *
 * Flow:
 *   1. Show static logo for INITIAL_DELAY ms.
 *   2. Preload next GIF via `new Image()`. Once loaded, swap it in
 *      instantly (opacity 1, static hidden).
 *   3. After GIF_PLAY_DURATION ms, swap back to static instantly.
 *   4. Wait PAUSE_BETWEEN ms, then go to step 2 for the next GIF.
 */
function useGifSequencer() {
  // "active" = the cache-busted src currently showing, or null = show static
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const gifIndexRef = useRef(0);
  const cancelRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const runSequence = useCallback(() => {
    if (cancelRef.current) return;

    const idx = gifIndexRef.current;
    const freshSrc = `${GIF_SOURCES[idx]}?t=${Date.now()}`;

    // Preload the GIF so it starts from frame 0 in the DOM
    const img = new Image();
    img.src = freshSrc;

    const onReady = () => {
      if (cancelRef.current) return;
      // Instant swap — show the GIF
      setActiveSrc(freshSrc);

      // After the GIF has played, swap back to static
      addTimer(() => {
        if (cancelRef.current) return;
        setActiveSrc(null);

        // Advance to next GIF
        gifIndexRef.current = (idx + 1) % GIF_SOURCES.length;

        // Pause, then play next
        addTimer(() => {
          runSequence();
        }, PAUSE_BETWEEN);
      }, GIF_PLAY_DURATION);
    };

    // If cached it fires synchronously, otherwise wait for load
    if (img.complete) {
      onReady();
    } else {
      img.onload = onReady;
      img.onerror = () => {
        // Skip broken GIF, try next after pause
        gifIndexRef.current = (idx + 1) % GIF_SOURCES.length;
        addTimer(() => runSequence(), PAUSE_BETWEEN);
      };
    }
  }, [addTimer]);

  useEffect(() => {
    cancelRef.current = false;
    const id = setTimeout(() => runSequence(), INITIAL_DELAY);
    timersRef.current.push(id);

    return () => {
      cancelRef.current = true;
      clearTimers();
    };
  }, [runSequence, clearTimers]);

  return { activeSrc };
}

interface HeroProps {
  onEnterParliament: () => void;
}

export function Hero({ onEnterParliament }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { activeSrc } = useGifSequencer();

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
      el.style.setProperty("--mouse-x", `${x}px`);
      el.style.setProperty("--mouse-y", `${y}px`);
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        suppressHydrationWarning
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col w-full max-w-5xl items-center gap-8 px-6">
        <div className="relative flex items-center justify-center w-full max-w-5xl min-h-[200px] md:min-h-[280px]">
          <div className="relative w-full max-w-5xl">

            {/* Show the GIF when active, otherwise the static logo */}
            <img
              src={activeSrc ?? STATIC_LOGO_SRC}
              key={activeSrc ?? "static"}
              alt="Patriot Index"
              className="absolute inset-0 w-full h-auto select-none"
            />

            {/* Layout spacer */}
            <img
              src={STATIC_LOGO_SRC}
              alt=""
              className="w-full h-auto opacity-0 pointer-events-none select-none"
            />
          </div>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground font-mono text-center max-w-2xl leading-relaxed">
          {"Jak si politici vedou, když už nepotřebují váš hlas?"}
        </p>

        <button
          onClick={onEnterParliament}
          type="button"
          className="group relative mt-4 px-8 py-4 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-[0.2em] overflow-hidden transition-all duration-300 hover:tracking-[0.3em] cursor-pointer select-none"
        >
          <span className="relative z-10 font-bold pointer-events-none">
            {"vzhůru do sněmovny!"}
          </span>
          <div className="absolute inset-0 bg-foreground transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left pointer-events-none" />
          <span className="absolute inset-0 flex items-center justify-center text-background font-mono text-sm font-bold uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 z-20 pointer-events-none">
            {"vzhůru do sněmovny!"}
          </span>
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {"zjistit více"}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted-foreground"
            suppressHydrationWarning
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
