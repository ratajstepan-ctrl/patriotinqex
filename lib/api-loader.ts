import type { Party, Politician, VoteRecord } from "@/lib/parliament-data";

const API_BASE_URL = "/api/proxy";

type ApiParty = {
  id: number;
  name?: string;
  short_name?: string;
  shortName?: string;
  color: string;
  seats: number;
  founded?: number;
};

type ApiPolitician = {
  id: number;
  name: string;
  party_id?: number;
  party?: string;
  birth_date?: string;
  gender?: string;
  image_url?: string;
  committee?: string;
  region?: string;
};

type ApiVote = {
  id: number;
  politician_id: number;
  law_id: number;
  voted?: VoteRecord["voted"];
  score_change?: number;
  timestamp?: string;
};

export interface LawAnalysis {
  id: number;
  name: string;
  date: string;
  category: string;
  summary: string;
  analysis: string;
  status?: string;
  impact_level?: string;
}

function normalizeGender(value?: string): "Muž" | "Žena" {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("female") || normalized.includes("zena") || normalized.includes("žena")) {
    return "Žena";
  }
  return "Muž";
}

function normalizeRegion(value?: string): string {
  return (value || "").replace(/\u200B/g, "").trim();
}

function normalizeVoted(value?: string): VoteRecord["voted"] {
  const normalized = (value || "").toLowerCase().trim();
  if (normalized === "pro" || normalized === "yes" || normalized === "ano") return "pro";
  if (normalized === "proti" || normalized === "no" || normalized === "ne") return "proti";
  if (normalized === "zdrzel" || normalized === "zdržel" || normalized === "abstain") return "zdrzel";
  return "nehlasoval";
}

function parseTimestampToMillis(value?: string): number {
  if (!value) return Number.NaN;
  const trimmed = value.trim();
  const czMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (czMatch) {
    const day = Number(czMatch[1]);
    const month = Number(czMatch[2]) - 1;
    const year = Number(czMatch[3]);
    const hour = Number(czMatch[4] || 0);
    const minute = Number(czMatch[5] || 0);
    return new Date(year, month, day, hour, minute, 0, 0).getTime();
  }

  const isoMillis = new Date(trimmed).getTime();
  return Number.isNaN(isoMillis) ? Number.NaN : isoMillis;
}

function fallbackDateFromTimestamp(value?: string): string {
  if (!value) return "";
  const [datePart] = value.split(" ");
  return datePart || "";
}

function compareVotesByLawOrder(a: ApiVote, b: ApiVote, lawsById: Map<number, LawAnalysis>): number {
  const lawA = lawsById.get(a.law_id);
  const lawB = lawsById.get(b.law_id);

  const lawTimeA = parseTimestampToMillis(lawA?.date);
  const lawTimeB = parseTimestampToMillis(lawB?.date);
  if (Number.isFinite(lawTimeA) && Number.isFinite(lawTimeB) && lawTimeA !== lawTimeB) {
    return lawTimeA - lawTimeB;
  }

  if (a.law_id !== b.law_id) {
    return a.law_id - b.law_id;
  }

  const voteTimeA = parseTimestampToMillis(a.timestamp);
  const voteTimeB = parseTimestampToMillis(b.timestamp);
  if (Number.isFinite(voteTimeA) && Number.isFinite(voteTimeB) && voteTimeA !== voteTimeB) {
    return voteTimeA - voteTimeB;
  }

  return a.id - b.id;
}

async function fetchArray<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/${path}`);
    if (!res.ok) {
      console.warn(`[api-loader] ${path} failed with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn(`[api-loader] ${path} did not return an array`);
      return [];
    }

    return data as T[];
  } catch (error) {
    console.warn(`[api-loader] ${path} request failed`, error);
    return [];
  }
}

export async function fetchParties(): Promise<Party[]> {
  const raw = await fetchArray<ApiParty>("parties");

  return raw.map((p) => ({
    name: p.name || p.short_name || p.shortName || "Nezařazení",
    color: p.color,
    seats: p.seats,
    shortName: p.short_name || p.shortName || p.name || "NEZ",
    founded: p.founded || 0,
  }));
}

export async function fetchPoliticians(): Promise<Politician[]> {
  const [rawPols, rawParties, rawVotes, rawLaws] = await Promise.all([
    fetchArray<ApiPolitician>("politicians"),
    fetchArray<ApiParty>("parties"),
    fetchArray<ApiVote>("votes"),
    fetchArray<LawAnalysis>("laws"),
  ]);

  const partiesById = new Map<number, ApiParty>();
  for (const party of rawParties) {
    partiesById.set(party.id, party);
  }

  const lawsById = new Map<number, LawAnalysis>();
  for (const law of rawLaws) {
    lawsById.set(law.id, law);
  }

  const votesByPolitician = new Map<number, ApiVote[]>();
  for (const vote of rawVotes) {
    if (!votesByPolitician.has(vote.politician_id)) {
      votesByPolitician.set(vote.politician_id, []);
    }
    votesByPolitician.get(vote.politician_id)!.push(vote);
  }

  for (const voteList of votesByPolitician.values()) {
    voteList.sort((a, b) => compareVotesByLawOrder(a, b, lawsById));
  }

  return rawPols.map((p) => {
    const party = p.party_id ? partiesById.get(p.party_id) : undefined;
    const partyName = party?.name || p.party || "Nezařazení";
    const partyShort = party?.short_name || party?.shortName || partyName;
    const partyColor = party?.color || "#666666";

    const voteRows = votesByPolitician.get(p.id) || [];

    const voteHistory: VoteRecord[] = voteRows.map((vote, index) => {
      const law = lawsById.get(vote.law_id);
      const previousAbsoluteScore = index > 0 ? voteRows[index - 1].score_change : 1000;
      const currentAbsoluteScore = vote.score_change ?? previousAbsoluteScore;

      return {
        lawName: law?.name || `Zákon #${vote.law_id}`,
        date: law?.date || fallbackDateFromTimestamp(vote.timestamp),
        voted: normalizeVoted(vote.voted),
        // Stored vote score_change is absolute score, convert to delta for timeline usage.
        scoreChange: currentAbsoluteScore - previousAbsoluteScore,
      };
    });

    const latestScore = voteRows.length > 0
      ? voteRows[voteRows.length - 1].score_change ?? 1000
      : 1000;

    return {
      id: p.id,
      name: p.name,
      party: partyName,
      shortParty: partyShort,
      partyColor,
      score: latestScore,
      birthDate: p.birth_date || "",
      gender: normalizeGender(p.gender),
      imageUrl: p.image_url || `https://api.dicebear.com/9.x/notionists/svg?seed=pol${p.id}&backgroundColor=b6e3f4`,
      voteHistory,
      committee: p.committee || "",
      region: normalizeRegion(p.region),
    } as Politician;
  });
}

export async function fetchLaws(): Promise<LawAnalysis[]> {
  const laws = await fetchArray<LawAnalysis>("laws");
  return [...laws].sort((a, b) => {
    const ta = parseTimestampToMillis(a.date);
    const tb = parseTimestampToMillis(b.date);
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) {
      return ta - tb;
    }
    return a.id - b.id;
  });
}
