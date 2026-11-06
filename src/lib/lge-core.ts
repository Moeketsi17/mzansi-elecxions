/**
 * Local government election (LGE) data from the IEC's public results dashboard
 * (results.elections.org.za/dashboards/lge). The dashboard publishes one JSON file
 * per level (national, province, municipality) per election, and rewrites the
 * current election's files throughout the count. No API key is needed.
 *
 * This module is plain TypeScript with no path aliases, so it runs both inside
 * Next.js and under `node scripts/fetch-lge.ts`.
 */

export const LGE_BASE = "https://results.elections.org.za/dashboards/lge/MapsJason";

/** IEC electoral event ids, from the dashboard's own configuration. */
export const LGE_EVENTS: Record<number, number> = {
  2000: 2,
  2006: 95,
  2011: 197,
  2016: 402,
  2021: 1091,
  2026: 1887,
};

export const LGE_YEARS = Object.keys(LGE_EVENTS).map(Number);
export const CURRENT_LGE = Math.max(...LGE_YEARS);

export const LGE_DATES: Record<number, string> = {
  2000: "2000-12-05",
  2006: "2006-03-01",
  2011: "2011-05-18",
  2016: "2016-08-03",
  2021: "2021-11-01",
  2026: "2026-11-04",
};

export const PROVINCE_IDS: Record<number, { code: string; name: string }> = {
  1: { code: "EC", name: "Eastern Cape" },
  2: { code: "FS", name: "Free State" },
  3: { code: "GT", name: "Gauteng" },
  4: { code: "KZN", name: "KwaZulu-Natal" },
  5: { code: "MP", name: "Mpumalanga" },
  6: { code: "NC", name: "Northern Cape" },
  7: { code: "LIM", name: "Limpopo" },
  8: { code: "NW", name: "North West" },
  9: { code: "WC", name: "Western Cape" },
};

export function lgeUrl(year: number, file: "national" | { province: number } | { municipality: number }) {
  const ee = `EEID${LGE_EVENTS[year]}`;
  const name =
    file === "national"
      ? `${ee}LiteMapsNational`
      : "province" in file
        ? `${ee}Province${file.province}`
        : `${ee}Munic${file.municipality}`;
  return `${LGE_BASE}/${year}/${name}.js`;
}

// ---------- raw shapes (only the fields we use) ----------

export type RawParty = {
  ID: number;
  Name?: string;
  TotalValidVotes: number;
  PercOfVotes: number;
  WardSeatsWon: number;
  PRSeatsWon: number;
  TotalSeatsWon: number;
  AvailableSeats: number;
  CouncilsWon: number;
  MajorityWon: number;
  IsCouncilWinner: boolean;
  RegisteredVoters: number;
  TotalVotesCast: number;
  ValidVotesCast: number;
  SpoiltVotes: number;
};

type RawProgress = {
  ReportDate: string;
  MunicExpected: number;
  WardExpected: number;
  VDExpected: number;
  SeatsExpected: number;
  MuncipalitiesComplete: number;
  WardsComplete: number;
  VDsComplete: number;
  SeatsComplete: number;
  HungCouncils: number;
  MajorityCouncils: number;
  TotalDrawnCouncils: number;
  RegPop: number;
  PartyBallotResults: RawParty[];
};

export type RawWard = { WardID: number; PartyBallotResults: (RawParty & { CandidateName?: string })[] };
export type RawMunicipality = RawProgress & {
  MunicipalityID: number;
  Municipality: string;
  ProvinceID: number;
  WardResults?: RawWard[];
};
export type RawProvince = RawProgress & { ProvinceID: number; Province: string; MunicipalityResults: RawMunicipality[] };
export type RawNational = RawProgress & { ElectoralEventID: number; ProvinceResults: RawProvince[] };

// ---------- normalised shapes ----------

export type LgePartyResult = {
  id: string;
  name: string;
  pct: number;
  votes: number;
  seats: number;
  wardSeats: number;
  prSeats: number;
  councilsWon?: number;
  majorityWon?: number;
};

export type Progress = { done: number; total: number };

export type LgeArea = {
  reportDate: string;
  registered: number;
  ballots: number;
  spoilt: number;
  seatsTotal: number;
  progress: { districts: Progress; wards: Progress; councils: Progress; seats: Progress };
  councils: { majority: number; hung: number; drawn: number };
  parties: LgePartyResult[];
};

export type CouncilStatus = "majority" | "hung" | "counting";

export type LgeMunicipality = {
  id: number;
  code: string;
  name: string;
  provinceId: number;
  registered: number;
  seatsTotal: number;
  districtsPct: number;
  status: CouncilStatus;
  /** Leading parties, best first (top 3 where the IEC publishes them). */
  top: { id: string; name: string; pct: number; seats: number }[];
};

