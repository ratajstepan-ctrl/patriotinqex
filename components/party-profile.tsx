"use client";

import { useRef, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Party, Politician } from "@/lib/parliament-data";

interface PartyProfileProps {
  party: Party;
  politicians: Politician[];
  onClose: () => void;
  onSelectPolitician: (politician: Politician) => void;
  onCompare?: (party: Party) => void;
}

function getChartStrokeColor(partyColor: string): string {
  const hex = partyColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.35) {
    const factor = 2.2;
    return `rgb(${Math.min(255, Math.round(r * factor + 60))}, ${Math.min(255, Math.round(g * factor + 60))}, ${Math.min(255, Math.round(b * factor + 60))})`;
  }
  return partyColor;
}

const VISIBLE_LAWS = 7;
const VOTE_PAGE_SIZE = 8;

function voteLabel(v: string) { switch (v) { case "pro": return "Pro"; case "proti": return "Proti"; case "zdrzel": return "Zdr\u017eel"; default: return "Nehlas."; } }
function voteColor(v: string) { switch (v) { case "pro": return "#22c55e"; case "proti": return "#ef4444"; default: return "#eab308"; } }

export function PartyProfile({ party, politicians, onClose, onSelectPolitician, onCompare }: PartyProfileProps) {
  const profileRef = useRef<HTMLDivElement>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [membersAnimating, setMembersAnimating] = useState(false);
  const [chartOffset, setChartOffset] = useState<number | null>(null);
  const [chartAnimating, setChartAnimating] = useState(false);
  const [expandedLawIndex, setExpandedLawIndex] = useState<number | null>(null);
  const [voteOffset, setVoteOffset] = useState<number | null>(null);

  const partyPoliticians = useMemo(
    () => politicians.filter((p) => p.party === party.name),
    [politicians, party.name],
  );

  const avgScore = useMemo(() => {
    if (partyPoliticians.length === 0) return 0;
    return Math.round(partyPoliticians.reduce((sum, p) => sum + p.score, 0) / partyPoliticians.length);
  }, [partyPoliticians]);

  const lastScoreChangeInfo = useMemo(() => {
    if (partyPoliticians.length === 0) return { change: 0, cancelled: false };
    let totalChange = 0;
    let hasPos = false, hasNeg = false;
    for (const pol of partyPoliticians) {
      const last = pol.voteHistory[pol.voteHistory.length - 1];
      if (last) {
        totalChange += last.scoreChange;
        if (last.scoreChange > 0) hasPos = true;
        if (last.scoreChange < 0) hasNeg = true;
      }
    }
    const avg = Math.round(totalChange / partyPoliticians.length);
    return { change: avg, cancelled: avg === 0 && hasPos && hasNeg };
  }, [partyPoliticians]);

  const allMembersSorted = useMemo(() => [...partyPoliticians].sort((a, b) => b.score - a.score), [partyPoliticians]);
  const displayedMembers = showAllMembers ? allMembersSorted : allMembersSorted.slice(0, 10);

  const toggleMembers = () => {
    if (!showAllMembers) {
      setMembersAnimating(true);
      setShowAllMembers(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setMembersAnimating(false)));
    } else {
      setShowAllMembers(false);
      setMembersAnimating(false);
    }
  };

  // Build vote history for the party (aggregate per law)
  const partyVoteHistory = useMemo(() => {
    if (partyPoliticians.length === 0) return [];
    const numVotes = partyPoliticians[0]?.voteHistory.length ?? 0;
    const history: Array<{
      lawName: string;
      date: string;
      avgChange: number;
      memberVotes: Array<{ name: string; voted: string; scoreChange: number; imageUrl: string }>;
    }> = [];
    for (let i = 0; i < numVotes; i++) {
      let totalChange = 0;
      const memberVotes: Array<{ name: string; voted: string; scoreChange: number; imageUrl: string }> = [];
      for (const pol of partyPoliticians) {
        const vote = pol.voteHistory[i];
        if (vote) {
          totalChange += vote.scoreChange;
          memberVotes.push({ name: pol.name, voted: vote.voted, scoreChange: vote.scoreChange, imageUrl: pol.imageUrl });
        }
      }
      const ref = partyPoliticians[0].voteHistory[i];
      history.push({
        lawName: ref.lawName,
        date: ref.date,
        avgChange: Math.round(totalChange / partyPoliticians.length),
        memberVotes,
      });
    }
    return history;
  }, [partyPoliticians]);

  const totalPartyVotes = partyVoteHistory.length;
  const effectiveVoteOffset = voteOffset ?? Math.max(0, totalPartyVotes - VOTE_PAGE_SIZE);
  const visiblePartyVotes = partyVoteHistory.slice(effectiveVoteOffset, effectiveVoteOffset + VOTE_PAGE_SIZE).reverse();
  const canVoteLeft = effectiveVoteOffset > 0;
  const canVoteRight = effectiveVoteOffset + VOTE_PAGE_SIZE < totalPartyVotes;

  const navigateVotes = (dir: "left" | "right") => {
    setExpandedLawIndex(null);
    setVoteOffset((prev) => {
      const cur = prev ?? Math.max(0, totalPartyVotes - VOTE_PAGE_SIZE);
      if (dir === "left") return Math.max(0, cur - VOTE_PAGE_SIZE);
      return Math.min(totalPartyVotes - VOTE_PAGE_SIZE, cur + VOTE_PAGE_SIZE);
    });
  };

  // Build cumulative average score over time (MMR)
  const chartData = useMemo(() => {
    if (partyPoliticians.length === 0) return [];
    const numVotes = partyPoliticians[0]?.voteHistory.length ?? 0;
    const data: Array<{ name: string; fullName: string; score: number; date: string; index: number }> = [];

    for (let i = 0; i < numVotes; i++) {
      let totalCumScore = 0;
      for (const pol of partyPoliticians) {
        let cumScore = 1000; // MMR base
        for (let j = 0; j <= i; j++) {
          cumScore += pol.voteHistory[j].scoreChange;
        }
        totalCumScore += cumScore;
      }
      const avg = Math.round(totalCumScore / partyPoliticians.length);
      const vote = partyPoliticians[0].voteHistory[i];
      data.push({ name: vote.lawName, fullName: vote.lawName, score: avg, date: vote.date, index: i });
    }
    return data;
  }, [partyPoliticians]);

  const effectiveOffset = chartOffset ?? Math.max(0, chartData.length - VISIBLE_LAWS);
  const visibleChartData = chartData.slice(effectiveOffset, effectiveOffset + VISIBLE_LAWS);
  const canGoLeft = effectiveOffset > 0;
  const canGoRight = effectiveOffset + VISIBLE_LAWS < chartData.length;

  // Dynamic Y domain from visible data
  const yDomain = useMemo(() => {
    if (visibleChartData.length === 0) return [0, 2000];
    const scores = visibleChartData.map((d) => d.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const pad = Math.max(50, (max - min) * 0.2);
    return [Math.floor((min - pad) / 50) * 50, Math.ceil((max + pad) / 50) * 50];
  }, [visibleChartData]);

  const navigateChart = (direction: "left" | "right") => {
    setChartAnimating(true);
    if (direction === "left") setChartOffset(Math.max(0, effectiveOffset - 3));
    else setChartOffset(Math.min(chartData.length - VISIBLE_LAWS, effectiveOffset + 3));
    setTimeout(() => setChartAnimating(false), 400);
  };

  const scoreCol = avgScore >= 1200 ? "#22c55e" : avgScore >= 900 ? "#eab308" : "#ef4444";
  const changeCol = lastScoreChangeInfo.cancelled ? "#9ca3af" : lastScoreChangeInfo.change >= 0 ? "#22c55e" : "#ef4444";
  const chartStroke = getChartStrokeColor(party.color);

  return (
    <div ref={profileRef} className="bg-card">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">Profil strany</span>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            {"Zav\u0159\u00edt"}
          </button>
        </div>

        {/* Party header -- compact layout */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          {/* Party info -- logo + name + score all inline */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 flex items-center justify-center border-2 text-lg font-bold font-mono flex-shrink-0"
              style={{ backgroundColor: party.color, borderColor: party.color, color: "#ffffff" }}>
              {party.shortName}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-foreground">{party.name}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {party.founded > 0 && <span className="text-xs font-mono text-muted-foreground">{"Zalo\u017eeno: "}{party.founded}</span>}
                <span className="text-xs font-mono text-muted-foreground">{"Poslanc\u016f: "}{party.seats}</span>
              </div>
            </div>
          </div>

          {/* Score + change side by side */}
          <div className="flex items-stretch gap-3 flex-shrink-0">
            <div className="flex flex-col items-center justify-center p-4 border-2 border-border bg-background min-w-[140px]">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{"Pr\u016fm\u011brn\u00e9 sk\u00f3re"}</span>
              <span className="text-4xl font-bold font-mono" style={{ color: scoreCol }}>{avgScore}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 border border-border bg-background min-w-[120px]">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{"Zm\u011bna"}</span>
              {lastScoreChangeInfo.cancelled ? (
                <>
                  <span className="text-xl font-bold font-mono text-[#9ca3af]">0</span>
                  <span className="text-xs font-mono text-muted-foreground text-center leading-tight mt-1">{"Vyrovn\u00e1no"}</span>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={changeCol} strokeWidth="2.5"
                    style={{ transform: lastScoreChangeInfo.change >= 0 ? "rotate(0deg)" : "rotate(180deg)" }}>
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span className="text-xl font-bold font-mono" style={{ color: changeCol }}>
                    {lastScoreChangeInfo.change >= 0 ? "+" : ""}{lastScoreChangeInfo.change}
                  </span>
                </div>
              )}
            </div>
            {/* Compare button */}
            {onCompare && (
              <button
                type="button"
                onClick={() => onCompare(party)}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2.5 text-xs font-mono uppercase tracking-wider border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all bg-transparent"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5" /><path d="M21 3L14 10M3 3l7 7M3 21l7-7M21 21l-7-7" /></svg>
                {"Porovnat"}
              </button>
            )}
          </div>
        </div>

        {/* Score chart */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-muted-foreground" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">{"V\u00fdvoj pr\u016fm\u011brn\u00e9ho sk\u00f3re v \u010dase"}</span>
          </div>
          <div className="w-full h-[420px] border border-border bg-background p-4 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibleChartData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id={`partyGrad-${party.shortName}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartStroke} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartStroke} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                    const label = payload.value;
                    const words = label.split(" ");
                    const lines: string[] = [];
                    let current = "";
                    for (const word of words) {
                      if (current && current.length + word.length + 1 > 14) { lines.push(current); current = word; }
                      else current = current ? `${current} ${word}` : word;
                    }
                    if (current) lines.push(current);
                    return (
                      <g transform={`translate(${x},${y + 8})`}>
                        {lines.map((line, idx) => (
                          <text key={idx} x={0} y={idx * 11} textAnchor="middle" className="fill-muted-foreground" fontSize={8} fontFamily="monospace">
                            {line}
                          </text>
                        ))}
                      </g>
                    );
                  }}
                  height={80}
                  interval={0}
                  tickLine={false}
                />
                <YAxis domain={yDomain} tick={{ fontSize: 10, className: "fill-muted-foreground" }} tickLine={false} width={45} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border p-3 shadow-xl text-foreground">
                        <p className="text-xs font-bold mb-1">{data.fullName}</p>
                        <p className="text-xs text-muted-foreground mb-2">{data.date}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase">{"Pr\u016fm\u011brn\u00e9 sk\u00f3re:"}</span>
                          <span className="text-sm font-bold font-mono" style={{ color: scoreCol }}>{data.score}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={chartStroke}
                  strokeWidth={2.5}
                  fill={`url(#partyGrad-${party.shortName})`}
                  dot={{ r: 4, fill: chartStroke, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: chartStroke, stroke: "hsl(var(--foreground))", strokeWidth: 2 }}
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
          <div className="flex items-center justify-center gap-4 mt-3">
            <button type="button" disabled={!canGoLeft} onClick={() => navigateChart("left")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border transition-colors ${canGoLeft ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              {"Star\u0161\u00ed"}
            </button>
            <span className="text-xs font-mono text-muted-foreground">{effectiveOffset + 1}--{Math.min(effectiveOffset + VISIBLE_LAWS, chartData.length)} z {chartData.length}</span>
            <button type="button" disabled={!canGoRight} onClick={() => navigateChart("right")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border transition-colors ${canGoRight ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
              {"Nov\u011bj\u0161\u00ed"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Vote history -- list of laws with party avg score change, expandable per member */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-px bg-muted-foreground" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">{"Historie hlasov\u00e1n\u00ed strany"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={!canVoteLeft} onClick={() => navigateVotes("left")} className={`p-1.5 border border-border transition-colors ${canVoteLeft ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-xs font-mono text-muted-foreground">{effectiveVoteOffset + 1}-{Math.min(effectiveVoteOffset + VOTE_PAGE_SIZE, totalPartyVotes)} z {totalPartyVotes}</span>
              <button type="button" disabled={!canVoteRight} onClick={() => navigateVotes("right")} className={`p-1.5 border border-border transition-colors ${canVoteRight ? "text-foreground hover:bg-secondary" : "text-muted-foreground/30 cursor-not-allowed"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Vote history header */}
          <div className="border border-border overflow-hidden">
            <div className="grid gap-x-3 px-4 py-2 bg-muted text-xs font-mono uppercase tracking-wider text-muted-foreground" style={{ gridTemplateColumns: "20px 1fr 90px 90px" }}>
              <span />
              <span>{"Z\u00e1kon"}</span>
              <span className="text-center">Datum</span>
              <span className="text-right whitespace-nowrap">{"Pr\u016fm. zm\u011bna"}</span>
            </div>
            {visiblePartyVotes.map((vote, i) => {
              const isExpanded = expandedLawIndex === i;
              const changeColV = vote.avgChange >= 0 ? "#22c55e" : "#ef4444";
              return (
                <div key={`${vote.lawName}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setExpandedLawIndex(isExpanded ? null : i)}
                    className="w-full grid gap-x-3 px-4 py-2.5 border-t border-border text-sm items-center hover:bg-muted/30 transition-colors"
                    style={{ gridTemplateColumns: "20px 1fr 90px 90px" }}
                  >
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="text-foreground truncate text-left" title={vote.lawName}>{vote.lawName}</span>
                    <span className="text-muted-foreground font-mono text-xs text-center whitespace-nowrap">{vote.date}</span>
                    <span className="text-right font-mono text-xs font-bold" style={{ color: changeColV }}>
                      {vote.avgChange >= 0 ? "+" : ""}{vote.avgChange}
                    </span>
                  </button>
                  {/* Expanded: show each member's vote */}
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isExpanded ? `${vote.memberVotes.length * 44 + 16}px` : "0px", opacity: isExpanded ? 1 : 0 }}
                  >
                    <div className="bg-secondary/30 border-t border-border">
                      {[...vote.memberVotes].sort((a, b) => a.name.localeCompare(b.name, "cs")).map((mv, mi) => {
                        const mvCol = mv.scoreChange >= 0 ? "#22c55e" : "#ef4444";
                        return (
                          <div key={mi} className="grid items-center gap-3 px-6 py-2 border-b border-border last:border-b-0" style={{ gridTemplateColumns: "24px 1fr 60px 50px" }}>
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                              <img src={mv.imageUrl || "/placeholder.svg"} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>
                            <span className="text-xs text-foreground truncate">{mv.name}</span>
                            <span className="text-xs font-mono font-bold uppercase text-center" style={{ color: voteColor(mv.voted) }}>{voteLabel(mv.voted)}</span>
                            <span className="text-xs font-mono font-bold text-right" style={{ color: mvCol }}>
                              {mv.scoreChange >= 0 ? "+" : ""}{mv.scoreChange}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Members list */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-px bg-muted-foreground" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                {showAllMembers ? "V\u0161ichni \u010dlenov\u00e9" : "Nejlep\u0161\u00ed \u010dlenov\u00e9"}
              </span>
            </div>
            <button type="button" onClick={toggleMembers}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
              {showAllMembers ? "Zobrazit top 10" : `Zobrazit v\u0161ech ${allMembersSorted.length}`}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: showAllMembers ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <div
            className="border border-border overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              display: "grid",
              ...(showAllMembers && displayedMembers.length > 15
                ? {
                    gridAutoFlow: "column" as const,
                    gridTemplateRows: `repeat(${Math.ceil(displayedMembers.length / 2)}, auto)`,
                    gridTemplateColumns: "1fr 1fr",
                  }
                : { gridTemplateColumns: "1fr" }),
            }}
          >
            {displayedMembers.map((member, i) => {
              const msc = member.score >= 1200 ? "#22c55e" : member.score >= 900 ? "#eab308" : "#ef4444";
              const lastVote = member.voteHistory[member.voteHistory.length - 1];
              const mChange = lastVote?.scoreChange ?? 0;
              const mcCol = mChange >= 0 ? "#22c55e" : "#ef4444";
              const isNew = i >= 10 && showAllMembers;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSelectPolitician(member)}
                  className="w-full flex items-center gap-4 px-4 py-3 border-b border-r border-border last:border-b-0 hover:bg-muted/50 transition-colors text-left"
                  style={{
                    opacity: isNew ? (membersAnimating ? 0 : 1) : 1,
                    transform: isNew ? (membersAnimating ? "translateY(10px)" : "translateY(0)") : "translateY(0)",
                    transition: `opacity 0.4s ease ${Math.max(0, i - 10) * 30}ms, transform 0.4s ease ${Math.max(0, i - 10) * 30}ms`,
                  }}
                >
                  <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                    <img src={member.imageUrl || "/placeholder.svg"} alt={member.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{member.name}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: mcCol }}>
                    {mChange >= 0 ? "+" : ""}{mChange}
                  </span>
                  <span className="text-sm font-bold font-mono" style={{ color: msc }}>{member.score}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
