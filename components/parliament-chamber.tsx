"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect, memo, CSSProperties } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PoliticianProfile } from "@/components/politician-profile";
import { PartyProfile } from "@/components/party-profile";
import { TwitterFeed } from "@/components/twitter-feed";
import { CompareView } from "@/components/compare-view";
import {
  generateSeatPositions,
  getAge,
  type Politician,
  type Party,
} from "@/lib/parliament-data"; 
import { fetchPoliticians, fetchParties } from "@/lib/api-loader"; // Přidána etchParties


// Get contrasting/inverted color for highlight visibility on any party color
const getContrastColor = (hexColor: string): string => {
  // Parse hex color
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Invert the color
  const invR = 255 - r;
  const invG = 255 - g;
  const invB = 255 - b;
  
  // Return inverted color as hex
  return `#${invR.toString(16).padStart(2, "0")}${invG.toString(16).padStart(2, "0")}${invB.toString(16).padStart(2, "0")}`;
};

// Extract initials - memoized
const getInitials = (name: string): string => {
  const parts = name.split(" ");
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

function SocialLinks() {
  return (
    <div className="flex items-center gap-3">
      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.044 1.613.115V7.93c-.263-.006-.72-.01-1.222-.01-1.733 0-2.41.657-2.41 2.365v1.76h3.454l-.465 3.667H12.94v8.142C18.522 22.988 23 18.047 23 12.142 23 5.783 17.955.738 11.597.738S.193 5.783.193 12.142c0 5.117 3.427 9.457 8.107 10.83.268.063.502.096.801.719Z" /></svg>
      </a>
      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
      </a>
      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
      </a>
    </div>
  );
}

// Search component for finding politicians
function PoliticianSearch({
  politicians,
  onHover,
  onSelect,
  getColor,
}: {
  politicians: Politician[];
  onHover: (polIndex: number | null) => void;
  onSelect: (polIndex: number) => void;
  getColor: (partyShort: string) => string;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const matches = politicians
      .map((p, i) => ({ pol: p, index: i }))
      .filter(({ pol }) => pol.name.toLowerCase().includes(q));

    // Sort: names/surnames that START with query come first
    matches.sort((a, b) => {
      const aName = a.pol.name.toLowerCase();
      const bName = b.pol.name.toLowerCase();
      const aParts = aName.split(" ");
      const bParts = bName.split(" ");
      const aStarts = aParts.some((part) => part.startsWith(q));
      const bStarts = bParts.some((part) => part.startsWith(q));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      // Then sort by first name match
      const aFirstStarts = aParts[0].startsWith(q);
      const bFirstStarts = bParts[0].startsWith(q);
      if (aFirstStarts && !bFirstStarts) return -1;
      if (!aFirstStarts && bFirstStarts) return 1;
      return 0;
    });
    return matches.slice(0, 8);
  }, [query, politicians]);

  const showDropdown = focused && query.trim().length > 0 && results.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        {!query && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder=""
          className="w-full max-w-[200px] h-8 px-3 pl-8 text-xs font-mono bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          style={{ paddingLeft: query ? "12px" : "32px" }}
        />
      </div>
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 w-[280px] bg-card border border-border shadow-2xl z-50 max-h-[300px] overflow-y-auto"
        >
          {results.map(({ pol, index }) => (
            <button
              key={pol.id}
              type="button"
              className="w-full grid items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              style={{ gridTemplateColumns: "12px 1fr 50px 50px" }}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
              onClick={() => {
                onSelect(index);
                setQuery("");
                setFocused(false);
              }}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(pol.shortParty) }} />
              <span className="text-sm text-foreground truncate">{pol.name}</span>
              <span className="text-xs font-mono text-muted-foreground uppercase text-right">{pol.shortParty}</span>
              <span className="text-xs font-bold font-mono text-right" style={{ color: pol.score >= 1200 ? "#22c55e" : pol.score >= 900 ? "#eab308" : "#ef4444" }}>
                {pol.score}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type FilterType = "strany" | "kraje" | "vek" | "pohlavi";

const AGE_BRACKETS: { key: string; label: string; min: number; max: number }[] = [
  { key: "under30", label: "Do 30 let", min: 0, max: 29 },
  { key: "30-42", label: "30\u201342 let", min: 30, max: 42 },
  { key: "43-55", label: "43\u201355 let", min: 43, max: 55 },   // ← opraveno
  { key: "56-68", label: "56-68 let", min: 56, max: 68 },
  { key: "69+", label: "Nad 68 let", min: 69, max: 100 },
];

const GENDER_OPTIONS: { key: string; label: string }[] = [
  { key: "Muž", label: "Mu\u017ei" },
  { key: "Žena", label: "\u017deny" },
];

const REGIONS: { key: string; label: string }[] = [
  { key: "Hl. m. Praha", label: "Praha" },
  { key: "Středočeský", label: "Středočeský" },
  { key: "Jihočeský", label: "Jihočeský" },
  { key: "Plzeňský", label: "Plzeňský" },
  { key: "Karlovarský", label: "Karlovarský" },
  { key: "Ústecký", label: "Ústecký" },
  { key: "Liberecký", label: "Liberecký" },
  { key: "Královéhradecký", label: "Královéhr." },
  { key: "Pardubický", label: "Pardubický" },
  { key: "Vysočina", label: "Vysočina" },
  { key: "Jihomoravský", label: "Jihomoravský" },
  { key: "Olomoucký", label: "Olomoucký" },
  { key: "Zlínský", label: "Zlínský" },
  { key: "Moravskoslezský", label: "Moravskoslez." },
];

const createFadingCache = (
  politicians: Politician[],
  selectedParty: string | null,
  selectedRegion: string | null,
  selectedGender: string | null,
  selectedAge: string | null,
  compareMode: boolean,
  compareLeft: { type: "politician" | "party"; data: Politician | Party } | null,
  compareRight: { type: "politician" | "party"; data: Politician | Party } | null,
): boolean[] => {
  const cache = new Array(politicians.length);

  // Pre-resolve age bracket outside the loop
  const ageBracket = selectedAge !== null
    ? AGE_BRACKETS.find(b => b.key === selectedAge) ?? null
    : null;

  // Pre-resolve compare party names outside the loop
  const compareLeftParty = compareMode && compareLeft?.type === "party"
    ? (compareLeft.data as Party).name
    : null;
  const compareRightParty = compareMode && compareRight?.type === "party"
    ? (compareRight.data as Party).name
    : null;
  
  for (let i = 0; i < politicians.length; i++) {
    const pol = politicians[i];
    
    // Compare mode fading
    if (compareLeftParty !== null) {
      if (pol.party === compareLeftParty) {
        cache[i] = false;
        continue;
      }
      if (compareRightParty && pol.party === compareRightParty) {
        cache[i] = false;
        continue;
      }
      cache[i] = true;
      continue;
    }
    
    // Party filter
    if (selectedParty !== null && pol.party !== selectedParty) {
      cache[i] = true;
      continue;
    }
    
    // Region filter
    if (selectedRegion !== null && pol.region !== selectedRegion) {
      cache[i] = true;
      continue;
    }
    
    // Gender filter
    if (selectedGender !== null && pol.gender !== selectedGender) {
      cache[i] = true;
      continue;
    }
    
    // Age filter
    if (ageBracket !== null) {
      const age = getAge(pol.birthDate);
      if (age < ageBracket.min || age > ageBracket.max) {
        cache[i] = true;
        continue;
      }
    }
    
    cache[i] = false;
  }
  
  return cache;
};

const createWedgeMapping = (
  seatPositions: Array<{ x: number; y: number; row: number }>,
  politicians: Politician[],
): number[] => {
  const centerX = 50;
  const centerY = 95;

  // Sort all seat positions by angle (ascending = left to right).
  // The generation formula x = cx - r·cos(α), y = cy - r·sin(α) means the
  // inverse is α = atan2(cy - y, cx - x), which is monotonically left→right.
  const sorted = seatPositions
    .map((seat, i) => ({
      index: i,
      angle: Math.atan2(centerY - seat.y, centerX - seat.x),
    }))
    .sort((a, b) => a.angle - b.angle);

  // Assign each politician (already ordered by party) to the next sorted seat.
  // Party 1 gets the leftmost N1 seats, party 2 the next N2, etc.
  const mapping = new Array<number>(politicians.length);
  for (let i = 0; i < politicians.length; i++) {
    mapping[i] = sorted[i].index;
  }
  return mapping;
};

// **OPTIMIZATION**: Memoized seat circle component
interface SeatCircleProps {
  pol: Politician;
  polIndex: number;
  seat: { x: number; y: number; row: number };
  seatRadius: number;
  faded: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isCompareLeft: boolean;
  isCompareRight: boolean;
  seatsRevealed: boolean;
  onMouseEnter: (polIndex: number) => void;
  onMouseLeave: () => void;
  onClick: (polIndex: number) => void;
  getColor: (party: string) => string;
}

const SeatCircle = memo(({
  pol,
  polIndex,
  seat,
  seatRadius,
  faded,
  isHovered,
  isSelected,
  isCompareLeft,
  isCompareRight,
  seatsRevealed,
  onMouseEnter,
  onMouseLeave,
  onClick,
  getColor,
}: SeatCircleProps) => {
  const isHighlighted = isSelected || isCompareLeft || isCompareRight || isHovered;
  const r = isHighlighted ? seatRadius * 1.15 : seatRadius;
  const color = getColor(pol.party);
  const contrastColor = getContrastColor(color);
  const fadedOpacity = faded ? 0.4 : 1;
  const initials = getInitials(pol.name);

  const handleMouseEnter = useCallback(() => onMouseEnter(polIndex), [onMouseEnter, polIndex]);
  const handleClick = useCallback(() => onClick(polIndex), [onClick, polIndex]);

  // Determine stroke color - use inverted contrast color when highlighted
  const strokeColor = isHighlighted
    ? contrastColor
    : isHovered
      ? "hsl(var(--foreground))"
      : faded
        ? "hsl(var(--muted-foreground) / 0.4)"
        : "rgba(255,255,255,0.35)";
  
  const strokeWidth = isHighlighted ? 0.7 : isHovered ? 0.4 : 0.25;

  return (
    <g
      key={pol.id}
      className="cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      style={{
        opacity: seatsRevealed ? fadedOpacity : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {!faded && !isHighlighted && (
        <circle
          cx={seat.x}
          cy={seat.y}
          r={r + 0.4}
          fill="none"
          className="stroke-foreground/10 dark:stroke-foreground/5"
          strokeWidth={0.4}
        />
      )}
      <circle
        cx={seat.x}
        cy={seat.y}
        r={r}
        fill={faded ? "hsl(var(--muted-foreground) / 0.25)" : color}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {!faded && !isHighlighted && (
        <circle
          cx={seat.x}
          cy={seat.y}
          r={r - 0.35}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.2}
        />
      )}
      {!faded && (
        <text
          x={seat.x}
          y={seat.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={2.6}
          fontWeight="800"
          fill="#ffffff"
          className="pointer-events-none select-none font-mono"
          style={{ textShadow: "0 0 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.5)" }}
        >
          {initials}
        </text>
      )}
    </g>
  );
});
SeatCircle.displayName = "SeatCircle";

interface ParliamentChamberProps {
  onBack: () => void;
  onGoToLaws?: () => void;
}

export function ParliamentChamber({ onBack, onGoToLaws }: ParliamentChamberProps) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [selectedPolitician, setSelectedPolitician] = useState<Politician | null>(null);
  const [selectedPartyProfile, setSelectedPartyProfile] = useState<Party | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileClosing, setProfileClosing] = useState(false);
  const [seatsRevealed, setSeatsRevealed] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareLeft, setCompareLeft] = useState<{ type: "politician" | "party"; data: Politician | Party } | null>(null);
  const [compareRight, setCompareRight] = useState<{ type: "politician" | "party"; data: Politician | Party } | null>(null);
  const [compareFadeIn, setCompareFadeIn] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const schematicRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);