export type LgeYear = LgeArea & {
  year: number;
  eventId: number;
  complete: boolean;
  provinces: (LgeArea & { id: number; code: string; name: string })[];
  municipalities: LgeMunicipality[];
};

export type LgeResult = {
  data: LgeYear;
  /** "iec" when fetched from the live feed, "snapshot" when served from the bundled copy. */
  source: "iec" | "snapshot";
  /** True when this is the current election and the live feed could not be reached. */
  stale: boolean;
};

// ---------- party identity ----------

const NAME_TO_ID: [RegExp, string][] = [
  [/^AFRICAN NATIONAL CONGRESS$/, "ANC"],
  [/^DEMOCRATIC ALLIANCE/, "DA"],
  [/^ECONOMIC FREEDOM FIGHTERS$/, "EFF"],
  [/^UMKHONTO WESIZWE/, "MK"],
  [/^INKATHA FREEDOM PARTY$/, "IFP"],
  [/VRYHEIDSFRONT|FREEDOM FRONT/, "FFP"],
  [/^CONGRESS OF THE PEOPLE$/, "COPE"],
  [/^PATRIOTIC ALLIANCE$/, "PA"],
  [/^ACTIONSA$/, "ASA"],
  [/^UNITED DEMOCRATIC MOVEMENT$/, "UDM"],
  [/^AFRICAN CHRISTIAN DEMOCRATIC PARTY$/, "ACDP"],
  [/^NATIONAL FREEDOM PARTY$/, "NFP"],
  [/^PAN AFRICANIST CONGRESS/, "PAC"],
  [/^AFRICAN TRANSFORMATION MOVEMENT$/, "ATM"],
  [/^AFRICAN INDEPENDENT CONGRESS$/, "AIC"],
  [/^INDEPENDENT DEMOCRATS$/, "ID"],
  [/^UNITED CHRISTIAN DEMOCRATIC PARTY$/, "UCDP"],
  [/^AL JAMA-AH$/, "ALJ"],
  [/^GOOD$/, "GOOD"],
  [/^SOUTH AFRICAN COMMUNIST PARTY$/, "SACP"],
  [/^MINORITY FRONT$/, "MF"],
  [/^AZANIAN PEOPLE'?S ORGANISATION$/, "AZAPO"],
  [/^INDEPENDENTS?$|^IND$/, "IND"],
  [/^OTHER$/, "OTHER"],
];

export function partyIdFromName(name: string, iecId: number): string {
  const n = name.replace(/\s+/g, " ").trim().toUpperCase();
  for (const [re, id] of NAME_TO_ID) if (re.test(n)) return id;
  return `IEC:${iecId}`;
}

export function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bOf\b/g, "of")
    .replace(/\bThe\b/g, "the")
    .replace(/\bAnd\b/g, "and");
}

type NameLookup = (iecId: number) => string | undefined;

function parties(raw: RawParty[], names: NameLookup, withCouncils: boolean): LgePartyResult[] {
  return raw
    .map((p) => {
      const full = p.Name ?? names(p.ID) ?? `Party ${p.ID}`;
      const id = partyIdFromName(full, p.ID);
      const r: LgePartyResult = {
        id,
        name: id === "OTHER" ? "Other parties" : id === "IND" ? "Independents" : titleCase(full),
        pct: p.PercOfVotes,
        votes: p.TotalValidVotes,
        seats: p.TotalSeatsWon,
        wardSeats: p.WardSeatsWon,
        prSeats: p.PRSeatsWon,
      };
      if (withCouncils) {
        r.councilsWon = p.CouncilsWon;
        r.majorityWon = p.MajorityWon;
      }
      return r;
    })
    .sort((a, b) => (a.id === "OTHER" ? 1 : b.id === "OTHER" ? -1 : b.pct - a.pct));
}

function area(raw: RawProgress, names: NameLookup, withCouncils = false): LgeArea {
  const first = raw.PartyBallotResults[0];
  return {
    reportDate: raw.ReportDate,
    registered: raw.RegPop || first?.RegisteredVoters || 0,
    ballots: first?.TotalVotesCast ?? 0,
    spoilt: first?.SpoiltVotes ?? 0,
    seatsTotal: raw.SeatsExpected,
    progress: {
      districts: { done: raw.VDsComplete, total: raw.VDExpected },
      wards: { done: raw.WardsComplete, total: raw.WardExpected },
      councils: { done: raw.MuncipalitiesComplete, total: raw.MunicExpected },
      seats: { done: raw.SeatsComplete, total: raw.SeatsExpected },
    },
    councils: { majority: raw.MajorityCouncils, hung: raw.HungCouncils, drawn: raw.TotalDrawnCouncils },
    parties: parties(raw.PartyBallotResults, names, withCouncils),
  };
}

