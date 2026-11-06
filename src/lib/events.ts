import { ELECTIONS, previousElection, shareByLineage, type Election } from "./elections";
import type { PartyId } from "./parties";

export type Category = "corruption" | "leadership" | "economy" | "unrest" | "governance" | "election";

export const CATEGORIES: Record<Category, { label: string; description: string }> = {
  corruption: { label: "Corruption", description: "Scandals, findings and state capture" },
  leadership: { label: "Leadership", description: "Who leads the parties and the country" },
  economy: { label: "Economy", description: "Power cuts, downgrades and budgets" },
  unrest: { label: "Unrest", description: "Violence, protest and public order" },
  governance: { label: "Governance", description: "Courts, coalitions and institutions" },
  election: { label: "Election", description: "Votes that reset the board" },
};

export type NewsEvent = {
  id: string;
  date: string;
  /** Shown instead of a full date when only the month is meaningful. */
  precision?: "day" | "month";
  title: string;
  category: Category;
  summary: string;
  parties: PartyId[];
  link?: string;
};

export const EVENTS: NewsEvent[] = [
  {
    id: "first-vote",
    date: "1994-04-27",
    title: "South Africa votes as a democracy for the first time",
    category: "election",
    summary: "Queues stretched for kilometres. Nelson Mandela was inaugurated on 10 May 1994.",
    parties: ["ANC", "NP", "IFP"],
    link: "https://en.wikipedia.org/wiki/1994_South_African_general_election",
  },
  {
    id: "constitution",
    date: "1996-12-10",
    title: "Mandela signs the new Constitution into law",
    category: "governance",
    summary: "Signed at Sharpeville, it created the Constitutional Court, the Public Protector and the IEC.",
    parties: [],
    link: "https://en.wikipedia.org/wiki/Constitution_of_South_Africa",
  },
  {
    id: "arms-deal",
    date: "1999-12-01",
    precision: "month",
    title: "The government signs the Arms Deal",
    category: "corruption",
    summary:
      "A multi-billion rand weapons procurement package. Bribery allegations around it would later lead to the conviction of Schabir Shaik and charges against Jacob Zuma.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Arms_Deal",
  },
  {
    id: "zuma-fired",
    date: "2005-06-14",
    title: "Mbeki fires Zuma as deputy president",
    category: "corruption",
    summary:
      "The dismissal came after Zuma's financial adviser Schabir Shaik was convicted of corruption. It opened the factional split inside the ANC.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Schabir_Shaik",
  },
  {
    id: "polokwane",
    date: "2007-12-18",
    title: "Zuma defeats Mbeki at Polokwane",
    category: "leadership",
    summary: "Delegates at the ANC's national conference elected Jacob Zuma party president over the sitting head of state.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/52nd_National_Conference_of_the_ANC",
  },
  {
    id: "loadshedding-begins",
    date: "2008-01-01",
    precision: "month",
    title: "Rolling blackouts hit the whole country",
    category: "economy",
    summary: "Eskom could no longer meet demand. Load shedding became part of daily life for the next 15 years.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/South_African_energy_crisis",
  },
  {
    id: "xenophobia-2008",
    date: "2008-05-11",
    title: "Xenophobic attacks spread from Alexandra",
    category: "unrest",
    summary: "More than 60 people were killed and tens of thousands displaced over several weeks.",
    parties: [],
    link: "https://en.wikipedia.org/wiki/2008_South_African_riots",
  },
  {
    id: "mbeki-recalled",
    date: "2008-09-20",
    title: "The ANC recalls President Mbeki",
    category: "leadership",
    summary:
      "Kgalema Motlanthe became interim president. Mbeki loyalists led by Mosiuoa Lekota broke away and launched COPE in December.",
    parties: ["ANC", "COPE"],
    link: "https://en.wikipedia.org/wiki/Congress_of_the_People_(South_African_political_party)",
  },
  {
    id: "charges-dropped",
    date: "2009-04-06",
    title: "Prosecutors drop charges against Zuma",
    category: "corruption",
    summary: "The NPA withdrew corruption charges two weeks before the election, citing the 'spy tapes'.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Spy_tapes_saga",
  },
  {
    id: "malema-expelled",
    date: "2012-04-24",
    title: "The ANC expels Julius Malema",
    category: "leadership",
    summary: "The former Youth League leader went on to found the Economic Freedom Fighters in 2013.",
    parties: ["ANC", "EFF"],
    link: "https://en.wikipedia.org/wiki/Julius_Malema",
  },
  {
    id: "marikana",
    date: "2012-08-16",
    title: "Police kill 34 striking miners at Marikana",
    category: "unrest",
    summary: "The deadliest use of force by police since apartheid. It became a rallying point for the EFF.",
    parties: ["ANC", "EFF"],
    link: "https://en.wikipedia.org/wiki/Marikana_massacre",
  },
  {
    id: "nkandla-report",
    date: "2014-03-19",
    title: "Public Protector releases the Nkandla report",
    category: "corruption",
    summary:
      "Thuli Madonsela found Zuma unduly benefited from state-funded upgrades to his private home. The report landed seven weeks before the 2014 election.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Nkandla_homestead",
  },
  {
    id: "nenegate",
    date: "2015-12-09",
    title: "Zuma fires finance minister Nhlanhla Nene",
    category: "economy",
    summary: "The rand crashed. Nene was replaced within four days after a market and business backlash.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Nhlanhla_Nene",
  },
  {
    id: "concourt-nkandla",
    date: "2016-03-31",
    title: "Constitutional Court rules Zuma failed to uphold the Constitution",
    category: "governance",
    summary: "The court ordered Zuma to repay part of the Nkandla spending.",
    parties: ["ANC", "EFF", "DA"],
    link: "https://en.wikipedia.org/wiki/Economic_Freedom_Fighters_v_Speaker_of_the_National_Assembly",
  },
  {
    id: "lge-2016",
    date: "2016-08-03",
    title: "The ANC loses three major metros",
    category: "election",
    summary:
      "In local elections, opposition coalitions took Johannesburg, Tshwane and Nelson Mandela Bay. Coalition government arrived in the big cities.",
    parties: ["ANC", "DA", "EFF"],
    link: "https://en.wikipedia.org/wiki/2016_South_African_municipal_elections",
  },
  {
    id: "state-of-capture",
    date: "2016-11-02",
    title: "The State of Capture report is published",
    category: "corruption",
    summary: "The Public Protector detailed the Gupta family's alleged influence over cabinet appointments and state contracts.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/State_capture_in_South_Africa",
  },
  {
    id: "junk-status",
    date: "2017-04-03",
    title: "S&P cuts South Africa to junk after Gordhan is fired",
    category: "economy",
    summary: "A late-night cabinet reshuffle removed finance minister Pravin Gordhan. Ratings agencies downgraded the country.",
    parties: ["ANC"],
  },
  {
    id: "gupta-leaks",
    date: "2017-06-01",
    precision: "month",
    title: "#GuptaLeaks emails are published",
    category: "corruption",
    summary: "Thousands of leaked emails exposed how state-owned companies were allegedly looted.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Gupta_family",
  },
  {
    id: "nasrec",
    date: "2017-12-18",
    title: "Ramaphosa narrowly wins the ANC presidency",
    category: "leadership",
    summary: "He beat Nkosazana Dlamini-Zuma at the Nasrec conference on a promise to clean up the party.",
    parties: ["ANC"],
  },
  {
    id: "zuma-resigns",
    date: "2018-02-14",
    title: "Jacob Zuma resigns as president",
    category: "leadership",
    summary: "He quit under pressure from the ANC on the eve of a no-confidence vote. Cyril Ramaphosa took over the next day.",
    parties: ["ANC"],
  },
  {
    id: "zondo-hearings",
    date: "2018-08-20",
    title: "The Zondo Commission into state capture opens",
    category: "corruption",
    summary: "Four years of public testimony from ministers, executives and whistleblowers followed.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Zondo_Commission",
  },
  {
    id: "lockdown",
    date: "2020-03-26",
    title: "National COVID-19 lockdown begins",
    category: "economy",
    summary: "One of the world's strictest lockdowns. Unemployment climbed and PPE tender corruption followed.",
    parties: [],
  },
  {
    id: "july-unrest",
    date: "2021-07-09",
    title: "Unrest erupts after Zuma is jailed",
    category: "unrest",
    summary:
      "Zuma began a 15-month sentence for contempt of court. Riots and looting in KwaZulu-Natal and Gauteng left more than 350 people dead.",
    parties: ["ANC", "MK"],
    link: "https://en.wikipedia.org/wiki/2021_South_African_unrest",
  },
  {
    id: "lge-2021",
    date: "2021-11-01",
    title: "The ANC falls below 50% in local elections",
    category: "election",
    summary:
      "The ANC won 45.6% of local ballots, its first result under half in any election. Turnout was the lowest of any South African election, and 70 councils were hung.",
    parties: ["ANC", "DA", "EFF"],
    link: "https://en.wikipedia.org/wiki/2021_South_African_municipal_elections",
  },
  {
    id: "phala-phala",
    date: "2022-06-01",
    title: "Phala Phala: a complaint is laid against Ramaphosa",
    category: "corruption",
    summary: "Former spy chief Arthur Fraser alleged a cover-up of a theft of foreign currency from Ramaphosa's game farm.",
    parties: ["ANC"],
  },
  {
    id: "zondo-final",
    date: "2022-06-22",
    title: "The Zondo Commission hands over its final report",
    category: "corruption",
    summary: "It concluded that state capture had happened and named senior ANC figures.",
    parties: ["ANC"],
    link: "https://en.wikipedia.org/wiki/Zondo_Commission",
  },
  {
    id: "energy-disaster",
    date: "2023-02-09",
    title: "A national state of disaster is declared over electricity",
    category: "economy",
    summary: "2023 became the worst year of load shedding on record.",
    parties: ["ANC"],
  },
  {
    id: "zuma-mk",
    date: "2023-12-16",
    title: "Zuma backs the new MK party",
    category: "leadership",
    summary: "The former president said he would campaign for uMkhonto weSizwe while remaining an ANC member. The ANC later expelled him.",
    parties: ["ANC", "MK"],
  },
  {
    id: "majority-lost",
    date: "2024-05-29",
    title: "The ANC loses its majority",
    category: "election",
    summary: "The ANC won 40.2% and MK came third. Turnout fell to 58.6%.",
    parties: ["ANC", "MK", "DA"],
  },
  {
    id: "gnu",
    date: "2024-06-14",
    title: "A Government of National Unity is formed",
    category: "governance",
    summary: "Parliament re-elected Ramaphosa with DA support. Ten parties signed the GNU statement of intent.",
    parties: ["ANC", "DA", "IFP"],
    link: "https://en.wikipedia.org/wiki/Government_of_National_Unity_(South_Africa,_2024)",
  },
  {
    id: "vat-dispute",
    date: "2025-04-24",
    title: "The VAT increase is scrapped after a GNU clash",
    category: "economy",
    summary: "The DA and others opposed a proposed VAT increase in the budget. Treasury withdrew it, the first big test of the coalition.",
    parties: ["ANC", "DA"],
  },
  {
    id: "mkhwanazi",
    date: "2025-07-06",
    title: "A police commissioner alleges political interference",
    category: "corruption",
    summary:
      "KZN commissioner Nhlanhla Mkhwanazi accused senior officials of interfering in investigations. The police minister was placed on leave and a judicial commission was set up.",
    parties: ["ANC"],
  },
  {
    id: "lge-2026",
    date: "2026-11-04",
    title: "South Africa votes in the 2026 local elections",
    category: "election",
    summary:
      "The first local vote since the GNU was formed, with MK contesting councils for the first time. Follow the count on the Live page.",
    parties: ["ANC", "DA", "MK", "EFF"],
  },
];

