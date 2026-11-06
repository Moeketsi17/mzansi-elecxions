import openup from "@/data/openup.json";
import { lineageOf, party, TRACKED, type PartyId } from "./parties";

export type PartyResult = {
  party: PartyId;
  votes: number;
  pct: number;
  seats: number;
};

export type AreaResult = {
  registered: number;
  cast: number;
  valid: number;
  spoilt: number;
  turnout: number | null;
  votes: Record<PartyId, number>;
};

export type Municipality = AreaResult & { code: string; name: string; province: string | null };

export type Election = {
  year: number;
  date: string;
  headline: string;
  summary: string;
  registered: number | null;
  cast: number;
  valid: number;
  turnout: number;
  turnoutNote?: string;
  results: PartyResult[];
  /** Province and municipality detail from the OpenUp dataset (2009 and 2014 only). */
  regional?: {
    national: Record<string, AreaResult>;
    provincial: Record<string, AreaResult>;
    municipalities: Municipality[];
  };
  source: string;
};

export const PROVINCES: Record<string, string> = {
  EC: "Eastern Cape",
  FS: "Free State",
  GT: "Gauteng",
  KZN: "KwaZulu-Natal",
  LIM: "Limpopo",
  MP: "Mpumalanga",
  NW: "North West",
  NC: "Northern Cape",
  WC: "Western Cape",
};

const IEC = "Electoral Commission of South Africa (IEC), official national ballot results";
const OPENUP = "OpenUpSA elections-api dataset (IEC results), national ballot";

type Row = [PartyId, number, number];

function build(valid: number, rows: Row[]): PartyResult[] {
  const listed = rows.reduce((s, [, v]) => s + v, 0);
  const results = rows.map(([p, votes, seats]) => ({
    party: p,
    votes,
    seats,
    pct: (votes / valid) * 100,
  }));
  const rest = valid - listed;
  if (rest > 0) results.push({ party: "OTHER", votes: rest, seats: 0, pct: (rest / valid) * 100 });
  return results;
}

type OpenUpYear = {
  national: {
    country: AreaResult;
    provinces: Record<string, AreaResult>;
    municipalities: Municipality[];
  };
  provincial: { provinces: Record<string, AreaResult> };
};

const data = openup as unknown as Record<string, OpenUpYear>;

function fromOpenUp(year: number, seats: Record<PartyId, number>, keep: number) {
  const y = data[String(year)];
  const c = y.national.country;
  const entries = Object.entries(c.votes);
  const rows: Row[] = entries.slice(0, keep).map(([p, v]) => [p, v, seats[p] ?? 0]);
  // Parties with seats but outside the top `keep` must still be listed.
  for (const [p, v] of entries.slice(keep)) if (seats[p]) rows.push([p, v, seats[p]]);
  return {
    registered: c.registered,
    cast: c.cast,
    valid: c.valid,
    turnout: c.turnout ?? 0,
    results: build(c.valid, rows),
    regional: {
      national: y.national.provinces,
      provincial: y.provincial.provinces,
      municipalities: y.national.municipalities,
    },
  };
}

