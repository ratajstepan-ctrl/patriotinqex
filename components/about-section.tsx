"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { fetchPoliticians } from "@/lib/api-loader";   // ← NOVÝ IMPORT
import { LAW_NAMES } from "@/lib/parliament-data";     // LAW_NAMES zůstává pro "Poslední zákon"

// L-shaped slot machine lever: horizontal arm from box, bends 90deg up, ends in red ball
function SlotLever({ pulled, onPull }: { pulled: boolean; onPull: () => void }) {
  return (
    <button
      type="button"
      onClick={onPull}
      className="group cursor-pointer select-none flex items-end"
      aria-label="Zamíchat politiky"
      title="Zamíchat politiky"
    >
      <svg width="56" height="80" viewBox="0 0 56 80" className="overflow-visible">
        <rect x="0" y="36" width="24" height="6" rx="2" fill="hsl(var(--muted-foreground) / 0.5)" />
        <rect
          x="20"
          y={pulled ? 26 : 2}
          width="6"
          height={pulled ? 16 : 40}
          rx="2"
          fill="hsl(var(--muted-foreground) / 0.5)"
          style={{ transition: "y 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)" }}
        />
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
        Zamíchat
      </span>
    </button>
  );
}

// Individual slot card for a politician
function SlotCard({
  pol,
  isSpinning,
  revealDelay,
  slotKey,
}: {
  pol: {
    id: number;
    name: string;
    party: string;
    shortParty: string;
    partyColor: string;
    score: number;
    imageUrl: string;
    lastChange: number;
  };
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
      timeoutRef.current = setTimeout(() => setRevealed(true), revealDelay);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isSpinning, revealDelay]);

  const isPositive = pol.lastChange >= 0;
  const changeColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border-b border-border last:border-b-0 relative overflow-hidden">
      {!revealed && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-secondary z-10"
          style={{ animation: "slotHorizontalSpin 0.15s linear infinite" }}
        >
          <div className="flex gap-3 items-center opacity-30" style={{ filter: "blur(6px)" }}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted-foreground/30" />
            <div className="h-3 w-16 sm:w-20 bg-muted-foreground/30 rounded" />
            <div className="h-6 w-8 bg-muted-foreground/30 rounded" />
          </div>
        </div>
      )}

      <div
        className="flex items-center gap-2 sm:gap-4 w-full transition-all"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateX(0)" : "translateX(20px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <div className="flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={changeColor} strokeWidth="2.5" style={{ transform: isPositive ? "rotate(0deg)" : "rotate(180deg)" }}>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 border-2 bg-secondary" style={{ borderColor: pol.partyColor }}>
          <img src={pol.imageUrl || "/placeholder.svg"} alt={pol.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-bold text-foreground truncate">{pol.name}</div>
          <div className="text-[10px] sm:text-xs font-mono text-muted-foreground uppercase">{pol.shortParty}</div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <span className="text-lg sm:text-2xl font-bold font-mono text-foreground">{pol.score}</span>
          <span className="text-sm sm:text-lg font-bold font-mono" style={{ color: changeColor }}>
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

  // === DATA Z API ===
  const [apiPoliticians, setApiPoliticians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Načtení z API (jednorázově)
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPoliticians();
        setApiPoliticians(data || []);
      } catch (err) {
        console.error("Chyba při načítání politiků z API:", err);
        setFetchError(true);
        setApiPoliticians([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Trending politici z API
  const allTrending = useMemo(() => {
    if (apiPoliticians.length === 0) return [];

    return apiPoliticians
      .map((pol) => ({
        id: pol.id,
        name: pol.name || "Neznámý poslanec",
        shortParty: pol.shortParty || "?",
        partyColor: pol.partyColor || "#666666",
        score: pol.score || 950,
        imageUrl: pol.imageUrl || "/placeholder.svg",
        // Dummy změna pro vizuální efekt (API ji nemá)
        lastChange: Math.floor(Math.random() * 45) - 18,
      }))
      .sort((a, b) => Math.abs(b.lastChange) - Math.abs(a.lastChange))
      .slice(0, 20);
  }, [apiPoliticians]);

  const maxPages = Math.max(1, Math.ceil(allTrending.length / 4));
  const displayedPoliticians = allTrending.slice(slotPage * 4, slotPage * 4 + 4);
  const latestLaw = LAW_NAMES[LAW_NAMES.length - 1] || "Aktuální hlasování";

  const pullLever = useCallback(() => {
    if (isSpinning || allTrending.length === 0) return;
    setLeverPulled(true);
    setIsSpinning(true);
    setTimeout(() => setLeverPulled(false), 350);

    const interval = setInterval(() => {
      setSlotPage((prev) => (prev + 1) % maxPages);
    }, 160);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
    }, 1650);
  }, [isSpinning, maxPages, allTrending.length]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center py-24 px-6 md:px-12 lg:px-24"
    >
      <div className="absolute top-0 left-6 right-6 md:left-12 md:right-12 lg:left-24 lg:right-24 h-px bg-border" />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Textová část – beze změny */}
        <div className={`flex flex-col gap-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* ... tvůj původní text (stejný jako dřív) ... */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">O co vlastně jde?</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight text-balance">
            Měříme činy, ne slova:
          </h2>

          <div className="flex flex-col gap-6 text-muted-foreground leading-relaxed">
            <p>Sledujeme a hodnot&iacute;me pro V&aacute;s hlasov&aacute;n&iacute; v poslaneck&eacute; sn&#283;movn&#283; - zam&#283;&#345;ujeme se prim&aacute;rn&#283; na z&aacute;kony t&yacute;kaj&iacute;c&iacute; se n&aacute;rodn&iacute; suverenity, prosperity, s&iacute;ly, bezpe&#269;nosti a identity. Hlasov&aacute;n&iacute; je &#269;in, ten, kter&yacute; o na&scaron;ich polic&iacute;ch vypov&iacute;d&aacute; v&iacute;ce ne&#382; tis&iacute;c slov.
		    </p>
          	<p>

				Chceme se zab&yacute;vat t&iacute;m, co se d&#283;je nyn&iacute;, proto tak&eacute; hodnot&iacute;me poslaneckou sn&#283;movnu takovou, jak&aacute; vznikla volbami 3-4. &#345;&iacute;jna 2025. Jednotliv&eacute; z&aacute;kony v&aacute;&#382;&iacute;me jak z hlediska d&#367;le&#382;itosti, tak z jejich d&#367;sledk&#367; pro s&iacute;lu &#268;esk&eacute; Republiky. Jsme f&eacute;rov&iacute; - hodnot&iacute;me pouze z&aacute;kon jako takov&yacute; a n&aacute;sledn&#283; dle hlasov&aacute;n&iacute; p&#345;id&#283;lujeme/odeb&iacute;r&aacute;me body v&scaron;em stejn&#283;.

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
          
        

        {/* TRENDING BOX – vždy se zobrazí */}
        <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative">
            <div className="bg-secondary border border-border overflow-hidden">
              {/* Latest law */}
              <div className="px-5 py-2.5 border-b border-border bg-primary/10">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-xs font-mono uppercase tracking-wider text-primary">Poslední zákon:</span>
                  <span className="text-xs font-mono text-foreground font-bold truncate">{latestLaw}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Nejvíce se mění</span>
              </div>

              {/* Obsah karty */}
              <div className="flex flex-col relative min-h-[280px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-[280px]">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-mono text-muted-foreground mt-4">Načítám aktuální data z API...</p>
                  </div>
                ) : displayedPoliticians.length > 0 ? (
                  displayedPoliticians.map((pol, i) => (
                    <SlotCard
                      key={`${slotPage}-${pol.id}`}
                      pol={pol}
                      isSpinning={isSpinning}
                      revealDelay={i * 280}
                      slotKey={`${slotPage}-${pol.id}`}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    Žádná data k zobrazení
                  </div>
                )}
              </div>

              <div className="px-5 py-2 border-t border-border flex items-center justify-between">
                <span className="text-[9px] font-mono text-muted-foreground">
                  Průměr za poslední hlasování • Stránka {slotPage + 1}/{maxPages}
                </span>
                {/* Mobile shuffle button – visible only on small screens */}
                <button
                  type="button"
                  onClick={pullLever}
                  disabled={isSpinning || allTrending.length === 0}
                  className="sm:hidden flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono uppercase tracking-wider border border-primary/60 text-primary disabled:opacity-40 active:bg-primary active:text-primary-foreground transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                  Zamíchat
                </button>
              </div>
            </div>

            {/* Lever – hidden on mobile, side-mounted on sm+ */}
            <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-full">
              <SlotLever pulled={leverPulled} onPull={pullLever} />
            </div>
          </div>

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
