"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { Politician, Party } from "@/lib/parliament-data";

interface CompareItem {
  type: "politician" | "party";
  data: Politician | Party;
}

interface CompareViewProps {
  leftItem: CompareItem;
  rightItem: CompareItem | null;
  politicians: Politician[];
  onClose: () => void;
  onScrollToSchematic?: () => void;
}

function scoreColor(score: number): string {
  if (score >= 1200) return "#22c55e";
  if (score >= 900) return "#eab308";
  return "#ef4444";
}

function getPolScore(item: CompareItem, politicians: Politician[]): number {
  if (item.type === "politician") return (item.data as Politician).score;
  const party = item.data as Party;
  const members = politicians.filter((p) => p.party === party.name);
  if (members.length === 0) return 0;
  return Math.round(members.reduce((s, p) => s + p.score, 0) / members.length);
}

function getLastChange(item: CompareItem, politicians: Politician[]): number {
  if (item.type === "politician") {
    const pol = item.data as Politician;
    const lastThree = pol.voteHistory.slice(-3);
    return lastThree.length > 0
      ? Math.round(lastThree.reduce((s, v) => s + v.scoreChange, 0) / lastThree.length)
      : 0;
  }
  const party = item.data as Party;
  const members = politicians.filter((p) => p.party === party.name);
  if (members.length === 0) return 0;
  let total = 0;
  for (const m of members) {
    const lastThree = m.voteHistory.slice(-3);
    total += lastThree.length > 0
      ? Math.round(lastThree.reduce((s, v) => s + v.scoreChange, 0) / lastThree.length)
      : 0;
  }
  return Math.round(total / members.length);
}

function getName(item: CompareItem): string {
  if (item.type === "politician") return (item.data as Politician).name;
  return (item.data as Party).name;
}

function getChartData(item: CompareItem, politicians: Politician[]) {
  if (item.type === "politician") {
    const pol = item.data as Politician;
    let cum = 1000;
    return pol.voteHistory.map((v) => {
      cum += v.scoreChange;
      return { name: v.lawName.substring(0, 15), score: cum };
    });
  }
  const party = item.data as Party;
  const members = politicians.filter((p) => p.party === party.name);
  if (members.length === 0) return [];
  const numVotes = members[0]?.voteHistory.length ?? 0;
  const data: Array<{ name: string; score: number }> = [];
  for (let i = 0; i < numVotes; i++) {
    let total = 0;
    for (const m of members) {
      let cum = 1000;
      for (let j = 0; j <= i; j++) cum += m.voteHistory[j].scoreChange;
      total += cum;
    }
    data.push({ name: members[0].voteHistory[i].lawName.substring(0, 15), score: Math.round(total / members.length) });
  }
  return data;
}

function getVoteHistory(item: CompareItem, politicians: Politician[]) {
  if (item.type === "politician") {
    return (item.data as Politician).voteHistory.slice(-5).reverse();
  }
  const party = item.data as Party;
  const members = politicians.filter((p) => p.party === party.name);
  if (members.length === 0) return [];
  const numVotes = members[0]?.voteHistory.length ?? 0;
  const lastFive = [];
  for (let i = Math.max(0, numVotes - 5); i < numVotes; i++) {
    const vote = members[0].voteHistory[i];
    let totalChange = 0;
    for (const m of members) totalChange += m.voteHistory[i].scoreChange;
    lastFive.push({ ...vote, scoreChange: Math.round(totalChange / members.length) });
  }
  return lastFive.reverse();
}

