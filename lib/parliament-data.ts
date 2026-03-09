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
  { name: "KDU-CSL", color: "#f0c800", seats: 16, shortName: "KDU", founded: 1919 },
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

// Generate semicircular seating arrangement with balanced distribution
// Each row gets seats proportional to its arc length so density is even across all rows
export function generateSeatPositions(totalSeats: number) {
  const positions: Array<{ x: number; y: number; row: number }> = [];
  const centerX = 50;
  const centerY = 95;

  const rows = 10;
  const minRadius = 15;
  const maxRadius = 90;
  const radiusStep = (maxRadius - minRadius) / (rows - 1);

  const startAngle = Math.PI * 0.04;
  const endAngle = Math.PI * 0.96;
  const angleSpan = endAngle - startAngle;

  const rowRadii: number[] = [];
  let totalArc = 0;
  for (let r = 0; r < rows; r++) {
    const radius = minRadius + r * radiusStep;
    rowRadii.push(radius);
    totalArc += radius * angleSpan;
  }

  // Proportional seat distribution by arc length
  const rawSeats: number[] = [];
  for (let r = 0; r < rows; r++) {
    rawSeats.push((rowRadii[r] * angleSpan / totalArc) * totalSeats);
  }

  // Round while keeping total correct
  const rowSeats: number[] = rawSeats.map((s) => Math.round(s));
  let diff = totalSeats - rowSeats.reduce((a, b) => a + b, 0);
  // Fix rounding errors by adding/removing from largest rows
  while (diff !== 0) {
    if (diff > 0) {
      // Add to the outer rows first (they have more space)
      for (let r = rows - 1; r >= 0 && diff > 0; r--) {
        rowSeats[r]++;
        diff--;
      }
    } else {
      // Remove from inner rows first
      for (let r = 0; r < rows && diff < 0; r++) {
        if (rowSeats[r] > 3) {
          rowSeats[r]--;
          diff++;
        }
      }
    }
  }

  // Minimum spacing: ensure no row is too tight by capping based on circumference
  let seatIndex = 0;
  for (let row = 0; row < rows && seatIndex < totalSeats; row++) {
    const radius = rowRadii[row];
    const seatsInRow = Math.min(rowSeats[row], totalSeats - seatIndex);
    if (seatsInRow <= 0) continue;
    const angleStep = angleSpan / Math.max(seatsInRow - 1, 1);

    for (let s = 0; s < seatsInRow && seatIndex < totalSeats; s++) {
      const angle = startAngle + s * angleStep;
      const x = centerX - radius * Math.cos(angle);
      const y = centerY - radius * Math.sin(angle);
      positions.push({ x, y, row });
      seatIndex++;
    }
  }

  return positions;
}

// =============================================================================
// LIVE API loader - https://api.patriotindex.cz/politicians
// =============================================================================

interface ApiPolitician {
  id: number;
  name: string;
  party: string;
  birth_date: string;
  preferencial_votes: number;
  committee: string | null;
  image_url: string | null;
}

// Map API party names to our internal short names
const API_PARTY_MAP: Record<string, string> = {
  "ANO 2011": "ANO",
  "ANO": "ANO",
  "Ob\u010dansk\u00e1 demokratick\u00e1 strana": "ODS",
  "ODS": "ODS",
  "\u010cesk\u00e1 pir\u00e1tsk\u00e1 strana": "Pirati",
  "Pir\u00e1ti": "Pirati",
  "K\u0159es\u0165ansk\u00e1 a demokratick\u00e1 unie \u2013 \u010ceskoslovensk\u00e1 strana lidov\u00e1": "KDU-CSL",
  "KDU-\u010cSL": "KDU-CSL",
  "Svoboda a p\u0159\u00edm\u00e1 demokracie \u2013 Tomio Okamura (SPD)": "SPD",
  "Svoboda a p\u0159\u00edm\u00e1 demokracie": "SPD",
  "SPD": "SPD",
  "TOP 09": "TOP 09",
  "Starostov\u00e9 a nez\u00e1visl\u00ed": "STAN",
  "STAN": "STAN",
  "Motorist\u00e9 sob\u011b": "Motoriste",
  "Motorist\u00e9": "Motoriste",
};

function findPartyByApiName(apiPartyName: string): Party | undefined {
  const shortName = API_PARTY_MAP[apiPartyName];
  if (shortName) return PARTIES.find(p => p.name === shortName || p.shortName === shortName);
  // Fuzzy fallback
  const lower = apiPartyName.toLowerCase();
  return PARTIES.find(p =>
    lower.includes(p.name.toLowerCase()) ||
    lower.includes(p.shortName.toLowerCase())
  );
}