export function sortedEvents() {
  return [...EVENTS].sort((a, b) => b.date.localeCompare(a.date));
}

/** The first election held after an event, or undefined if none has happened yet. */
export function nextElectionAfter(date: string): Election | undefined {
  return ELECTIONS.find((e) => e.date > date);
}

export type Shift = { party: PartyId; from: number; to: number; delta: number };

/**
 * What changed at the next election after this event, compared with the one before it.
 * This shows correlation in time only. It does not claim the event caused the change.
 */
export function shiftAfter(event: NewsEvent): { election: Election; shifts: Shift[] } | undefined {
  // A general election event belongs to its own election; anything else to the next one.
  const target =
    ELECTIONS.find((e) => e.date === event.date) ?? nextElectionAfter(event.date);
  if (!target) return undefined;
  const prev = previousElection(target.year);
  if (!prev) return undefined;
  const a = shareByLineage(prev);
  const b = shareByLineage(target);
  const ids = new Set([...event.parties, "ANC"].map((p) => (p === "NP" ? "NNP" : p)));
  const shifts = [...ids].map((p) => ({ party: p, from: a[p] ?? 0, to: b[p] ?? 0, delta: (b[p] ?? 0) - (a[p] ?? 0) }));
  return { election: target, shifts };
}

export function formatEventDate(e: NewsEvent) {
  const d = new Date(e.date + "T00:00:00Z");
  return d.toLocaleDateString("en-ZA", {
    day: e.precision === "month" ? undefined : "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
