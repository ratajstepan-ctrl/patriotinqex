/**
 * CSV Data Loader for Patriot Index
 * ==================================
 *
 * HOW TO USE:
 * -----------
 * 1. Create two CSV files and place them in /public/data/:
 *    - /public/data/politicians.csv
 *    - /public/data/votes.csv
 *
 * 2. POLITICIANS CSV FORMAT (politicians.csv):
 *    -----------------------------------------
 *    The first row must be the header. Columns:
 *
 *    id,name,party,birthDate,servingSince,imageUrl
 *
 *    - id:            Unique number for each politician (1, 2, 3, ...)
 *    - name:          Full name, e.g. "Andrej Babis"
 *    - party:         Must match one of the party shortNames in parliament-data.ts
 *                     (ANO, ODS, PIR, STAN, SPD, TOP09, STA, MOT, PRI, NEZ)
 *    - birthDate:     Format "DD.MM.YYYY", e.g. "2.10.1954"
 *    - servingSince:  Year they started serving, e.g. "2013"
 *    - imageUrl:      URL to their profile picture. You can:
 *                       a) Put images in /public/images/politicians/ and use
 *                          "/images/politicians/andrej-babis.jpg"
 *                       b) Use an external URL like
 *                          "https://example.com/photo.jpg"
 *                       c) Leave empty to use auto-generated avatar
 *
 *    Example rows:
 *    id,name,party,birthDate,servingSince,imageUrl
 *    1,Andrej Babis,ANO,2.10.1954,2013,/images/politicians/babis.jpg
 *    2,Petr Fiala,ODS,1.9.1964,2013,/images/politicians/fiala.jpg
 *    3,Ivan Bartos,PIR,20.3.1980,2017,
 *
 *
 * 3. VOTES CSV FORMAT (votes.csv):
 *    ------------------------------
 *    The first row must be the header. Columns:
 *
 *    politicianId,lawName,date,voted,scoreChange
 *
 *    - politicianId:  Must match an "id" from politicians.csv
 *    - lawName:       Name of the law, e.g. "Zakon o statnim rozpoctu 2025"
 *    - date:          Format "DD.MM.YYYY", e.g. "15.3.2024"
 *    - voted:         One of: "pro", "proti", "zdrzel", "nehlasoval"
 *    - scoreChange:   Integer showing how this vote changed their score,
 *                     e.g. "5" or "-3" or "0"
 *
 *    Example rows:
 *    politicianId,lawName,date,voted,scoreChange
 *    1,Zakon o statnim rozpoctu 2025,15.1.2024,pro,5
 *    1,Novela zakona o dani z prijmu,22.2.2024,proti,-3
 *    2,Zakon o statnim rozpoctu 2025,15.1.2024,proti,-4
 *    2,Novela zakona o dani z prijmu,22.2.2024,pro,6
 *
 *
 * 4. SCORE CALCULATION:
 *    -------------------
 *    The politician's final "score" is computed from their vote history.
 *    Every politician starts at score 50. Each vote's scoreChange is added
 *    cumulatively. The final cumulative score after all votes = their score.
 *    Score is clamped between 0 and 100.
 *
 *
 * 5. PROFILE PICTURES:
 *    ------------------
 *    Option A - Local images:
 *      Place .jpg or .png files in /public/images/politicians/
 *      Reference them as "/images/politicians/filename.jpg" in the CSV
 *
 *    Option B - External URLs:
 *      Use any public URL directly in the imageUrl column
 *
 *    Option C - Auto-generated:
 *      Leave the imageUrl column empty and the system will generate
 *      a DiceBear avatar automatically based on the politician's ID
 *
 *    To swap out a profile picture later, simply update the imageUrl
 *    in the CSV or replace the file in /public/images/politicians/
 */

import {
  PARTIES,
  generatePoliticians as generateFallbackPoliticians,
  type Politician,
  type VoteRecord,
} from "./parliament-data";

function parseCSV(text: string): string[][] {
  const lines = text.trim().split("\n");
  return lines.map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
  );
}

export async function loadPoliticiansFromCSV(): Promise<Politician[] | null> {
  try {
    const [politiciansRes, votesRes] = await Promise.all([
      fetch("/data/politicians.csv"),
      fetch("/data/votes.csv"),
    ]);

    if (!politiciansRes.ok || !votesRes.ok) {
      return null; // CSV files not found, fall back to generated data
    }

    const politiciansText = await politiciansRes.text();
    const votesText = await votesRes.text();

    const politiciansRows = parseCSV(politiciansText);
    const votesRows = parseCSV(votesText);

    // Skip headers
    const politicianHeaders = politiciansRows[0];
    const voteHeaders = votesRows[0];

    if (!politicianHeaders || !voteHeaders) return null;

    // Parse politicians
    const politicians: Politician[] = [];

    for (let i = 1; i < politiciansRows.length; i++) {
      const row = politiciansRows[i];
      if (!row || row.length < 5) continue;

      const id = Number.parseInt(row[0], 10);
      const name = row[1];
      const partyShort = row[2];
      const birthDate = row[3];
      const imageUrl =
        row[5] ||
        `https://api.dicebear.com/9.x/notionists/svg?seed=pol${id}&backgroundColor=b6e3f4`;

      // Find the matching party
      const party = PARTIES.find((p) => p.shortName === partyShort);
      if (!party) continue;

      politicians.push({
        id,
        name,
        party: party.name,
        partyColor: party.color,
        shortParty: party.shortName,
        score: 50, // will be computed from votes
        birthDate,
        imageUrl,
        voteHistory: [],
      });
    }

    // Parse votes and assign to politicians
    const voteMap = new Map<number, VoteRecord[]>();
    for (let i = 1; i < votesRows.length; i++) {
      const row = votesRows[i];
      if (!row || row.length < 5) continue;

      const politicianId = Number.parseInt(row[0], 10);
      const lawName = row[1];
      const date = row[2];
      const voted = row[3] as VoteRecord["voted"];
      const scoreChange = Number.parseInt(row[4], 10);

      if (!voteMap.has(politicianId)) {
        voteMap.set(politicianId, []);
      }
      voteMap.get(politicianId)!.push({ lawName, date, voted, scoreChange });
    }

    // Assign vote histories and compute final scores
    for (const pol of politicians) {
      pol.voteHistory = voteMap.get(pol.id) || [];

      // Compute final cumulative score
      let cumScore = 50;
      for (const vote of pol.voteHistory) {
        cumScore = Math.max(0, Math.min(100, cumScore + vote.scoreChange));
      }
      pol.score = cumScore;
    }

    return politicians;
  } catch {
    return null; // Any error -> fall back to generated data
  }
}

/**
 * Use this function in your components. It tries to load from CSV first,
 * and falls back to the auto-generated mock data if CSVs aren't found.
 */
export async function getPoliticians(): Promise<Politician[]> {
  const fromCSV = await loadPoliticiansFromCSV();
  if (fromCSV && fromCSV.length > 0) {
    return fromCSV;
  }
  return generateFallbackPoliticians();
}