// Clean API name: "Babiš Andrej Ing.​" -> "Andrej Babiš"
function cleanApiName(raw: string): string {
  // Remove zero-width spaces and trim
  const cleaned = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  // Remove academic titles
  const withoutTitles = cleaned
    .replace(/\b(Ing\.|Mgr\.|MUDr\.|JUDr\.|PhDr\.|RNDr\.|Doc\.|Prof\.|prof\.|Bc\.|Ph\.D\.|CSc\.|MBA|MPA|DiS\.|BBA|MSc\.|RSDr\.|PaedDr\.|MVDr\.|ThDr\.|ICDr\.)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  // API format is "Surname Firstname" -> swap to "Firstname Surname"
  const parts = withoutTitles.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts.slice(1).join(' ')} ${parts[0]}`;
  }
  return withoutTitles;
}

export async function loadFromApi(): Promise<{
  politicians: Partial<Politician>[];
} | null> {
  try {
    const res = await fetch('https://api.patriotindex.cz/politicians');
    if (!res.ok) return null;
    const data: ApiPolitician[] = await res.json();

    const politicians: Partial<Politician>[] = data.map((apiPol) => {
      const party = findPartyByApiName(apiPol.party);
      return {
        id: apiPol.id,
        name: cleanApiName(apiPol.name),
        party: party?.name || apiPol.party,
        partyColor: party?.color || '#666666',
        shortParty: party?.shortName || '?',
        birthDate: apiPol.birth_date || '',
        imageUrl: apiPol.image_url || `https://api.dicebear.com/9.x/notionists/svg?seed=pol${apiPol.id}&backgroundColor=b6e3f4`,
        committee: apiPol.committee || undefined,
      };
    });

    return { politicians };
  } catch {
    return null;
  }
}

/**
 * Merge API data into locally-generated politicians.
 * Uses real names, birth dates, photos and committees from the API,
 * but keeps generated scores & vote histories (until the API provides them).
 */
export function mergeApiData(
  generated: Politician[],
  apiData: Partial<Politician>[],
): Politician[] {
  const merged = [...generated];

  // Group API politicians by party
  const apiByParty = new Map<string, Partial<Politician>[]>();
  for (const apiPol of apiData) {
    const partyName = apiPol.party || '';
    if (!apiByParty.has(partyName)) apiByParty.set(partyName, []);
    apiByParty.get(partyName)!.push(apiPol);
  }

  // For each party, replace names/metadata in generated politicians
  for (const party of PARTIES) {
    const apiMembers = apiByParty.get(party.name) || [];
    const genMembers = merged.filter(p => p.party === party.name);
    for (let i = 0; i < Math.min(apiMembers.length, genMembers.length); i++) {
      const api = apiMembers[i];
      if (api.name) genMembers[i].name = api.name;
      if (api.birthDate) genMembers[i].birthDate = api.birthDate;
      if (api.imageUrl && api.imageUrl !== genMembers[i].imageUrl) genMembers[i].imageUrl = api.imageUrl;
      if (api.committee) genMembers[i].committee = api.committee;
      // Detect gender from Czech surname endings
      const name = genMembers[i].name;
      genMembers[i].gender = name.endsWith('ová') || name.endsWith('á') ? 'female' : 'male';
    }
  }

  return merged;
}

// =============================================================================
// CSV loaders (fallback)
// =============================================================================

export async function loadFromCSV(): Promise<{
  politicians: Politician[];
  parties: Party[];
} | null> {
  try {
    const [politiciansRes, votesRes, partiesRes] = await Promise.all([
      fetch("/data/politicians.csv"),
      fetch("/data/votes.csv"),
      fetch("/data/parties.csv"),
    ]);

    if (!politiciansRes.ok || !votesRes.ok || !partiesRes.ok) return null;

    const [politiciansText, votesText, partiesText] = await Promise.all([
      politiciansRes.text(), votesRes.text(), partiesRes.text(),
    ]);

    const partyRows = partiesText.trim().split("\n").slice(1);
    const parties: Party[] = partyRows.map((row) => {
      const cols = parseCSVRow(row);
      return { name: cols[0], shortName: cols[1], color: cols[2], seats: parseInt(cols[3], 10), founded: parseInt(cols[4], 10) };
    });

    const voteRows = votesText.trim().split("\n").slice(1);
    const voteMap = new Map<number, VoteRecord[]>();
    for (const row of voteRows) {
      const cols = parseCSVRow(row);
      const polId = parseInt(cols[0], 10);
      if (!voteMap.has(polId)) voteMap.set(polId, []);
      voteMap.get(polId)!.push({ lawName: cols[1], date: cols[2], voted: cols[3] as VoteRecord["voted"], scoreChange: parseInt(cols[4], 10) });
    }

    const polRows = politiciansText.trim().split("\n").slice(1);
    const politicians: Politician[] = polRows.map((row) => {
      const cols = parseCSVRow(row);
      const id = parseInt(cols[0], 10);
      const partyName = cols[2];
      const party = parties.find((p) => p.name === partyName);
      const votes = voteMap.get(id) || [];
      let score = 1000;
      for (const v of votes) score += v.scoreChange;
      return {
        id, name: cols[1], party: partyName, partyColor: party?.color || "#666", shortParty: party?.shortName || "?",
        score, birthDate: cols[3] || "", gender: (cols[6] === "female" ? "female" : "male") as "male" | "female",
        imageUrl: cols[5] || `https://api.dicebear.com/9.x/notionists/svg?seed=pol${id}&backgroundColor=b6e3f4`,
        voteHistory: votes,
        region: cols[7] || undefined,
      };
    });

    return { politicians, parties };
  } catch {
    return null;
  }
}

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}
