'use client';

// =============================================================================
// PARLIAMENT DATA - Patriot Index
// =============================================================================
// See comments at bottom for CSV / Google Sheets / PSP.CZ data loading

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface VoteRecord {
  lawName: string;
  date: string;
  voted: "pro" | "proti" | "zdrzel" | "nehlasoval";
  scoreChange: number;
}

export interface Politician {
  id: number;
  name: string;
  party: string;
  partyColor: string;
  shortParty: string;
  score: number;
  birthDate: string;
  gender: "male" | "female";
  imageUrl: string;
  voteHistory: VoteRecord[];
  committee?: string;
  region?: string;
}

export interface Party {
  name: string;
  color: string;
  seats: number;
  shortName: string;
  founded: number;
}


// Helper: compute age from birth date (podporuje YYYY, DD.MM.YYYY, YYYY-MM-DD)
export function getAge(birthDate: string | number | undefined): number {
  if (!birthDate) return 0;

  const str = String(birthDate).trim().replace(/\u200b/g, "");

  let birth: Date;

  if (/^\d{4}$/.test(str)) {
    // Pouze rok (nejčastější případ z API)
    birth = new Date(parseInt(str, 10), 0, 1);
  } else if (str.includes(".")) {
    // DD.MM.YYYY
    const parts = str.split(".");
    if (parts.length >= 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      birth = new Date(y, m, d);
    } else {
      return 0;
    }
  } else {
    // YYYY-MM-DD nebo cokoli jiného
    birth = new Date(str);
  }

  if (isNaN(birth.getTime())) return 0;

  // === CHYBĚJÍCÍ ČÁST – výpočet věku ===
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();

  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

// Order determines wedge placement: left-to-right in the semicircle
export const PARTIES: Party[] = [
  { name: "SPD", color: "#1a4d8f", seats: 15, shortName: "SPD", founded: 2015 },
  { name: "Motoriste", color: "#e67e22", seats: 13, shortName: "MOT", founded: 2021 },
  { name: "ANO", color: "#1e1250", seats: 80, shortName: "ANO", founded: 2011 },
  { name: "ODS", color: "#004494", seats: 27, shortName: "ODS", founded: 1991 },
  { name: "KDU-CSL", color: "#f0c800", seats: 16, shortName: "KDU-ČSL", founded: 1919 },
  { name: "TOP 09", color: "#672f90", seats: 9, shortName: "TOP09", founded: 2009 },
  { name: "STAN", color: "#00703c", seats: 22, shortName: "STAN", founded: 2004 },
  { name: "Pirati", color: "#5a6577", seats: 18, shortName: "PIR", founded: 2009 },
];

const REGIONS = [
  "Praha", "Středočeský kraj", "Jihočeský kraj", "Plzeňský kraj",
  "Karlovarský kraj", "Ústecký kraj", "Liberecký kraj", "Královéhradecký kraj",
  "Pardubický kraj", "Kraj Vysočina", "Jihomoravský kraj", "Olomoucký kraj",
  "Zlínský kraj", "Moravskoslezský kraj",
];

const COMMITTEES = [
  "V\u00fdbor pro obranu", "Rozpo\u010dtov\u00fd v\u00fdbor", "\u00dastavn\u011b pr\u00e1vn\u00ed v\u00fdbor",
  "V\u00fdbor pro zdravotnictv\u00ed", "Zahrani\u010dn\u00ed v\u00fdbor", "V\u00fdbor pro \u017eivotn\u00ed prost\u0159ed\u00ed",
  "Hospod\u00e1\u0159sk\u00fd v\u00fdbor", "V\u00fdbor pro bezpe\u010dnost", "V\u00fdbor pro soci\u00e1ln\u00ed politiku",
  "V\u00fdbor pro v\u011bdu a vzd\u011bl\u00e1v\u00e1n\u00ed", "Peti\u010dn\u00ed v\u00fdbor", "Mand\u00e1tov\u00fd a imunitn\u00ed v\u00fdbor",
  "V\u00fdbor pro ve\u0159ejnou spr\u00e1vu", "V\u00fdbor pro evropsk\u00e9 z\u00e1le\u017eitosti", "Volebn\u00ed v\u00fdbor",
];

const FIRST_NAMES = [
  "Jan","Petr","Martin","Tom\u00e1\u0161","Pavel","Ji\u0159\u00ed","Miroslav","Jaroslav","Josef",
  "Karel","V\u00e1clav","Milan","Franti\u0161ek","Luk\u00e1\u0161","David","Jakub","Roman","Michal",
  "Ond\u0159ej","Radek","Eva","Jana","Marie","Lenka","Kate\u0159ina","Lucie","Petra",
  "Mark\u00e9ta","Barbora","Tereza","Veronika","Alena","Hana","Ivana","Monika",
  "Zuzana","Dana","Kl\u00e1ra","Michaela","\u0160imona",
];

const LAST_NAMES = [
  "Nov\u00e1k","Svoboda","Novotn\u00fd","Dvo\u0159\u00e1k","\u010cern\u00fd","Proch\u00e1zka","Ku\u010dera","Vesel\u00fd",
  "Hor\u00e1k","N\u011bmec","Marek","Posp\u00ed\u0161il","H\u00e1jek","Jel\u00ednek","Kr\u00e1l","R\u016f\u017ei\u010dka",
  "Bene\u0161","Fiala","Sedl\u00e1\u010dek","Kol\u00e1\u0159","Nov\u00e1kov\u00e1","Svobodov\u00e1","\u010cern\u00e1","Vesel\u00e1",
  "Proch\u00e1zkov\u00e1","Ku\u010derov\u00e1","Hor\u00e1kov\u00e1","N\u011bmcov\u00e1","Kr\u00e1lov\u00e1","Jel\u00ednkov\u00e1",
  "Bene\u0161ov\u00e1","Fialov\u00e1","Sedl\u00e1\u010dkov\u00e1","Kol\u00e1\u0159ov\u00e1","Markov\u00e1","R\u016f\u017ei\u010dkov\u00e1",
  "Dvo\u0159\u00e1kov\u00e1","H\u00e1j\u010dov\u00e1","Posp\u00ed\u0161ilov\u00e1","Mare\u0161ov\u00e1",
];

export const LAW_NAMES = [
  "Z\u00e1kon o st\u00e1tn\u00edm rozpo\u010dtu 2025",
  "Novela z\u00e1kona o dani z p\u0159\u00edjmu",
  "Z\u00e1kon o kybernetick\u00e9 bezpe\u010dnosti",
  "D\u016fchodov\u00e1 reforma",
  "Novela stavebn\u00edho z\u00e1kona",
  "Z\u00e1kon o zahrani\u010dn\u00ed slu\u017eb\u011b",
  "Energetick\u00fd z\u00e1kon",
  "Z\u00e1kon o ochran\u011b hranic",
  "Novela brann\u00e9ho z\u00e1kona",
  "Z\u00e1kon o ve\u0159ejn\u00fdch zak\u00e1zk\u00e1ch",
  "Z\u00e1kon o soci\u00e1ln\u00edch slu\u017eb\u00e1ch",
  "Novela trestn\u00edho z\u00e1kon\u00edku",
  "Z\u00e1kon o digitalizaci st\u00e1tu",
  "Z\u00e1kon o n\u00e1rodn\u00ed bezpe\u010dnosti",
  "Z\u00e1kon o ochran\u011b soukrom\u00ed",
];

const VOTE_OPTIONS: VoteRecord["voted"][] = ["pro", "proti", "zdrzel", "nehlasoval"];

// MMR-style scoring: no cap, starts around 1000-1500, can go negative
function generateVoteHistory(rng: () => number, startScore: number): VoteRecord[] {
  const history: VoteRecord[] = [];

  for (let i = 0; i < LAW_NAMES.length; i++) {
    const voted = VOTE_OPTIONS[Math.floor(rng() * 4)];
    let scoreChange = 0;
    if (voted === "pro") scoreChange = Math.floor(rng() * 40) + 5;
    else if (voted === "proti") scoreChange = -(Math.floor(rng() * 40) + 5);
    else if (voted === "zdrzel") scoreChange = Math.floor(rng() * 15) - 7;
    // nehlasoval = 0 change

    history.push({
      lawName: LAW_NAMES[i],
      date: `${Math.floor(rng() * 28) + 1}.${Math.floor(rng() * 12) + 1}.2024`,
      voted,
      scoreChange,
    });
  }

  return history;
}

export function generatePoliticians(): Politician[] {
  const rng = seededRandom(42);
  const politicians: Politician[] = [];

  let id = 0;
  for (const party of PARTIES) {
    for (let s = 0; s < party.seats; s++) {
      const firstName = FIRST_NAMES[id % FIRST_NAMES.length];
      const lastName = LAST_NAMES[id % LAST_NAMES.length];
      // Determine gender from first name - Czech female first names end in 'a'
      const femaleNames = ["Eva","Jana","Marie","Lenka","Kate\u0159ina","Lucie","Petra","Mark\u00e9ta","Barbora","Tereza","Veronika","Alena","Hana","Ivana","Monika","Zuzana","Dana","Kl\u00e1ra","Michaela","\u0160imona"];
      const gender: "male" | "female" = femaleNames.includes(firstName) ? "female" : "male";
      // MMR-style: start between 800-1600, no cap
      const baseScore = 800 + Math.floor(rng() * 800);
      const birthYear = 1955 + Math.floor(rng() * 40);
      const birthMonth = Math.floor(rng() * 12) + 1;
      const birthDay = Math.floor(rng() * 28) + 1;

      const voteHistory = generateVoteHistory(seededRandom(id * 137 + 7), baseScore);
      // Compute final score from base + all vote changes
      let finalScore = baseScore;
      for (const v of voteHistory) {
        finalScore += v.scoreChange;
      }

      politicians.push({
        id,
        name: `${firstName} ${lastName}`,
        party: party.name,
        partyColor: party.color,
        shortParty: party.shortName,
        score: finalScore,
        birthDate: `${birthDay}.${birthMonth}.${birthYear}`,
        gender,
        imageUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=pol${id}&backgroundColor=b6e3f4`,
        voteHistory,
        committee: COMMITTEES[Math.floor(rng() * COMMITTEES.length)],
        region: REGIONS[Math.floor(rng() * REGIONS.length)],
      });
      id++;
    }
  }
  return politicians;
}

/**
 * EU Parliament hemicycle - clean, symmetrical layout.
 * 
 * Exactly 200 seats across 9 rows, distributed proportionally to arc length.
 * Inner rows have enough seats so every party (even small ones) appears
 * without gaps when a global angle-sort is used for seat assignment.
 */
// Cache seat positions by totalSeats to avoid recomputing on every render
const _seatPositionsCache = new Map<number, Array<{ x: number; y: number; row: number }>>();

export function generateSeatPositions(_totalSeats: number) {
  if (_seatPositionsCache.has(_totalSeats)) {
    return _seatPositionsCache.get(_totalSeats)!;
  }

  const positions: Array<{ x: number; y: number; row: number }> = [];
  const centerX = 50;
  const centerY = 95;

  // 9 rows with monotonically increasing seat counts proportional to arc length.
  // Row sizes scale with circumference; the larger inner radius ensures all 8
  // parties receive ≥1 seat per row (after row 0) when the global sort is used.
  // 13 + 16 + 18 + 20 + 22 + 25 + 27 + 29 + 30 = 200
  const seatsPerRow = [13, 16, 18, 20, 22, 25, 27, 29, 30];
  const rows = seatsPerRow.length;

  // Larger inner radius (32) allows 13 seats in the innermost ring with
  // comfortable spacing; row gap of 7 spreads rows for visual breathing room.
  const innerRadius = 32;
  const rowGap = 7;

  // Angular span - symmetrical semicircle
  const startAngle = Math.PI * 0.05;
  const endAngle = Math.PI * 0.95;
  const angleSpan = endAngle - startAngle;

  // Generate all seat positions row by row
  for (let r = 0; r < rows; r++) {
    const count = seatsPerRow[r];
    const radius = innerRadius + r * rowGap;

    for (let s = 0; s < count; s++) {
      // Even distribution along the arc
      const t = count > 1 ? s / (count - 1) : 0.5;
      const angle = startAngle + t * angleSpan;

      const x = centerX - radius * Math.cos(angle);
      const y = centerY - radius * Math.sin(angle);
      positions.push({ x, y, row: r });
    }
  }

  _seatPositionsCache.set(_totalSeats, positions);
  return positions;
}

/**
 * Maps politicians to seats ensuring:
 * 1. Each party forms a contiguous wedge (no splits)
 * 2. Each party has at least 1 seat in the innermost row
 * 3. Parties are arranged left-to-right in order
 */
export function createPartyWedgeMapping(
  seatPositions: Array<{ x: number; y: number; row: number }>,
  politicians: Politician[],
): number[] {
  const centerX = 50;
  const centerY = 95;
  
  // Party seats (left to right): SPD 15, Motoriste 13, ANO 80, ODS 27, KDU-CSL 16, TOP09 9, STAN 22, Pirati 18
  const partySeatCounts = [15, 13, 80, 27, 16, 9, 22, 18];
  const numParties = partySeatCounts.length;
  
  // Calculate angle for each seat and group by row
  const seatsWithMeta = seatPositions.map((seat, idx) => ({
    idx,
    angle: Math.atan2(centerY - seat.y, seat.x - centerX),
    row: seat.row,
  }));
  
  // Group seats by row
  const seatsByRow: Map<number, typeof seatsWithMeta> = new Map();
  for (const seat of seatsWithMeta) {
    if (!seatsByRow.has(seat.row)) seatsByRow.set(seat.row, []);
    seatsByRow.get(seat.row)!.push(seat);
  }
  
  // Sort each row by angle (high to low = left to right visually)
  for (const rowSeats of seatsByRow.values()) {
    rowSeats.sort((a, b) => b.angle - a.angle);
  }
  
  // Get all row numbers sorted (innermost first)
  const rowNumbers = Array.from(seatsByRow.keys()).sort((a, b) => a - b);
  const innermostRow = rowNumbers[0];
  const innermostSeats = seatsByRow.get(innermostRow)!;
  
  // STEP 1: Reserve 1 seat per party in the innermost row (8 parties, row has 10 seats)
  // Distribute these 8 reserved seats evenly across the 10 available
  const reservedInnerSeats: { partyIdx: number; seatIdx: number }[] = [];
  const innerSeatStep = innermostSeats.length / numParties;
  
  for (let p = 0; p < numParties; p++) {
    const seatPosition = Math.floor(p * innerSeatStep + innerSeatStep / 2);
    const clampedPos = Math.min(seatPosition, innermostSeats.length - 1);
    reservedInnerSeats.push({
      partyIdx: p,
      seatIdx: innermostSeats[clampedPos].idx,
    });
  }
  
  // Mark reserved seats as used
  const usedSeatIndices = new Set(reservedInnerSeats.map(r => r.seatIdx));
  
  // STEP 2: For remaining seats, sort all by angle and assign to parties in contiguous blocks
  const remainingSeats = seatsWithMeta
    .filter(s => !usedSeatIndices.has(s.idx))
    .sort((a, b) => b.angle - a.angle); // Left to right
  
  // Calculate how many additional seats each party needs (total - 1 reserved)
  const additionalNeeded = partySeatCounts.map(count => count - 1);
  
  // Assign remaining seats to parties in order
  const partyAssignments: Map<number, number[]> = new Map();
  for (let p = 0; p < numParties; p++) {
    partyAssignments.set(p, [reservedInnerSeats[p].seatIdx]);
  }
  
  let seatCursor = 0;
  for (let p = 0; p < numParties; p++) {
    const needed = additionalNeeded[p];
    const assignments = partyAssignments.get(p)!;
    
    for (let i = 0; i < needed && seatCursor < remainingSeats.length; i++) {
      assignments.push(remainingSeats[seatCursor].idx);
      seatCursor++;
    }
  }
  
  // STEP 3: Create final mapping - politician index to seat index
  // Sort each party's seats by row (inner first) then angle for nice visual flow
  const mapping: number[] = new Array(politicians.length);
  let polCursor = 0;
  
  for (let p = 0; p < numParties; p++) {
    const partySeats = partyAssignments.get(p)!;
    
    // Sort party seats: innermost row first, then by angle within each row
    const sortedPartySeats = partySeats
      .map(idx => ({ idx, ...seatsWithMeta.find(s => s.idx === idx)! }))
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return b.angle - a.angle;
      });
    
    for (const seat of sortedPartySeats) {
      if (polCursor < politicians.length) {
        mapping[polCursor] = seat.idx;
        polCursor++;
      }
    }
  }
  
  return mapping;
}

