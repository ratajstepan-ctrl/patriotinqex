// =============================================================================
// PSP.CZ GOVERNMENT DATA LOADER - Patriot Index
// =============================================================================
//
// This module fetches and parses data from the Czech Parliament's open data:
// https://www.psp.cz/sqw/hp.sqw?k=1300
//
// HOW TO ENABLE:
// --------------
// 1. Download the following ZIP files from psp.cz:
//    - https://www.psp.cz/sqw/hp.sqw?k=1302  (poslanci - osoby, organy, zarazeni)
//    - https://www.psp.cz/sqw/hp.sqw?k=1303  (hlasovani - per election period)
//
// 2. Extract the ZIPs and convert the relevant .unl files to JSON using
//    the convert script below, then place the JSON files in /public/data/psp/
//
// 3. Set NEXT_PUBLIC_USE_PSP_DATA=true in your environment variables
//    (Vars section in the v0 sidebar)
//
// PSP DATA FORMAT:
// ----------------
// The .unl files are pipe-separated values with windows-1250 encoding.
// Key files:
//   osoby.unl:     id_osoba|pred|prijmeni|jmeno|za|narozeni|pohlavi|zmena|umrti
//   zarazeni.unl:  id_osoba|id_of|cl_funkce|od_f|do_f|od_o|do_o
//   organy.unl:    id_organ|organ_id_organ|nazev_organu_cz|...
//   hl_poslanec.unl: id_poslanec|id_hlasovani|vysledek
//   hl_hlasovani.unl: id_hlasovani|id_organ|schuze|cislo|bod|...datum|cas...
//
// CONVERT SCRIPT:
// ---------------
// Below is a Node.js script you can run locally to convert .unl files to JSON.
// Save it as scripts/convert-psp.mjs, adjust paths, and run with Node:
//
//   node scripts/convert-psp.mjs
//
// =============================================================================
//
// --- scripts/convert-psp.mjs (reference, copy and run locally) ---
//
// import fs from 'fs';
// import path from 'path';
// import iconv from 'iconv-lite'; // npm install iconv-lite
//
// function parseUnl(filePath, columns) {
//   const buffer = fs.readFileSync(filePath);
//   const text = iconv.decode(buffer, 'win1250');
//   return text.trim().split('\n').map(line => {
//     const vals = line.split('|');
//     const obj = {};
//     columns.forEach((col, i) => { obj[col] = vals[i]?.trim() || ''; });
//     return obj;
//   });
// }
//
// // Parse osoby.unl -> politicians basic info
// const osoby = parseUnl('./psp-data/osoby.unl', [
//   'id', 'prefix', 'surname', 'name', 'suffix', 'birthDate', 'gender', 'changed', 'death'
// ]);
// fs.writeFileSync('./public/data/psp/osoby.json', JSON.stringify(osoby, null, 2));
//
// // Parse organy.unl -> parties and committees
// const organy = parseUnl('./psp-data/organy.unl', [
//   'id', 'parentId', 'name', 'nameEn', 'shortName', 'from', 'to', 'priority', 'type'
// ]);
// fs.writeFileSync('./public/data/psp/organy.json', JSON.stringify(organy, null, 2));
//
// // Parse zarazeni.unl -> who belongs where (party, committee)
// const zarazeni = parseUnl('./psp-data/zarazeni.unl', [
//   'personId', 'orgId', 'functionCode', 'funcFrom', 'funcTo', 'memberFrom', 'memberTo'
// ]);
// fs.writeFileSync('./public/data/psp/zarazeni.json', JSON.stringify(zarazeni, null, 2));
//
// console.log('Done! JSON files written to public/data/psp/');
// --- end script ---
//
// =============================================================================

import type { Politician, Party, VoteRecord } from "./parliament-data";

interface PspOsoba {
  id: string;
  prefix: string;
  surname: string;
  name: string;
  suffix: string;
  birthDate: string;
  gender: string;
}

interface PspOrgan {
  id: string;
  parentId: string;
  name: string;
  shortName: string;
  type: string;
}

interface PspZarazeni {
  personId: string;
  orgId: string;
  functionCode: string;
  funcFrom: string;
  funcTo: string;
  memberFrom: string;
  memberTo: string;
}

const USE_PSP =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_USE_PSP_DATA === "true"
    : false;

export async function loadFromPSP(): Promise<{
  politicians: Politician[];
  parties: Party[];
  committees: Map<number, string>;
} | null> {
  if (!USE_PSP) {
    return null;
  }

  try {
    const [osobyRes, organyRes, zarazeniRes] = await Promise.all([
      fetch("/data/psp/osoby.json"),
      fetch("/data/psp/organy.json"),
      fetch("/data/psp/zarazeni.json"),
    ]);

    if (!osobyRes.ok || !organyRes.ok || !zarazeniRes.ok) {
      console.log("[v0] PSP JSON files not found in /public/data/psp/");
      return null;
    }

    const osoby: PspOsoba[] = await osobyRes.json();
    const organy: PspOrgan[] = await organyRes.json();
    const zarazeni: PspZarazeni[] = await zarazeniRes.json();

    // Build organ lookup
    const organMap = new Map<string, PspOrgan>();
    for (const org of organy) {
      organMap.set(org.id, org);
    }

    // Find party assignments (type ~"KLUB" in organ hierarchy)
    // and committee assignments (type ~"VYBOR")
    const personParty = new Map<string, string>();
    const personCommittee = new Map<string, string>();

    for (const z of zarazeni) {
      const org = organMap.get(z.orgId);
      if (!org) continue;

      // Active membership (no end date or end date in the future)
      const isActive = !z.memberTo || z.memberTo === "";

      if (isActive) {
        const orgName = org.name.toLowerCase();
        if (
          orgName.includes("klub") ||
          orgName.includes("poslaneck")
        ) {
          personParty.set(z.personId, org.name);
        }
        if (orgName.includes("vybor") || orgName.includes("komise")) {
          personCommittee.set(z.personId, org.name);
        }
      }
    }

    // Build politicians from osoby + zarazeni
    const politicians: Politician[] = [];
    const partyCount = new Map<string, number>();

    let id = 0;
    for (const osoba of osoby) {
      const partyName = personParty.get(osoba.id);
      if (!partyName) continue; // Not a current MP

      const count = (partyCount.get(partyName) || 0) + 1;
      partyCount.set(partyName, count);

      politicians.push({
        id: id++,
        name: `${osoba.name} ${osoba.surname}`,
        party: partyName,
        partyColor: "#666666", // Will be matched to PARTIES later
        shortParty: partyName.substring(0, 4).toUpperCase(),
        score: 50, // Default, will be overridden by vote data
        birthDate: osoba.birthDate || "",
        imageUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=psp${osoba.id}&backgroundColor=b6e3f4`,
        voteHistory: [],
        committee: personCommittee.get(osoba.id) || undefined,
      });
    }

    // Build parties from counts
    const parties: Party[] = [];
    for (const [name, seats] of partyCount.entries()) {
      parties.push({
        name,
        shortName: name.substring(0, 4).toUpperCase(),
        color: "#666666",
        seats,
        founded: 0,
      });
    }

    const committees = new Map<number, string>();
    for (const pol of politicians) {
      if (pol.committee) {
        committees.set(pol.id, pol.committee);
      }
    }

    return { politicians, parties, committees };
  } catch (e) {
    console.log("[v0] Error loading PSP data:", e);
    return null;
  }
}