const [parties, setParties] = useState<Party[]>([]);
const [politiciansFromApi, setPoliticiansFromApi] = useState<Politician[]>([]);

const getColor = useCallback((partyNameOrShort: string): string => {
    const party = parties.find(
      (p) => p.name === partyNameOrShort || p.shortName === partyNameOrShort
    );
    return party?.color || "#666666";
  }, [parties]);




  // Načti data jednou při mountu
useEffect(() => {
  const loadData = async () => {
    try {
      const [pols, pars] = await Promise.all([
        fetchPoliticians(),
        fetchParties()
      ]);
      setPoliticiansFromApi(pols);
      setParties(pars);
    } catch (e) {
      console.error("Nepodařilo se načíst data z API", e);
      // fallback na prázdné pole nebo statická data
    }
  };
  loadData();
}, []);


  const politicians = politiciansFromApi;
  const seatPositions = useMemo(() => generateSeatPositions(politicians.length), [politicians.length]);
  const wedgeMapping = useMemo(() => createWedgeMapping(seatPositions, politicians), [seatPositions, politicians.length]);



  // **OPTIMIZATION**: Cache fading state
  const fadedCache = useMemo(
    () => createFadingCache(
      politicians,
      selectedParty,
      selectedRegion,
      selectedGender,
      selectedAge,
      compareMode,
      compareLeft,
      compareRight,
    ),
    [politicians, selectedParty, selectedRegion, selectedGender, selectedAge, compareMode, compareLeft, compareRight],
  );

  // Stable scroll handler using ref to avoid re-registering on hoveredSeat changes
  const hoveredSeatRef = useRef<number | null>(null);
  hoveredSeatRef.current = hoveredSeat;

  useEffect(() => {
    const handleScroll = () => {
      if (hoveredSeatRef.current !== null) {
        setHoveredSeat(null);
        setTooltipPos(null);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSeatsRevealed(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSeatsRevealed(false);
    const timer = setTimeout(() => setSeatsRevealed(true), 80);
    return () => clearTimeout(timer);
  }, [selectedParty]);

  // **OPTIMIZATION**: Throttled mouse move handler (16ms = ~60fps)
  const lastMouseMoveRef = useRef(0);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseMoveRef.current < 16) return;
    lastMouseMoveRef.current = now;
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const activeParties = useMemo(() => parties.filter((p) => p.seats > 0), [parties]);
  const hasAnySelection = selectedParty !== null || selectedPolitician !== null;
  const seatRadius = 3.3;

  const showProfile = useCallback((cb: () => void) => {
    setProfileClosing(false);
    setProfileVisible(false);
    cb();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setProfileVisible(true);
        setTimeout(() => {
          profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      });
    });
  }, []);

  const hideProfile = useCallback((cb: () => void) => {
    setProfileClosing(true);
    setProfileVisible(false);
    setTimeout(() => {
      cb();
      setProfileClosing(false);
    }, 600);
  }, []);

  const clearAll = useCallback(() => {
    hideProfile(() => {
      setSelectedParty(null);
      setSelectedPartyProfile(null);
      setSelectedPolitician(null);
    });
  }, [hideProfile]);

  const handlePartyClick = useCallback(
    (partyName: string) => {
      if (compareMode && compareLeft) {
        if (compareLeft.type === "party") {
          const party = parties.find((p) => p.name === partyName);
          if (party) setCompareRight({ type: "party", data: party });
        }
        return;
      }
      if (selectedParty === partyName && selectedPartyProfile) {
        clearAll();
      } else {
        showProfile(() => {
          setSelectedParty(partyName);
          setSelectedPolitician(null);
          const party = parties.find((p) => p.name === partyName);
          if (party) setSelectedPartyProfile(party);
        });
      }
    },
    [selectedParty, selectedPartyProfile, showProfile, clearAll, compareMode, compareLeft],
  );

  const handleSeatClick = useCallback(
    (polIndex: number) => {
      const politician = politicians[polIndex];
      if (!politician) return;
      if (compareMode && compareLeft) {
        if (compareLeft.type === "politician") {
          setCompareRight({ type: "politician", data: politician });
        }
        return;
      }
      showProfile(() => {
        setSelectedParty(politician.party);
        setSelectedPolitician(politician);
        setSelectedPartyProfile(null);
      });
    },
    [politicians, showProfile, compareMode, compareLeft],
  );

  const handleSelectPoliticianFromParty = useCallback(
    (politician: Politician) => {
      showProfile(() => {
        setSelectedPolitician(politician);
        setSelectedPartyProfile(null);
      });
    },
    [showProfile],
  );

  const startCompare = useCallback((type: "politician" | "party", data: Politician | Party) => {
    setCompareMode(true);
    setCompareLeft({ type, data });
    setCompareRight(null);
    setSelectedPartyProfile(null);
    setSelectedPolitician(null);
    setSelectedParty(null);
    setProfileVisible(false);
    setProfileClosing(false);
    setCompareFadeIn(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setCompareFadeIn(true)));
  }, []);

  const exitCompare = useCallback(() => {
    setCompareFadeIn(false);
    setTimeout(() => {
      setCompareMode(false);
      setCompareLeft(null);
      setCompareRight(null);
    }, 300);
  }, []);

  const scrollToSchematic = useCallback(() => {
    schematicRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToFaq = useCallback(() => {
    faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleGoToParty = useCallback((partyName: string) => {
    if (compareMode) exitCompare();
    showProfile(() => {
      setSelectedParty(partyName);
      setSelectedPolitician(null);
      const party = parties.find((p) => p.name === partyName);
      if (party) setSelectedPartyProfile(party);
    });
  }, [showProfile, compareMode, exitCompare]);

  const showTwitter = selectedPartyProfile && !selectedPolitician;
  const compareLeftPolId = compareMode && compareLeft?.type === "politician" ? (compareLeft.data as Politician).id : -1;
  const compareRightPolId = compareMode && compareRight?.type === "politician" ? (compareRight.data as Politician).id : -1;

  // **OPTIMIZATION**: Stable seat event handlers to preserve SeatCircle memo
  const handleSeatMouseEnter = useCallback((polIndex: number) => {
    setHoveredSeat(polIndex);
  }, []);
  const handleSeatMouseLeave = useCallback(() => {
    setHoveredSeat(null);
  }, []);

  // **OPTIMIZATION**: Memoized tooltip style calculation
  const getTooltipStyle = useCallback((): CSSProperties => {
    let posX = tooltipPos?.x ?? 0;
    let posY = tooltipPos?.y ?? 0;

    if ((!tooltipPos || !tooltipPos.x) && hoveredSeat !== null && svgRef.current) {
      const seatIdx = wedgeMapping[hoveredSeat];
      const seat = seatPositions[seatIdx];
      if (seat) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const vb = svgRef.current.viewBox.baseVal;
        posX = svgRect.left + ((seat.x - vb.x) / vb.width) * svgRect.width;
        posY = svgRect.top + ((seat.y - vb.y) / vb.height) * svgRect.height;
      }
    }

    if (posX === 0 && posY === 0) return { display: "none" };

    const tooltipW = 260;
    const tooltipH = 140;
    let x = posX - tooltipW / 2;
    let y = posY - tooltipH - 14;
    
    if (x < 8) x = 8;
    if (x + tooltipW > window.innerWidth - 8) x = window.innerWidth - tooltipW - 8;
    if (y < 8) y = posY + 16;
    if (y + tooltipH > window.innerHeight - 8) y = window.innerHeight - tooltipH - 8;
    
    return { position: "fixed" as const, left: x, top: y, zIndex: 9999, pointerEvents: "none" as const };
  }, [tooltipPos, hoveredSeat, wedgeMapping, seatPositions]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-border">
        <button onClick={onBack} type="button" className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors z-10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Zpět
        </button>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono uppercase tracking-[0.3em] text-foreground whitespace-nowrap">
          Poslanecká sněmovna
        </span>
        <div className="flex items-center gap-4 z-10">
          <SocialLinks />
          <ThemeToggle />
        </div>
      </header>

      {/* Multi-filter system */}
      <div className="border-b border-border">
        {/* Main filter selector row */}
        <div className="flex flex-wrap items-center justify-center px-4 py-3 gap-3">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex-shrink-0">
            Vyberte si filtr:
          </span>
          {(["strany", "kraje", "vek", "pohlavi"] as FilterType[]).map((ft) => {
            const labels: Record<FilterType, string> = { 
              strany: "Politické strany", 
              kraje: "Kraje", 
              vek: "Věk", 
              pohlavi: "Pohlaví" 
            };
            const isActive = activeFilters.includes(ft);
            return (
              <button 
                key={ft} 
                type="button"
                onClick={() => {
                  if (isActive) {
                    setActiveFilters(activeFilters.filter(f => f !== ft));
                    if (ft === "strany") setSelectedParty(null);
                    if (ft === "kraje") setSelectedRegion(null);
                    if (ft === "vek") setSelectedAge(null);
                    if (ft === "pohlavi") setSelectedGender(null);
                  } else {
                    setActiveFilters([...activeFilters, ft]);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border ${
                  isActive ? "bg-foreground text-background border-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {labels[ft]}
              </button>
            );
          })}
          {activeFilters.length > 0 && (
            <button 
              type="button"
              onClick={() => { 
                setActiveFilters([]); 
                setSelectedParty(null); 
                setSelectedRegion(null); 
                setSelectedAge(null); 
                setSelectedGender(null); 
              }}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border transition-all flex-shrink-0"
            >
              Zrušit filtry
            </button>
          )}
        </div>

        {/* Active filter option rows */}
        {activeFilters.map((ft) => (
          <div 
            key={ft} 
            className="flex flex-wrap items-center justify-center gap-1.5 px-4 py-4 border-t border-border bg-secondary/30"
            style={{ animation: "fadeIn 0.25s ease" }}
          >
            {ft === "strany" && (
              <>
                <button 
                  type="button" 
                  onClick={() => { setSelectedParty(null); clearAll(); }}
                  className={`px-2.5 py-1 text-xs font-mono transition-all ${!selectedParty ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
                >
                  Všechny
                </button>
                {activeParties.map((party) => (
                  <button 
                    type="button" 
                    key={party.name} 
                    onClick={() => handlePartyClick(party.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-all ${
                      selectedParty === party.name ? "bg-foreground text-background" : "bg-card text-muted-foreground"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(party.name), border: "1px solid hsl(var(--foreground) / 0.3)" }} />
                    {party.shortName}
                    <span className="opacity-60">{party.seats}</span>
                  </button>
                ))}
              </>
            )}
            {ft === "kraje" && (
              <>
                <button 
                  type="button" 
                  onClick={() => setSelectedRegion(null)}
                  className={`px-2.5 py-1 text-xs font-mono transition-all ${!selectedRegion ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
                >
                  Vše
                </button>
                {REGIONS.map((region) => (
                  <button 
                    type="button" 
                    key={region.key}
                    onClick={() => setSelectedRegion(selectedRegion === region.key ? null : region.key)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all ${selectedRegion === region.key ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
                  >
                    {region.label}
                  </button>
                ))}
              </>
            )}
            {ft === "vek" && (
              <>
                <button 
                  type="button" 
                  onClick={() => setSelectedAge(null)}
                  className={`px-2.5 py-1 text-xs font-mono transition-all ${!selectedAge ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
                >
                  Všechny věky
                </button>
                {AGE_BRACKETS.map((bracket) => (
                  <button 
                    type="button" 
                    key={bracket.key}
                    onClick={() => setSelectedAge(selectedAge === bracket.key ? null : bracket.key)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all ${selectedAge === bracket.key ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
                  >
                    {bracket.label}
                  </button>
                ))}
              </>
            )}
            {ft === "pohlavi" && (
              <>
                <button 
                  type="button" 
                  onClick={() => setSelectedGender(null)}
                  className={`px-2.5 py-1 text-xs font-mono transition-all ${!selectedGender ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
                >
                  Všichni
                </button>
                {GENDER_OPTIONS.map((opt) => (
                  <button 
                    type="button" 
                    key={opt.key}
                    onClick={() => setSelectedGender(selectedGender === opt.key ? null : opt.key)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all ${selectedGender === opt.key ? "bg-foreground text-background" : "bg-card text-muted-foreground"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Instruction bar */}
      <div className="flex flex-wrap items-center justify-center px-4 py-3 border-b border-border gap-3">
        {/* Search, controls, etc. */}
        <p className="text-xs font-mono text-muted-foreground text-center pointer-events-none hidden sm:block">
          {compareMode
            ? "Vyberte politika nebo stranu pro porovnání."
            : "Klikněte na libovolného poslance, nebo si výše vyberte stranu."}
        </p>
        <button type="button" onClick={scrollToFaq} className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border">
          FAQ
        </button>
      </div>

      {/* Chamber SVG */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-4 relative parliament-chamber-bg" onMouseMove={handleMouseMove}>
        <div ref={schematicRef} className="w-full max-w-[2200px] mx-auto" style={{ aspectRatio: "1.95 / 1" }}>
          <svg ref={svgRef} viewBox="-42 2 184 94" className="w-full h-full" aria-label="Rozložení Poslanecké sněmovny">
            {politicians.map((pol, polIndex) => {
              const seatIdx = wedgeMapping[polIndex];
              const seat = seatPositions[seatIdx];
              if (!seat) return null;

              const faded = fadedCache[polIndex];
              const isHovered = hoveredSeat === polIndex;
              const isSelected = selectedPolitician?.id === pol.id;
              const isCompareLeft = compareLeftPolId === pol.id;
              const isCompareRight = compareRightPolId === pol.id;

              return (
                <SeatCircle
                  key={pol.id}
                  pol={pol}
                  polIndex={polIndex}
                  seat={seat}
                  seatRadius={seatRadius}
                  faded={faded}
                  isHovered={isHovered}
                  isSelected={isSelected}
                  isCompareLeft={isCompareLeft}
                  isCompareRight={isCompareRight}
                  seatsRevealed={seatsRevealed}
                  onMouseEnter={handleSeatMouseEnter}
                  onMouseLeave={handleSeatMouseLeave}
                  onClick={handleSeatClick}
		  getColor={getColor}
                />
              );
            })}
          </svg>
        </div>

        {/* Selection/compare controls */}
        <div className="flex items-center justify-center gap-3 py-3" style={{ minHeight: "44px" }}>
          {hasAnySelection && !compareMode && (
            <button 
              type="button" 
              onClick={clearAll}
              className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground transition-all bg-transparent"
            >
              Zrušit výběr
            </button>
          )}
          {compareMode && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                {compareRight ? "Porovnání aktivní" : compareLeft?.type === "politician" ? "Klikněte na politika k porovnání" : "Klikněte na stranu k porovnání"}
              </span>
              <button 
                type="button" 
                onClick={exitCompare} 
                className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider border border-primary/40 text-primary hover:bg-primary"
              >
                Zrušit porovnání
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredSeat !== null && politicians[hoveredSeat] && (
        <div style={getTooltipStyle()}>
          {(() => {
            const pol = politicians[hoveredSeat];
            const sc = pol.score >= 1200 ? "#22c55e" : pol.score >= 900 ? "#eab308" : "#ef4444";
            return (
              <div className="bg-card border border-border px-4 py-3 shadow-2xl min-w-[240px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 flex-shrink-0 bg-secondary" style={{ borderColor: getColor(pol.party) }}>
                    <img src={pol.imageUrl || "/placeholder.svg"} alt="" className="w-full h-full object-cover"  />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{pol.name}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(pol.party) }} />
                      <span className="text-xs font-mono text-muted-foreground uppercase">{pol.party}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs font-mono text-muted-foreground">Skóre</span>
                  <span className="text-lg font-bold font-mono" style={{ color: sc }}>{pol.score}</span>
                </div>
                {pol.voteHistory.length > 0 && (() => {
                  const last = pol.voteHistory[pol.voteHistory.length - 1];
                  const chg = last.scoreChange;
                  return (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono text-muted-foreground">Změna</span>
                      <span className="text-sm font-bold font-mono" style={{ color: chg >= 0 ? "#22c55e" : "#ef4444" }}>
                        {chg >= 0 ? "+" : ""}{chg}
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      )}

      {/* Profile section */}
      {(selectedPolitician || selectedPartyProfile || profileClosing) && (
        <div
          ref={profileRef}
          className="border-t border-border overflow-hidden"
          style={{
            opacity: profileVisible ? 1 : 0,
            maxHeight: profileVisible ? "5000px" : "0px",
            transition: profileClosing
              ? "opacity 0.4s ease, max-height 0.6s ease 0.2s"
              : "opacity 0.5s ease 0.1s, max-height 0.8s ease",
          }}
        >
          {selectedPolitician ? (
            <PoliticianProfile
              politician={selectedPolitician}
              onClose={() => hideProfile(() => { setSelectedPolitician(null); })}
              onGoToParty={handleGoToParty}
              onCompare={(pol) => startCompare("politician", pol)}
            />
          ) : selectedPartyProfile ? (
            <>
              <PartyProfile
                party={selectedPartyProfile}
                politicians={politicians}
                onClose={() => hideProfile(() => { setSelectedPartyProfile(null); setSelectedParty(null); })}
                onSelectPolitician={handleSelectPoliticianFromParty}
                onCompare={(party) => startCompare("party", party)}
              />
              {showTwitter && (
                <div className="border-t border-border">
                  <TwitterFeed party={selectedPartyProfile} />
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Compare view */}
      {compareMode && compareLeft && (
        <div className="border-t border-border" style={{ opacity: compareFadeIn ? 1 : 0, transition: "opacity 0.4s ease" }}>
          <CompareView
            leftItem={compareLeft}
            rightItem={compareRight}
            politicians={politicians}
            onClose={exitCompare}
            onScrollToSchematic={scrollToSchematic}
          />
        </div>
      )}

      {/* FAQ */}
      <div ref={faqRef} className="border-t border-border px-6 py-10 bg-card">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-foreground mb-6 text-center font-mono uppercase tracking-wider">FAQ</h3>
          {[
            { q: "Co je Patriot Index?", a: "Patriot Index je nezávislý hodnotící systém, který sleduje hlasování poslanců Poslanecké sněmovny ČR..." },
            { q: "Jak se počítá skóre?", a: "Každý poslanec začíná s bázovým MMR skóre. Za každé hlasování se skóre mění..." },
            { q: "Jak často se data aktualizují?", a: "Data se aktualizují po každém hlasování v Poslanecké sněmovně, obvykle během několika hodin." },
          ].map((faq, i) => (
            <div key={i} className="mb-6 pb-6 border-b border-border last:border-b-0">
              <h4 className="text-sm font-bold text-foreground mb-2">{faq.q}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Law analysis */}
      {onGoToLaws && (
        <div className="border-t border-border px-6 py-8 bg-background">
          <button 
            type="button" 
            onClick={onGoToLaws}
            className="w-full max-w-3xl mx-auto flex items-center justify-center gap-3 px-6 py-4 text-sm font-mono uppercase tracking-widest border border-primary/40 text-primary hover:bg-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Rozbory zákonů
          </button>
        </div>
      )}
    </div>
  );
}
