"use client";

import { useRef, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Politician } from "@/lib/parliament-data";

interface PoliticianProfileProps {
  politician: Politician;
  onClose: () => void;
  onGoToParty?: (partyName: string) => void;
  onCompare?: (politician: Politician) => void;
}

const VISIBLE_LAWS = 7;
const CHART_STEP = 3;
const VOTE_PAGE_SIZE = 6;

function WrappedTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
  const label = payload.value;
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + word.length + 1 > 14) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return (
    <g transform={`translate(${x},${y + 8})`}>
      {lines.map((line, idx) => (
        <text key={idx} x={0} y={idx * 13} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontFamily="monospace">
          {line}
        </text>
      ))}
    </g>
  );
}

function scoreColor(score: number): string {
  if (score >= 1200) return "#22c55e";
  if (score >= 900) return "#eab308";
  return "#ef4444";
}

export function PoliticianProfile({ politician, onClose, onGoToParty, onCompare }: PoliticianProfileProps) {
  const profileRef = useRef<HTMLDivElement>(null);
  const [chartOffset, setChartOffset] = useState<number | null>(null);
  const [voteOffset, setVoteOffset] = useState<number | null>(null);
  const [voteSlideDir, setVoteSlideDir] = useState<"left" | "right" | null>(null);
  const [voteAnimKey, setVoteAnimKey] = useState(0);

  const chartData = useMemo(() => {
    let cumScore = 1000;
    return politician.voteHistory.map((vote, i) => {
      cumScore += vote.scoreChange;
      return { name: vote.lawName, fullName: vote.lawName, score: cumScore, change: vote.scoreChange, voted: vote.voted, date: vote.date, index: i };
    });
  }, [politician]);

  const lastVote = politician.voteHistory[politician.voteHistory.length - 1];
  const lastScoreChange = lastVote?.scoreChange ?? 0;
  const changeColor = lastScoreChange >= 0 ? "#22c55e" : "#ef4444";

  const effectiveChartOffset = chartOffset ?? Math.max(0, chartData.length - VISIBLE_LAWS);
  const visibleChartData = chartData.slice(effectiveChartOffset, effectiveChartOffset + VISIBLE_LAWS);
  const canChartLeft = effectiveChartOffset > 0;
  const canChartRight = effectiveChartOffset + VISIBLE_LAWS < chartData.length;

  const totalVotes = politician.voteHistory.length;
  const effectiveVoteOffset = voteOffset ?? Math.max(0, totalVotes - VOTE_PAGE_SIZE);
  const visibleVotes = politician.voteHistory.slice(effectiveVoteOffset, effectiveVoteOffset + VOTE_PAGE_SIZE).reverse();
  const canVoteLeft = effectiveVoteOffset > 0;
  const canVoteRight = effectiveVoteOffset + VOTE_PAGE_SIZE < totalVotes;

  const yDomain = useMemo(() => {
    if (visibleChartData.length === 0) return [0, 2000];
    const scores = visibleChartData.map((d) => d.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const pad = Math.max(50, (max - min) * 0.2);
    return [Math.floor((min - pad) / 50) * 50, Math.ceil((max + pad) / 50) * 50];
  }, [visibleChartData]);

  const navigateChart = (dir: "left" | "right") => {
    setChartOffset((prev) => {
      const cur = prev ?? Math.max(0, chartData.length - VISIBLE_LAWS);
      if (dir === "left") return Math.max(0, cur - CHART_STEP);
      return Math.min(chartData.length - VISIBLE_LAWS, cur + CHART_STEP);
    });
  };

  const navigateVotes = (dir: "left" | "right") => {
    setVoteSlideDir(dir);
    setVoteAnimKey((k) => k + 1);
    setVoteOffset((prev) => {
      const cur = prev ?? Math.max(0, totalVotes - VOTE_PAGE_SIZE);
      if (dir === "left") return Math.max(0, cur - VOTE_PAGE_SIZE);
      return Math.min(totalVotes - VOTE_PAGE_SIZE, cur + VOTE_PAGE_SIZE);
    });
  };

  const sc = scoreColor(politician.score);
  const birthLabel = politician.gender === "female" ? "Narozená" : "Narozený";
  const voteLabel = (v: string) => { switch (v) { case "pro": return "Pro"; case "proti": return "Proti"; case "zdrzel": return "Zdr\u017eel"; default: return "Nehlas."; } };
  const voteColor = (v: string) => { switch (v) { case "pro": return "#22c55e"; case "proti": return "#ef4444"; default: return "#eab308"; } };

  // Slide animation for vote history
  const slideClass = voteSlideDir === "left"
    ? "animate-slide-from-left"
    : voteSlideDir === "right"
    ? "animate-slide-from-right"
    : "";

  return (
    <div ref={profileRef} className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">{"Profil poslance"}</span>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            {"Zav\u0159\u00edt"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - photo and info */}
          <div className="flex flex-col items-center lg:items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-2 overflow-hidden bg-secondary" style={{ borderColor: politician.partyColor }}>
                <img src={politician.imageUrl || "/placeholder.svg"} alt={politician.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 border-card" style={{ backgroundColor: sc, color: "#fff" }}>
                {politician.score}
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-foreground">{politician.name}</h3>
              <div className="mt-2 flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                <button type="button" onClick={() => onGoToParty?.(politician.party)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-secondary text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: politician.partyColor, border: "1.5px solid hsl(var(--foreground) / 0.3)" }} />
                  {politician.party}
                </button>
                {politician.region && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-secondary text-muted-foreground">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {politician.region}
                  </span>
                )}
              </div>
            </div>

            {politician.committee && <div className="text-xs font-mono text-muted-foreground mt-1">{politician.committee}</div>}

            {/* Current score -- big prominent box */}
            <div className="w-full p-4 border-2 border-border bg-background flex flex-col items-center gap-1">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{"Celkov\u00e9 sk\u00f3re"}</span>
              <span className="text-4xl font-bold font-mono" style={{ color: sc }}>{politician.score}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="p-3 border border-border bg-background">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">{birthLabel}</span>
                <span className="text-sm font-bold text-foreground font-mono">{politician.birthDate}</span>
              </div>
              {/* Score change box -- smaller */}
              <div className="p-3 border border-border bg-background flex flex-col items-center">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">{"Zm\u011bna"}</span>
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={changeColor} strokeWidth="2.5" style={{ transform: lastScoreChange >= 0 ? "rotate(0deg)" : "rotate(180deg)" }}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                  <span className="text-lg font-bold font-mono" style={{ color: changeColor }}>{lastScoreChange >= 0 ? "+" : ""}{lastScoreChange}</span>
                </div>
              </div>
            </div>

            {onCompare && (
              <button type="button" onClick={() => onCompare(politician)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all bg-transparent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5" /><path d="M21 3L14 10M3 3l7 7M3 21l7-7M21 21l-7-7" /></svg>
                {"Porovnat s jin\u00fdm politikem"}
              </button>
            )}
          </div>

          {/* Right - chart + vote table */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-px bg-muted-foreground" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">{"V\u00fdvoj sk\u00f3re v \u010dase"}</span>
            </div>

            <div className="w-full h-[420px] border border-border bg-background p-4 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={effectiveChartOffset} data={visibleChartData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id={`scoreGrad-${politician.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sc} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={sc} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={WrappedTick} height={90} interval={0} tickLine={false} />
                  <YAxis domain={yDomain} tick={{ fontSize: 10, className: "fill-muted-foreground" }} tickLine={false} width={45} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-card border border-border p-3 shadow-xl text-foreground">
                          <p className="text-xs font-bold mb-1">{d.fullName}</p>
                          <p className="text-xs text-muted-foreground mb-2">{d.date}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono uppercase">{"Hlasoval:"}</span>
                            <span className="text-xs font-mono font-bold" style={{ color: voteColor(d.voted) }}>{voteLabel(d.voted)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono uppercase">{"Sk\u00f3re:"}</span>
                            <span className="text-sm font-bold font-mono" style={{ color: sc }}>{d.score}</span>
                            <span className="text-xs font-mono" style={{ color: d.change >= 0 ? "#22c55e" : "#ef4444" }}>({d.change >= 0 ? "+" : ""}{d.change})</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={sc}
                    strokeWidth={2.5}
                    fill={`url(#scoreGrad-${politician.id})`}
                    dot={{ r: 4, fill: sc, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: sc, stroke: "hsl(var(--foreground))", strokeWidth: 2 }}
                    isAnimationActive={false}
                    label={({ x, y, value }: { x: number; y: number; value: number }) => (
                      <text x={x} y={y - 10} textAnchor="middle" fontSize={9} fontFamily="monospace" className="fill-foreground" fontWeight="bold">
                        {value}
                      </text>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart navigation */}
            <div className="flex items-center justify-center gap-4">
              <button type="button" disabled={!canChartLeft} onClick={() => navigateChart("left")} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border transition-colors ${canChartLeft ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                {"Star\u0161\u00ed"}
              </button>
              <span className="text-xs font-mono text-muted-foreground">{effectiveChartOffset + 1}--{Math.min(effectiveChartOffset + VISIBLE_LAWS, chartData.length)} z {chartData.length}</span>
              <button type="button" disabled={!canChartRight} onClick={() => navigateChart("right")} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border transition-colors ${canChartRight ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
                {"Nov\u011bj\u0161\u00ed"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Vote history table with slide animation */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-6 h-px bg-muted-foreground" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">{"Historie hlasov\u00e1n\u00ed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" disabled={!canVoteLeft} onClick={() => navigateVotes("left")} className={`p-1.5 border border-border transition-colors ${canVoteLeft ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-xs font-mono text-muted-foreground">{effectiveVoteOffset + 1}-{Math.min(effectiveVoteOffset + VOTE_PAGE_SIZE, totalVotes)} z {totalVotes}</span>
                <button type="button" disabled={!canVoteRight} onClick={() => navigateVotes("right")} className={`p-1.5 border border-border transition-colors ${canVoteRight ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            <div className="border border-border overflow-hidden">
              <div className="grid gap-x-3 px-4 py-2.5 bg-muted text-xs font-mono uppercase tracking-wider text-muted-foreground" style={{ gridTemplateColumns: "1fr 100px 80px 60px" }}>
                <span>{"Z\u00e1kon"}</span><span className="text-center">Datum</span><span className="text-center">Hlas</span><span className="text-right">{"Zm\u011bna"}</span>
              </div>
              <div key={voteAnimKey} className={slideClass}>
                {visibleVotes.map((vote, i) => (
                  <div key={`${vote.lawName}-${i}`} className="grid gap-x-3 px-4 py-2.5 border-t border-border text-sm items-center" style={{ gridTemplateColumns: "1fr 100px 80px 60px" }}>
                    <span className="text-foreground truncate" title={vote.lawName}>{vote.lawName}</span>
                    <span className="text-muted-foreground font-mono text-xs text-center whitespace-nowrap">{vote.date}</span>
                    <span className="font-mono text-xs font-bold uppercase text-center" style={{ color: voteColor(vote.voted) }}>{voteLabel(vote.voted)}</span>
                    <span className="text-right font-mono text-xs font-bold" style={{ color: vote.scoreChange >= 0 ? "#22c55e" : "#ef4444" }}>{vote.scoreChange >= 0 ? "+" : ""}{vote.scoreChange}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
