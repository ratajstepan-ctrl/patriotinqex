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

const INITIAL_DELAY = 5000;
const GIF_DISPLAY_DURATION = 3600;
const PAUSE_BETWEEN = 4000;
const FADE_DURATION = 400;

/**
 * Sequencer:
 * 1. Show static logo first for INITIAL_DELAY
 * 2. Crossfade to GIF, let it play for GIF_DISPLAY_DURATION
 * 3. Crossfade back to static, wait PAUSE_BETWEEN
 * 4. Move to next GIF, repeat from step 2
 *
 * GIFs have loop count = 1 internally, so we force-reload them
 * with a cache-busting query param each time to reset playback.
 */
function useGifSequencer() {
  const [gifSrc, setGifSrc] = useState<string | null>(null);
  const [gifOpacity, setGifOpacity] = useState(0);
  const [staticOpacity, setStaticOpacity] = useState(1);

  const gifIndexRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  const playNextGif = useCallback(() => {
    clearAllTimers();

    const idx = gifIndexRef.current;
    // Force-reload the GIF so its single-loop animation plays from the start
    const nextGif = `${GIF_SOURCES[idx]}?t=${Date.now()}`;

    // Step 1: Mount the new GIF hidden, then crossfade in
    setGifSrc(nextGif);
    setGifOpacity(0);

    // Small delay to let the browser start loading the GIF before fading
    addTimer(() => {
      setStaticOpacity(0);
      setGifOpacity(1);
    }, 50);

    // Step 2: After the GIF has played, crossfade back to static
    addTimer(() => {
      setStaticOpacity(1);
      setGifOpacity(0);

      // Step 3: After fade completes, unmount GIF and advance index
      addTimer(() => {
        setGifSrc(null);
        gifIndexRef.current = (idx + 1) % GIF_SOURCES.length;

        // Step 4: Wait the pause duration, then play the next one
        addTimer(() => {
          playNextGif();
        }, PAUSE_BETWEEN);
      }, FADE_DURATION);
    }, GIF_DISPLAY_DURATION);
  }, [clearAllTimers, addTimer]);

  useEffect(() => {
    const initialTimer = setTimeout(playNextGif, INITIAL_DELAY);
    return () => {
      clearTimeout(initialTimer);
      clearAllTimers();
    };
  }, [playNextGif, clearAllTimers]);

  return { gifSrc, gifOpacity, staticOpacity };
}

interface HeroProps {
  onEnterParliament: () => void;
}

export function Hero({ onEnterParliament }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { gifSrc, gifOpacity, staticOpacity } =
    useGifSequencer();

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

            {/* STATIC IMAGE - always mounted */}
            <img
              src={STATIC_LOGO_SRC}
              alt="Patriot Index"
              className="absolute inset-0 w-full h-auto select-none"
              style={{
                opacity: staticOpacity,
                transition: `opacity ${FADE_DURATION}ms ease`,
              }}
            />

            {/* GIF IMAGE - mounted only when playing */}
            {gifSrc && (
              <img
                key={gifSrc}
                src={gifSrc}
                alt="Patriot Index animation"
                className="absolute inset-0 w-full h-auto select-none"
                style={{
                  opacity: gifOpacity,
                  transition: `opacity ${FADE_DURATION}ms ease`,
                }}
              />
            )}

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