export function splitMunicipalityName(label: string) {
  const [left, ...rest] = label.trim().split(" - ");
  if (!rest.length) return { code: "", name: left };
  const name = rest.join(" - ");
  // "NMA - Nelson Mandela Bay", "NC01B1 - Gammagara"; 2000 also has "Cape Town - City of Cape Town".
  return /^[A-Z]{2,4}\d{0,3}[A-Za-z]?\d?$/.test(left) ? { code: left, name } : { code: "", name };
}

function municipality(raw: RawMunicipality, names: NameLookup): LgeMunicipality {
  const { code, name } = splitMunicipalityName(raw.Municipality);
  const done = raw.MuncipalitiesComplete >= 1 || raw.SeatsComplete >= raw.SeatsExpected;
  const status: CouncilStatus = !done ? "counting" : raw.MajorityCouncils > 0 ? "majority" : "hung";
  return {
    id: raw.MunicipalityID,
    code,
    name,
    provinceId: raw.ProvinceID,
    registered: raw.RegPop,
    seatsTotal: raw.SeatsExpected,
    districtsPct: raw.VDExpected ? (raw.VDsComplete / raw.VDExpected) * 100 : 0,
    status,
    top: parties(raw.PartyBallotResults, names, false)
      .filter((p) => p.id !== "OTHER")
      .slice(0, 3)
      .map((p) => ({ id: p.id, name: p.name, pct: p.pct, seats: p.seats })),
  };
}

/**
 * Build a year from the national file plus (optionally) the nine province files.
 * Province files carry each municipality's top three parties and the province's
 * full party list; without them we fall back to the national file's leaders only.
 */
export function buildYear(
  year: number,
  national: RawNational,
  provinceFiles: RawProvince[] = [],
  names: NameLookup = () => undefined,
): LgeYear {
  const byProvince = new Map(provinceFiles.map((p) => [p.ProvinceID, p]));
  const provinces = national.ProvinceResults.map((p) => {
    const detail = byProvince.get(p.ProvinceID) ?? p;
    const info = PROVINCE_IDS[p.ProvinceID] ?? { code: String(p.ProvinceID), name: p.Province };
    return { id: p.ProvinceID, code: info.code, name: info.name, ...area(detail, names) };
  });
  const municipalities = national.ProvinceResults.flatMap((p) =>
    (byProvince.get(p.ProvinceID) ?? p).MunicipalityResults.map((m) => municipality({ ...m, ProvinceID: p.ProvinceID }, names)),
  ).sort((a, b) => b.registered - a.registered);

  const nat = area(national, names, true);
  return {
    year,
    eventId: LGE_EVENTS[year],
    complete: nat.progress.councils.done >= nat.progress.councils.total && nat.progress.councils.total > 0,
    ...nat,
    provinces,
    municipalities,
  };
}

export type LgeMunicipalityDetail = LgeArea & {
  id: number;
  code: string;
  name: string;
  provinceId: number;
  status: CouncilStatus;
  wards: { id: number; number: number; party: string | null; partyName: string | null; candidate: string | null; pct: number | null }[];
};

export function buildMunicipalityDetail(raw: RawMunicipality, names: NameLookup = () => undefined): LgeMunicipalityDetail {
  const base = municipality(raw, names);
  return {
    ...area(raw, names),
    id: base.id,
    code: base.code,
    name: base.name,
    provinceId: raw.ProvinceID,
    status: base.status,
    wards: (raw.WardResults ?? [])
      .map((w) => {
        const sorted = [...(w.PartyBallotResults ?? [])].sort((a, b) => b.PercOfVotes - a.PercOfVotes);
        const lead = sorted.find((p) => p.ID !== -2);
        const full = lead ? (lead.Name ?? names(lead.ID) ?? `Party ${lead.ID}`) : null;
        const id = lead && full ? partyIdFromName(full, lead.ID) : null;
        return {
          id: w.WardID,
          number: w.WardID % 1000,
          party: lead && lead.TotalValidVotes > 0 ? id : null,
          partyName: lead && lead.TotalValidVotes > 0 && full ? titleCase(full) : null,
          candidate: lead?.CandidateName ? titleCase(lead.CandidateName) : null,
          pct: lead && lead.TotalValidVotes > 0 ? lead.PercOfVotes : null,
        };
      })
      .sort((a, b) => a.id - b.id),
  };
}
