"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LAW_NAMES } from "@/lib/parliament-data";

interface LawAnalysis {
  id: number;
  name: string;
  date: string;
  category: string;
  summary: string;
  analysis: string;
}

// Simplified categories mapping -- merge similar categories
const CATEGORY_MAP: Record<string, string> = {
  "Dane": "Ekonomika",
  "Dan\u011b": "Ekonomika",
  "Verejne finance": "Ekonomika",
  "Ve\u0159ejn\u00e9 finance": "Ekonomika",
  "Stavebnictvi": "Legislativa",
  "Stavebnictv\u00ed": "Legislativa",
  "Digitalizace": "Legislativa",
  "Obcanska prava": "Legislativa",
  "Ob\u010dansk\u00e1 pr\u00e1va": "Legislativa",
  "Socialni politika": "Soci\u00e1ln\u00ed politika",
  "Soci\u00e1ln\u00ed politika": "Soci\u00e1ln\u00ed politika",
};

// Distinct colors for each category
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Ekonomika": { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30" },
  "Bezpe\u010dnost": { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400", border: "border-red-500/30" },
  "Obrana": { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30" },
  "Energetika": { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30" },
  "Soci\u00e1ln\u00ed politika": { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/30" },
  "Zahrani\u010dn\u00ed politika": { bg: "bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/30" },
  "Legislativa": { bg: "bg-orange-500/15", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30" },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
}

function normalizeCategory(cat: string): string {
  return CATEGORY_MAP[cat] || cat;
}

function parseLawAnalyses(text: string): LawAnalysis[] {
  const laws: LawAnalysis[] = [];
  const entries = text.split(/=== LAW_ID:\s*(\d+)\s*===/);

  for (let i = 1; i < entries.length; i += 2) {
    const id = parseInt(entries[i], 10);
    const block = entries[i + 1];
    if (!block) continue;

    const getField = (key: string): string => {
      const regex = new RegExp(`^${key}:\\s*(.+)$`, "m");
      const match = block.match(regex);
      return match ? match[1].trim() : "";
    };

    const analysisMatch = block.match(/ANALYSIS:\s*\n([\s\S]*?)(?:===|$)/);
    const analysis = analysisMatch ? analysisMatch[1].trim() : "";

    laws.push({
      id,
      name: getField("NAME") || LAW_NAMES[id - 1] || `Zákon #${id}`,
      date: getField("DATE"),
      category: normalizeCategory(getField("CATEGORY")),
      summary: getField("SUMMARY"),
      analysis,
    });
  }

  return laws;
}

function LawItem({ law, isOpen, onToggle }: { law: LawAnalysis; isOpen: boolean; onToggle: () => void }) {
  const catStyle = getCategoryStyle(law.category);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full grid items-center px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        style={{ gridTemplateColumns: "20px 32px 1fr 140px 100px" }}
      >
        {/* Expand/collapse indicator */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>

        {/* Law number */}
        <span className="text-xs font-mono text-muted-foreground text-center">
          {String(law.id).padStart(2, "0")}
        </span>

        {/* Name */}
        <span className="text-sm font-medium text-foreground min-w-0 truncate">
          {law.name}
        </span>

        {/* Category -- colored badge */}
        <span className={`text-xs font-mono uppercase tracking-wider text-right hidden md:inline-flex items-center justify-end`}>
          <span className={`px-2 py-0.5 rounded border whitespace-nowrap ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {law.category}
          </span>
        </span>

        {/* Date */}
        <span className="text-xs font-mono text-muted-foreground text-right hidden sm:block">
          {law.date}
        </span>
      </button>

      {/* Expanded analysis section */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isOpen ? "2000px" : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-5 pb-6 pt-2 ml-8 border-l-2 border-primary/30">
          {/* Summary */}
          {law.summary && (
            <div className="mb-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Souhrn</h4>
              <p className="text-sm text-foreground leading-relaxed">{law.summary}</p>
            </div>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap gap-4 mb-4 py-3 border-y border-border">
            <div>
              <span className="text-xs font-mono text-muted-foreground">{"Datum: "}</span>
              <span className="text-xs font-mono text-foreground">{law.date}</span>
            </div>
            <div>
              <span className="text-xs font-mono text-muted-foreground">{"Kategorie: "}</span>
              <span className="text-xs font-mono text-foreground">{law.category}</span>
            </div>
          </div>

          {/* Full analysis */}
          {law.analysis && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{"Anal\u00fdza Patriot Index"}</h4>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {law.analysis}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LawsPageProps {
  onBack: () => void;
}

export function LawsPage({ onBack }: LawsPageProps) {
  const [laws, setLaws] = useState<LawAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLawId, setOpenLawId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/law-analyses.txt")
      .then((res) => res.text())
      .then((text) => {
        setLaws(parseLawAnalyses(text));
        setLoading(false);
      })
      .catch(() => {
        const fallback: LawAnalysis[] = LAW_NAMES.map((name, i) => ({
          id: i + 1,
          name,
          date: "",
          category: "",
          summary: "",
          analysis: "Analýza bude doplněna.",
        }));
        setLaws(fallback);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    laws.forEach((l) => { if (l.category) cats.add(l.category); });
    return Array.from(cats).sort();
  }, [laws]);

  const filteredLaws = useMemo(() => {
    if (!filterCategory) return laws;
    return laws.filter((l) => l.category === filterCategory);
  }, [laws, filterCategory]);

  const handleToggle = (id: number) => {
    setOpenLawId(openLawId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-border">
        <button onClick={onBack} type="button" className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors z-10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          {"Zp\u011bt"}
        </button>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono uppercase tracking-[0.3em] text-foreground whitespace-nowrap">
          {"Anal\u00fdzy z\u00e1kon\u016f"}
        </span>
        <div className="flex items-center gap-4 z-10">
          <ThemeToggle />
        </div>
      </header>

      {/* Category filter */}
      <div className="flex justify-center px-4 py-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setFilterCategory(null)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
              !filterCategory ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {"V\u0161echny"} ({laws.length})
          </button>
          {categories.map((cat) => {
            const catStyle = getCategoryStyle(cat);
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border rounded ${
                  filterCategory === cat
                    ? `${catStyle.bg} ${catStyle.text} ${catStyle.border}`
                    : "bg-secondary text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Column headers -- same grid as LawItem */}
      <div
        className="grid items-center px-5 py-2.5 border-b border-border bg-muted/30"
        style={{ gridTemplateColumns: "20px 32px 1fr 140px 100px" }}
      >
        <span />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-center">#</span>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{"N\u00e1zev"}</span>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-right hidden md:block">Kategorie</span>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-right hidden sm:block">Datum</span>
      </div>

      {/* Laws list */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-sm font-mono text-muted-foreground">{"Načítám zákony..."}</span>
          </div>
        ) : filteredLaws.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-sm font-mono text-muted-foreground">{"Žádné zákony v této kategorii."}</span>
          </div>
        ) : (
          filteredLaws.map((law) => (
            <LawItem
              key={law.id}
              law={law}
              isOpen={openLawId === law.id}
              onToggle={() => handleToggle(law.id)}
            />
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="border-t border-border px-6 py-6 bg-card">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-mono text-muted-foreground leading-relaxed">
{"Analýzy zákonů jsou zpracovány redakčním týmem Patriot Index. Hodnocení vyjadřuje míru, ve které zákon přispívá k ochraně národních zájmů České republiky."}
          </p>
        </div>
      </div>
    </div>
  );
}