export const ELECTIONS: Election[] = [
  {
    year: 1994,
    date: "1994-04-27",
    headline: "The first democratic election",
    summary:
      "Nearly 20 million South Africans voted across three days. The ANC won 62.6% and Nelson Mandela became president of a Government of National Unity with the NP and IFP.",
    registered: null,
    cast: 19726579,
    valid: 19533498,
    turnout: 86.87,
    turnoutNote: "No voters' roll existed in 1994; turnout is estimated against the eligible population.",
    results: build(19533498, [
      ["ANC", 12237655, 252],
      ["NP", 3983690, 82],
      ["IFP", 2058294, 43],
      ["FF", 424555, 9],
      ["DP", 338426, 7],
      ["PAC", 243478, 5],
      ["ACDP", 88104, 2],
    ]),
    source: IEC,
  },
  {
    year: 1999,
    date: "1999-06-02",
    headline: "Mbeki takes over, the DP becomes the opposition",
    summary:
      "The ANC grew to 66.4%, one seat short of two-thirds. The Democratic Party overtook the New National Party to become the official opposition.",
    registered: 18172751,
    cast: 16228462,
    valid: 15977142,
    turnout: 89.3,
    results: build(15977142, [
      ["ANC", 10601330, 266],
      ["DP", 1527337, 38],
      ["IFP", 1371477, 34],
      ["NNP", 1098215, 28],
      ["UDM", 546790, 14],
      ["ACDP", 228975, 6],
      ["FF", 127217, 3],
      ["UCDP", 125280, 3],
      ["PAC", 113125, 3],
      ["FA", 86704, 2],
      ["MF", 48277, 1],
      ["AEB", 46292, 1],
      ["AZAPO", 27257, 1],
    ]),
    source: IEC,
  },
  {
    year: 2004,
    date: "2004-04-14",
    headline: "The ANC's high-water mark",
    summary:
      "The ANC peaked at 69.7%, the highest share any party has won in democratic South Africa. The NNP collapsed to 1.7% and would dissolve into the ANC a year later.",
    registered: 20674926,
    cast: 15863558,
    valid: 15612671,
    turnout: 76.73,
    results: build(15612671, [
      ["ANC", 10880915, 279],
      ["DA", 1931201, 50],
      ["IFP", 1088664, 28],
      ["UDM", 355717, 9],
      ["ID", 269765, 7],
      ["NNP", 257824, 7],
      ["ACDP", 250272, 7],
      ["FFP", 139465, 4],
      ["UCDP", 117792, 3],
      ["PAC", 113512, 3],
      ["MF", 55267, 2],
      ["AZAPO", 39116, 1],
    ]),
    source: IEC,
  },
  {
    year: 2009,
    date: "2009-04-22",
    headline: "Zuma's ANC and the COPE breakaway",
    summary:
      "After Mbeki's recall, a breakaway formed COPE and took 7.4% at its first election. The ANC fell below two-thirds for the first time since 1999. Jacob Zuma became president.",
    ...fromOpenUp(
      2009,
      { ANC: 264, DA: 67, COPE: 30, IFP: 18, ID: 4, UDM: 4, FFP: 4, ACDP: 3, UCDP: 2, PAC: 1, MF: 1, AZAPO: 1, APC: 1 },
      8,
    ),
    source: OPENUP,
  },
  {
    year: 2014,
    date: "2014-05-07",
    headline: "The EFF arrives, Nkandla hangs over the vote",
    summary:
      "Weeks after the Public Protector's Nkandla report, the ANC slipped to 62.2%. The DA passed 22% and the newly formed EFF won 6.4% at its first election.",
    ...fromOpenUp(
      2014,
      { ANC: 249, DA: 89, EFF: 25, IFP: 10, NFP: 6, UDM: 4, FFP: 4, COPE: 3, ACDP: 3, AIC: 3, AGANG: 2, PAC: 1, APC: 1 },
      8,
    ),
    source: OPENUP,
  },
  {
    year: 2019,
    date: "2019-05-08",
    headline: "Ramaphosa's first test after state capture",
    summary:
      "The first election after Zuma's resignation. The ANC fell to 57.5%, its lowest result until then, and turnout dropped to 66%.",
    registered: 26756649,
    cast: 17672851,
    valid: 17437379,
    turnout: 66.05,
    results: build(17437379, [
      ["ANC", 10026475, 230],
      ["DA", 3622531, 84],
      ["EFF", 1882480, 44],
      ["IFP", 588839, 14],
      ["FFP", 414864, 10],
      ["ACDP", 146262, 4],
      ["UDM", 78030, 2],
      ["ATM", 76830, 2],
      ["GOOD", 70408, 2],
      ["NFP", 61220, 2],
      ["AIC", 48107, 2],
      ["COPE", 47461, 2],
      ["PAC", 32677, 1],
      ["ALJ", 31468, 1],
    ]),
    source: IEC,
  },
  {
    year: 2024,
    date: "2024-05-29",
    headline: "The ANC loses its majority",
    summary:
      "For the first time since 1994 no party won a majority. The ANC fell to 40.2%, Jacob Zuma's new MK party took 14.6%, and the ANC formed a Government of National Unity with the DA and eight other parties.",
    registered: 27782081,
    cast: 16290156,
    valid: 16076719,
    turnout: 58.64,
    results: build(16076719, [
      ["ANC", 6459683, 159],
      ["DA", 3505735, 87],
      ["MK", 2344309, 58],
      ["EFF", 1529961, 39],
      ["IFP", 618207, 17],
      ["PA", 330425, 9],
      ["FFP", 218850, 6],
      ["ASA", 192373, 6],
      ["ACDP", 96575, 3],
      ["UDM", 78448, 3],
      ["RISE", 67975, 2],
      ["BOSA", 65912, 2],
      ["ATM", 63554, 2],
      ["ALJ", 39067, 2],
      ["NCC", 37422, 2],
      ["PAC", 36716, 1],
      ["UAT", 35679, 1],
      ["GOOD", 29501, 1],
    ]),
    source: IEC,
  },
];

export const YEARS = ELECTIONS.map((e) => e.year);
export const LATEST = ELECTIONS[ELECTIONS.length - 1];

export function getElection(year: number): Election | undefined {
  return ELECTIONS.find((e) => e.year === year);
}

export function previousElection(year: number): Election | undefined {
  const i = ELECTIONS.findIndex((e) => e.year === year);
  return i > 0 ? ELECTIONS[i - 1] : undefined;
}

/** Vote share by lineage (DP counts toward DA, NP toward NNP, FF toward FF Plus). */
export function shareByLineage(e: Election): Record<PartyId, number> {
  const out: Record<PartyId, number> = {};
  for (const r of e.results) {
    const id = lineageOf(r.party);
    out[id] = (out[id] ?? 0) + r.pct;
  }
  return out;
}

export type TrendPoint = { year: number; date: string; values: Record<PartyId, number | null> };

/** One point per election for every tracked party; null where the party did not contest. */
export function trendSeries(): TrendPoint[] {
  return ELECTIONS.map((e) => {
    const s = shareByLineage(e);
    const values: Record<PartyId, number | null> = {};
    for (const id of TRACKED) values[id] = s[id] ?? null;
    return { year: e.year, date: e.date, values };
  });
}

export function seatsTotal(e: Election) {
  return e.results.reduce((s, r) => s + r.seats, 0);
}

export function winner(e: Election) {
  return e.results[0];
}

export function partyLabel(id: PartyId) {
  return party(id).short;
}
