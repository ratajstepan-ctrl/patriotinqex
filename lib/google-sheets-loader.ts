// =============================================================================
// GOOGLE SHEETS INTEGRATION - Patriot Index
// =============================================================================
//
// HOW TO USE GOOGLE SHEETS FOR COLLABORATIVE SCORING:
// ---------------------------------------------------
//
// 1. Create a Google Sheet with THREE tabs (sheets):
//
//    Tab "politicians":
//    | id | name          | party | birthDate  | servingSince | imageUrl                        |
//    |----|---------------|-------|------------|-------------|---------------------------------|
//    | 1  | Andrej Babis  | ANO   | 2.9.1954   | 2013        | /images/politicians/babis.jpg   |
//    | 2  | Petr Fiala    | ODS   | 1.9.1964   | 2013        | /images/politicians/fiala.jpg   |
//
//    Tab "votes":
//    | politicianId | lawName                       | date      | voted  | scoreChange |
//    |-------------|-------------------------------|-----------|--------|-------------|
//    | 1           | Zakon o statnim rozpoctu 2025  | 15.3.2025 | pro    | +5          |
//    | 1           | Novela zakona o dani z prijmu  | 22.4.2025 | proti  | -3          |
//    | 2           | Zakon o statnim rozpoctu 2025  | 15.3.2025 | proti  | -5          |
//
//    Tab "parties":
//    | name | shortName | color   | seats | founded | leader        | description                      |
//    |------|-----------|---------|-------|---------|---------------|----------------------------------|
//    | ANO  | ANO       | #1e1250 | 72    | 2011    | Andrej Babis  | ANO 2011 je politicke hnuti...   |
//
// 2. Publish the Google Sheet:
//    - File > Share > Publish to web
//    - Choose "Entire document" and "CSV" format
//    - Click "Publish"
//
// 3. Get the sheet ID from the URL:
//    https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
//
// 4. Set the NEXT_PUBLIC_GOOGLE_SHEET_ID environment variable:
//    In the v0 sidebar > Vars, add:
//    NEXT_PUBLIC_GOOGLE_SHEET_ID = YOUR_SHEET_ID
//
// 5. The website will automatically fetch data from the sheet.
//    When you or your friends update the sheet, refresh the page to see changes.
//
// =============================================================================
//
// IMPORTANT: API QUOTA & COST MANAGEMENT
// =======================================
//
// Google Sheets "Publish to Web" CSV export is FREE and has no API key.
// It does NOT count against Google Sheets API quota.
// However, Google may rate-limit if you make too many requests per second.
//
// TO AVOID EXCESSIVE REQUESTS, this loader implements:
//
// 1. CLIENT-SIDE CACHING: Data is cached in memory for 5 minutes.
//    Users refreshing the page will get cached data, not a new fetch.
//
// 2. SERVER-SIDE CACHING (recommended): Use Next.js ISR or a server-side
//    route that caches the response. Example:
//
//    // app/api/data/route.ts
//    import { loadFromGoogleSheets } from '@/lib/google-sheets-loader';
//    import { NextResponse } from 'next/server';
//
//    export const revalidate = 300; // Cache for 5 minutes
//
//    export async function GET() {
//      const data = await loadFromGoogleSheets();
//      return NextResponse.json(data);
//    }
//
// 3. ALTERNATIVE: If you need real-time updates without any API calls,
//    export the Google Sheet data as CSV, download it, and place it in
//    /public/data/ -- then use loadFromCSV() instead.
//
// =============================================================================

import type { Politician, Party, VoteRecord } from "./parliament-data";

const SHEET_ID = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || "")
  : (process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || "");

function getSheetCSVUrl(sheetName: string) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// In-memory cache to avoid hammering Google Sheets on every page load
let cachedData: { politicians: Politician[]; parties: Party[] } | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function loadFromGoogleSheets(): Promise<{
  politicians: Politician[];
  parties: Party[];
} | null> {
  if (!SHEET_ID) {
    console.log("[v0] No NEXT_PUBLIC_GOOGLE_SHEET_ID set, skipping Google Sheets");
    return null;
  }

  // Return cached data if still fresh
  if (cachedData && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
    console.log("[v0] Returning cached Google Sheets data");
    return cachedData;
  }

  try {
    const [politiciansRes, votesRes, partiesRes] = await Promise.all([
      fetch(getSheetCSVUrl("politicians")),
      fetch(getSheetCSVUrl("votes")),
      fetch(getSheetCSVUrl("parties")),
    ]);

    if (!politiciansRes.ok || !votesRes.ok || !partiesRes.ok) {
      console.log("[v0] Failed to fetch Google Sheets data");
      return null;
    }

    const [politiciansText, votesText, partiesText] = await Promise.all([
      politiciansRes.text(),
      votesRes.text(),
      partiesRes.text(),
    ]);

    // Parse parties
    const partyRows = partiesText.trim().split("\n").slice(1);
    const parties: Party[] = partyRows.map((row) => {
      const cols = parseCSVRow(row);
      return {
        name: cols[0] || "",
        shortName: cols[1] || "",
        color: cols[2] || "#666666",
        seats: parseInt(cols[3], 10) || 0,
        founded: parseInt(cols[4], 10) || 0,

      };
    });

    // Parse votes grouped by politician
    const voteRows = votesText.trim().split("\n").slice(1);
    const voteMap = new Map<number, VoteRecord[]>();
    for (const row of voteRows) {
      const cols = parseCSVRow(row);
      const polId = parseInt(cols[0], 10);
      if (Number.isNaN(polId)) continue;
      if (!voteMap.has(polId)) voteMap.set(polId, []);
      voteMap.get(polId)!.push({
        lawName: cols[1] || "",
        date: cols[2] || "",
        voted: (cols[3] || "nehlasoval") as VoteRecord["voted"],
        scoreChange: parseInt(cols[4], 10) || 0,
      });
    }

    // Parse politicians
    const polRows = politiciansText.trim().split("\n").slice(1);
    const politicians: Politician[] = polRows.map((row) => {
      const cols = parseCSVRow(row);
      const id = parseInt(cols[0], 10);
      const partyName = cols[2] || "";
      const party = parties.find((p) => p.name === partyName);
      const votes = voteMap.get(id) || [];

      let score = 50;
      for (const v of votes) {
        score = Math.max(0, Math.min(100, score + v.scoreChange));
      }

      return {
        id,
        name: cols[1] || "",
        party: partyName,
        partyColor: party?.color || "#666666",
        shortParty: party?.shortName || "?",
        score,
        birthDate: cols[3] || "",
        imageUrl: cols[5] || `https://api.dicebear.com/9.x/notionists/svg?seed=pol${id}&backgroundColor=b6e3f4`,
        voteHistory: votes,
      };
    });

    // Cache the result
    cachedData = { politicians, parties };
    cacheTimestamp = Date.now();

    return cachedData;
  } catch (e) {
    console.log("[v0] Error loading from Google Sheets:", e);
    return null;
  }
}
