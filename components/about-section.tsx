"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Politician, LAW_NAMES } from "@/lib/parliament-data";

// L-shaped slot machine lever: horizontal arm from box, bends 90deg up, ends in red ball
function SlotLever({ pulled, onPull }: { pulled: boolean; onPull: () => void }) {
  return (
    <button
      type="button"
      onClick={onPull}
      className="group cursor-pointer select-none flex items-end"
      aria-label="Zam\u00edchat politiky"
      title="Zam\u00edchat politiky"
    >
      <svg
        width="56"
        height="80"
        viewBox="0 0 56 80"
        className="overflow-visible"
      >
        {/* Horizontal arm (from left edge to bend point) */}
        <rect x="0" y="36" width="24" height="6" rx="2" fill="hsl(var(--muted-foreground) / 0.5)" />
        {/* Vertical stick going upward from the bend */}
        <rect
          x="20"
          y={pulled ? 26 : 2}
          width="6"
          height={pulled ? 16 : 40}
          rx="2"
          fill="hsl(var(--muted-foreground) / 0.5)"
          style={{ transition: "y 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Red ball at top */}
        <circle
          cx="23"
          cy={pulled ? 22 : 0}
          r="10"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          className="group-hover:scale-110 origin-center"
          style={{ transition: "cy 0.35s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute -bottom-4 left-1/2 -translate-x-1/2">
        {"Zam\u00edchat"}
      </span>
    </button>
  );
}

// Individual slot card for a politician - can be spinning or revealed
function SlotCard({
  pol,
  isSpinning,
  revealDelay,
  slotKey,
}: {
  pol: { id: number; name: string; party: string; shortParty: string; partyColor: string; score: number; imageUrl: string; lastChange: number };
  isSpinning: boolean;
  revealDelay: number;
  slotKey: string;
}) {
  const [revealed, setRevealed] = useState(!isSpinning);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isSpinning) {
      setRevealed(false);
    } else {
      // Reveal with stagger delay
      timeoutRef.current = setTimeout(() => setRevealed(true), revealDelay);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isSpinning, revealDelay]);

  const isPositive = pol.lastChange >= 0;
  const changeColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 relative overflow-hidden"
    >
      {/* Spinning blur overlay */}
      {!revealed && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-secondary z-10"
          style={{
            animation: "slotHorizontalSpin 0.15s linear infinite",
          }}
        >
          <div className="flex gap-3 items-center opacity-30" style={{ filter: "blur(6px)" }}>
            <div className="w-10 h-10 rounded-full bg-muted-foreground/30" />
            <div className="h-3 w-20 bg-muted-foreground/30 rounded" />
            <div className="h-6 w-8 bg-muted-foreground/30 rounded" />
          </div>
        </div>
      )}

      {/* Actual content */}
      <div
        className="flex items-center gap-4 w-full transition-all"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateX(0)" : "translateX(20px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <div className="flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={changeColor} strokeWidth="2.5" style={{ transform: isPositive ? "rotate(0deg)" : "rotate(180deg)" }}>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 bg-secondary" style={{ borderColor: pol.partyColor }}>
          <img src={pol.imageUrl || "/placeholder.svg"} alt={pol.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground truncate">{pol.name}</div>
          <div className="text-xs font-mono text-muted-foreground uppercase">{pol.shortParty}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-2xl font-bold font-mono text-foreground">{pol.score}</span>
          <span className="text-lg font-bold font-mono" style={{ color: changeColor }}>
            {isPositive ? "+" : ""}{pol.lastChange}
          </span>
        </div>
      </div>
    </div>
  );
}

interface AboutSectionProps {
  onNavigateToLaws?: () => void;
}

export function AboutSection({ onNavigateToLaws }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [slotPage, setSlotPage] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Get all trending politicians sorted by average absolute change across last 3 votes
  const allTrending = useMemo(() => {
    const allPoliticians = generatePoliticians();
    const withAvgChange = allPoliticians.map((pol) => {
      const lastThree = pol.voteHistory.slice(-3);
      const avgChange = lastThree.length > 0
        ? Math.round(lastThree.reduce((s, v) => s + v.scoreChange, 0) / lastThree.length)
        : 0;
      return {
        ...pol,
        lastChange: avgChange,
        lastLaw: lastThree[lastThree.length - 1]?.lawName ?? "",
      };
    });
    withAvgChange.sort(
      (a, b) => Math.abs(b.lastChange) - Math.abs(a.lastChange),
    );
    return withAvgChange;
  }, []);

  const maxPages = Math.ceil(Math.min(allTrending.length, 20) / 4);
  const displayedPoliticians = allTrending.slice(slotPage * 4, slotPage * 4 + 4);
  const latestLaw = LAW_NAMES[LAW_NAMES.length - 1];

  const pullLever = useCallback(() => {
    if (isSpinning) return;
    setLeverPulled(true);
    setIsSpinning(true);

    // Lever springs back
    setTimeout(() => setLeverPulled(false), 350);

    // Spin for 1.8 seconds then stop
    const spinDuration = 1800;
    const spinInterval = 200;
    let spins = 0;

    const interval = setInterval(() => {
      setSlotPage((prev) => (prev + 1) % maxPages);
      spins++;
    }, spinInterval);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
    }, spinDuration);
  }, [isSpinning, maxPages]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center py-24 px-6 md:px-12 lg:px-24"
    >
      <div className="absolute top-0 left-6 right-6 md:left-12 md:right-12 lg:left-24 lg:right-24 h-px bg-border" />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Text content */}
        <div
          className={`flex flex-col gap-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">
              {"O co vlast\u011b jde?"}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight text-balance">
            {"M\u011b\u0159\u00edme \u010diny, ne slova:"}
          </h2>

          <div className="flex flex-col gap-6 text-muted-foreground leading-relaxed">
            <p>
              {"Sledujeme a hodnotíme pro Vás hlasování v poslanecké sněmovně - zaměřujeme se primárně na zákony týkající se národní suverenity, prosperity, síly, bezpečnosti a identity. Hlasování je čin, ten, který o našich politicích vypovídá více než tisíc slov."}
            </p>
            <p>
            {"Cheme se zabývat tím, co se děje nyní, proto také hodnotíme poslaneckou sněmovnu takovou, jaká vznikla volbami 3-4. října 2025. Jednotlivé zákony vážíme jak z hlediska důležitosti, tak z jejich důsledků pro sílu České Republiky. Jsme féroví - hodnotíme pouze zákon jako takoví a následně dle hlasování přidelujeme/odebíráme body všem stejně."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col gap-2 p-4 border border-border min-w-0">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary font-mono leading-tight" style={{ hyphens: "auto", WebkitHyphens: "auto" }} lang="cs">{"Nikomu nenadržujeme."}</span>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground leading-relaxed" style={{ hyphens: "auto", WebkitHyphens: "auto" }} lang="cs">{"Stranická příslušnost se skórem nepohne."}</span>
            </div>
            <div className="flex flex-col gap-2 p-4 border border-border min-w-0">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary font-mono leading-tight" style={{ hyphens: "auto", WebkitHyphens: "auto" }} lang="cs">{"Spolupracujeme s odborníky."}</span>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground leading-relaxed" style={{ hyphens: "auto", WebkitHyphens: "auto" }} lang="cs">{"Zákonné analýzy hodnotíme ve spolupráci s kvalifikovanými experty."}</span>
            </div>
          </div>
        </div>

        {/* Live trending politicians with slot machine lever */}
        <div
          className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative">
            {/* Main live view box */}
            <div className="bg-secondary border border-border overflow-hidden">
              {/* Latest law badge on top */}
              <div className="px-5 py-2.5 border-b border-border bg-primary/10">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-xs font-mono uppercase tracking-wider text-primary">
                    {"Posledn\u00ed z\u00e1kon:"}
                  </span>
                  <span className="text-xs font-mono text-foreground font-bold truncate">
                    {latestLaw}
                  </span>
                </div>
              </div>

              {/* Label */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  {"Nejv\u00edce se m\u011bn\u00ed"}
                </span>
              </div>

              {/* Trending cards with sequential reveal */}
              <div className="flex flex-col relative">
                {displayedPoliticians.map((pol, i) => (
                  <SlotCard
                    key={`${slotPage}-${pol.id}`}
                    pol={pol}
                    isSpinning={isSpinning}
                    revealDelay={i * 300}
                    slotKey={`${slotPage}-${pol.id}`}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-2 border-t border-border">
                <span className="text-[9px] font-mono text-muted-foreground">
                  {"Pr\u016fm\u011br za posledn\u00ed 3 hlasov\u00e1n\u00ed"} {" \u2022 "} {"Str\u00e1nka"} {slotPage + 1}/{maxPages}
                </span>
              </div>
            </div>

            {/* L-shaped slot machine lever -- flush against right edge of the box */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-full">
              <SlotLever pulled={leverPulled} onPull={pullLever} />
            </div>
          </div>

          {/* Anal\u00fdzy z\u00e1kon\u016f button below the live view */}
          {onNavigateToLaws && (
            <button
              type="button"
              onClick={onNavigateToLaws}
              className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground transition-all bg-transparent group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              <span className="text-sm font-mono uppercase tracking-[0.15em] font-bold">
                {"Anal\u00fdzy z\u00e1kon\u016f"}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
