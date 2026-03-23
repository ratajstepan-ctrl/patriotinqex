export async function fetchPoliticians(): Promise<Politician[]> {
  const [polRes, partyRes] = await Promise.all([
    fetch('https://api.patriotindex.cz/politicians'),
    fetch('https://api.patriotindex.cz/parties')
  ]);
  const rawPols = await polRes.json();
  const rawParties = await partyRes.json();

  const partyMapping: Record<string, { short: string; color: string }> = {};
  rawParties.forEach((party: any) => {
    partyMapping[party.name] = {
      short: party.shortName,
      color: party.color
    };
  });

  return rawPols.map((p: any, index: number) => {
    const mapping = partyMapping[p.party] || { short: p.party.toUpperCase(), color: "#666666" };
    return {
      id: p.id,
      name: p.name,
      party: mapping.short,
      shortParty: mapping.short,
      imageUrl: p.image_url,
      birthDate: p.birth_date,
      gender: p.gender,
      region: p.region?.replace(/\u200B/g, "").trim(),
      score: Math.floor(Math.random() * 800) + 700, // dummy
      voteHistory: [], // zatím prázdné
    };
  });
}

export async function fetchParties(): Promise<Party[]> {
  const res = await fetch('https://api.patriotindex.cz/parties');
  const raw = await res.json();

  // ←←← UPRAVENO: přesně stejné schéma jako tvůj statický PARTIES array
  return raw.map((p: any) => ({
    name: p.shortName,
    color: p.color,
    seats: p.seats,
    shortName: p.shortName,     // z DB short_name → frontend shortName
    founded: p.founded,
  }));
}


export async function fetchLaws(): Promise<LawAnalysis[]> {
  const res = await fetch('https://api.patriotindex.cz/laws');
  return res.json();
}