function CompareCard({ item, politicians, color }: { item: CompareItem; politicians: Politician[]; color: string }) {
  const score = getPolScore(item, politicians);
  const change = getLastChange(item, politicians);
  const chartData = useMemo(() => getChartData(item, politicians), [item, politicians]);
  const votes = getVoteHistory(item, politicians);
  const sc = scoreColor(score);
  const changeCol = change >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div className="flex-1 p-6 flex flex-col gap-4">
      {/* Name and identity */}
      <div className="flex items-center gap-3">
        {item.type === "politician" ? (
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 bg-secondary flex-shrink-0" style={{ borderColor: (item.data as Politician).partyColor }}>
            <img src={(item.data as Politician).imageUrl || "/placeholder.svg"} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
        ) : (
          <div className="w-14 h-14 flex items-center justify-center text-lg font-bold font-mono flex-shrink-0" style={{ backgroundColor: (item.data as Party).color, color: "#fff" }}>
            {(item.data as Party).shortName}
          </div>
        )}
        <div>
          <div className="text-lg font-bold text-foreground">{getName(item)}</div>
          {item.type === "politician" && (
            <span className="text-xs font-mono text-muted-foreground uppercase">{(item.data as Politician).party}</span>
          )}
          {item.type === "party" && (
            <span className="text-xs font-mono text-muted-foreground">{(item.data as Party).seats} {"poslanc\u016f"}</span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center p-3 border border-border bg-background flex-1">
          <span className="text-xs font-mono uppercase text-muted-foreground">{"Sk\u00f3re"}</span>
          <span className="text-3xl font-bold font-mono" style={{ color: sc }}>{score}</span>
        </div>
        <div className="flex flex-col items-center p-3 border border-border bg-background flex-1">
          <span className="text-xs font-mono uppercase text-muted-foreground">{"Zm\u011bna"}</span>
          <span className="text-lg font-bold font-mono" style={{ color: changeCol }}>
            {change >= 0 ? "+" : ""}{change}
          </span>
        </div>
      </div>

      {/* Mini chart */}
      <div className="h-[160px] border border-border bg-background p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <YAxis tick={{ fontSize: 8, className: "fill-muted-foreground" }} width={35} tickLine={false} />
            <XAxis tick={false} height={0} />
            <Area type="monotone" dataKey="score" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.15} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent votes */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{"Posledn\u00ed hlasov\u00e1n\u00ed"}</span>
        {votes.map((v, i) => (
          <div key={`${v.lawName}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="text-foreground truncate flex-1" title={v.lawName}>{v.lawName}</span>
            <span className="font-mono font-bold" style={{ color: v.scoreChange >= 0 ? "#22c55e" : "#ef4444" }}>
              {v.scoreChange >= 0 ? "+" : ""}{v.scoreChange}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Center comparison wedge -- proper box with solid background, single green arrow for winner
function CompareWedge({ leftItem, rightItem, politicians }: { leftItem: CompareItem; rightItem: CompareItem; politicians: Politician[] }) {
  const leftScore = getPolScore(leftItem, politicians);
  const rightScore = getPolScore(rightItem, politicians);
  const leftChange = getLastChange(leftItem, politicians);
  const rightChange = getLastChange(rightItem, politicians);

  const metrics = [
    { label: "Sk\u00f3re", left: leftScore, right: rightScore },
    { label: "Zm\u011bna", left: leftChange, right: rightChange },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-5 py-8 bg-secondary border-x border-border" style={{ minWidth: "140px" }}>
      <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground font-bold">VS</span>
      {metrics.map((m) => {
        const leftWins = m.left > m.right;
        const tie = m.left === m.right;
        const diff = Math.abs(m.left - m.right);
        return (
          <div key={m.label} className="flex flex-col items-center gap-2 p-4 bg-card border border-border w-full">
            <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{m.label}</span>
            {tie ? (
              <span className="text-sm font-mono font-bold text-muted-foreground">{"="}</span>
            ) : (
              <div className="flex items-center gap-2">
                {/* Single green arrow pointing to the winner */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  {leftWins ? (
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  ) : (
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  )}
                </svg>
                <span className="text-sm font-mono font-bold text-[#22c55e]">+{diff}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CompareView({ leftItem, rightItem, politicians, onClose, onScrollToSchematic }: CompareViewProps) {
  return (
    <div className="bg-card px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">{"Porovn\u00e1n\u00ed"}</span>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-mono uppercase tracking-wider text-[#CF4444] border-2 border-[#CF4444] hover:bg-[#CF4444] hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            {"Zav\u0159\u00edt porovn\u00e1n\u00ed"}
          </button>
        </div>

        <div className="flex border border-border bg-background overflow-hidden">
          {/* Left side */}
          <CompareCard item={leftItem} politicians={politicians} color="#CF4444" />

          {/* Center wedge */}
          {rightItem ? (
            <CompareWedge leftItem={leftItem} rightItem={rightItem} politicians={politicians} />
          ) : (
            <div className="w-px bg-border" />
          )}

          {/* Right side */}
          {rightItem ? (
            <CompareCard item={rightItem} politicians={politicians} color="#3b82f6" />
          ) : (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                {/* Clickable plus icon that scrolls to schematic */}
                <button
                  type="button"
                  onClick={onScrollToSchematic}
                  className="mx-auto mb-4 w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground/40 group"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:scale-110 transition-transform">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8M12 8v8" />
                  </svg>
                </button>
                <p className="text-sm font-mono text-muted-foreground">
                  {leftItem.type === "politician" ? "Vyberte si politika" : "Vyberte si stranu"} 
                </p>
                <p className="text-xs font-mono text-muted-foreground/60 mt-2">
                  {"Klikn\u011bte na tla\u010d\u00edtko v\u00fd\u0161e a vyberte ze sch\u00e9matu"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
