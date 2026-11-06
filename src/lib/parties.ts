export type PartyId = string;

export type Party = {
  id: PartyId;
  short: string;
  name: string;
  /** Chart colour. Only the tracked "major" parties carry a hue; everyone else is neutral. */
  color: string;
  /**
   * Lineage groups predecessors with successors for the long-run trend
   * (e.g. the Democratic Party became the Democratic Alliance in 2000).
   */
  lineage?: PartyId;
  note?: string;
};

// Categorical order is fixed (validated for CVD separation on the dark surface).
// Never re-order or cycle these; a party outside this list renders neutral.
export const TRACKED: PartyId[] = ["ANC", "DA", "EFF", "MK", "COPE", "IFP", "FFP", "NNP"];

/**
 * Parties tracked in local election trends. ActionSA takes the light neutral slot
 * (no ninth hue passes the CVD checks); it never appears alongside NNP, and every
 * chart labels it directly.
 */
export const LGE_TRACKED: PartyId[] = ["ANC", "DA", "EFF", "MK", "COPE", "IFP", "FFP", "ASA"];

export const NEUTRAL = "#5d6372";

export const PARTIES: Record<PartyId, Party> = {
  ANC: { id: "ANC", short: "ANC", name: "African National Congress", color: "#3c9a5f" },
  DA: { id: "DA", short: "DA", name: "Democratic Alliance", color: "#4a7fd0" },
  DP: {
    id: "DP",
    short: "DP",
    name: "Democratic Party",
    color: "#4a7fd0",
    lineage: "DA",
    note: "Merged into the Democratic Alliance in 2000.",
  },
  EFF: { id: "EFF", short: "EFF", name: "Economic Freedom Fighters", color: "#cc4450" },
  MK: { id: "MK", short: "MK", name: "uMkhonto weSizwe Party", color: "#a8862c" },
  COPE: { id: "COPE", short: "COPE", name: "Congress of the People", color: "#8a6cc0" },
  IFP: { id: "IFP", short: "IFP", name: "Inkatha Freedom Party", color: "#d0683a" },
  FFP: { id: "FFP", short: "FF Plus", name: "Freedom Front Plus", color: "#0f9fa6" },
  FF: {
    id: "FF",
    short: "FF",
    name: "Freedom Front",
    color: "#0f9fa6",
    lineage: "FFP",
    note: "Became the Freedom Front Plus in 2003.",
  },
  NP: {
    id: "NP",
    short: "NP",
    name: "National Party",
    color: "#8b93a3",
    lineage: "NNP",
    note: "Renamed the New National Party in 1997.",
  },
  NNP: {
    id: "NNP",
    short: "NNP",
    name: "New National Party",
    color: "#8b93a3",
    note: "Dissolved in 2005; most members joined the ANC.",
  },
  UDM: { id: "UDM", short: "UDM", name: "United Democratic Movement", color: NEUTRAL },
  ACDP: { id: "ACDP", short: "ACDP", name: "African Christian Democratic Party", color: NEUTRAL },
  ID: { id: "ID", short: "ID", name: "Independent Democrats", color: NEUTRAL },
  NFP: { id: "NFP", short: "NFP", name: "National Freedom Party", color: NEUTRAL },
  PAC: { id: "PAC", short: "PAC", name: "Pan Africanist Congress of Azania", color: NEUTRAL },
  AIC: { id: "AIC", short: "AIC", name: "African Independent Congress", color: NEUTRAL },
  AGANG: { id: "AGANG", short: "Agang", name: "Agang South Africa", color: NEUTRAL },
  UCDP: { id: "UCDP", short: "UCDP", name: "United Christian Democratic Party", color: NEUTRAL },
  MF: { id: "MF", short: "MF", name: "Minority Front", color: NEUTRAL },
  AZAPO: { id: "AZAPO", short: "AZAPO", name: "Azanian People's Organisation", color: NEUTRAL },
  APC: { id: "APC", short: "APC", name: "African People's Convention", color: NEUTRAL },
  ALJ: { id: "ALJ", short: "Al Jama-ah", name: "Al Jama-ah", color: NEUTRAL },
  PA: { id: "PA", short: "PA", name: "Patriotic Alliance", color: NEUTRAL },
  ASA: { id: "ASA", short: "ActionSA", name: "ActionSA", color: "#b4b0a4" },
  RISE: { id: "RISE", short: "Rise Mzansi", name: "Rise Mzansi", color: NEUTRAL },
  BOSA: { id: "BOSA", short: "BOSA", name: "Build One South Africa", color: NEUTRAL },
  ATM: { id: "ATM", short: "ATM", name: "African Transformation Movement", color: NEUTRAL },
  NCC: { id: "NCC", short: "NCC", name: "National Coloured Congress", color: NEUTRAL },
  UAT: { id: "UAT", short: "UAT", name: "United Africans Transformation", color: NEUTRAL },
  GOOD: { id: "GOOD", short: "GOOD", name: "GOOD", color: NEUTRAL },
  FA: { id: "FA", short: "FA", name: "Federal Alliance", color: NEUTRAL },
  AEB: { id: "AEB", short: "AEB", name: "Afrikaner Eenheidsbeweging", color: NEUTRAL },
  SACP: { id: "SACP", short: "SACP", name: "South African Communist Party", color: NEUTRAL },
  IND: { id: "IND", short: "Independents", name: "Independent candidates", color: NEUTRAL },
  OTHER: { id: "OTHER", short: "Other", name: "All other parties", color: "#3a3f4a" },
};

export function party(id: PartyId): Party {
  if (PARTIES[id]) return PARTIES[id];
  // Ids from the OpenUp extract for minor parties look like "X:Party Name".
  const name = id.startsWith("X:") ? id.slice(2) : id;
  return { id, short: name, name, color: NEUTRAL };
}

/** Like `party`, but falls back to a name supplied by the data source for unknown parties. */
export function partyOr(id: PartyId, fallbackName: string): Party {
  if (PARTIES[id]) return PARTIES[id];
  return { id, short: fallbackName, name: fallbackName, color: NEUTRAL };
}

/** The id a party is tracked under in long-run trends. */
export function lineageOf(id: PartyId): PartyId {
  return PARTIES[id]?.lineage ?? id;
}
