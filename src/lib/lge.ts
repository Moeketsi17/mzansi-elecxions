import { cacheLife } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import history from "@/data/lge-history.json";
import {
  buildMunicipalityDetail,
  buildYear,
  CURRENT_LGE,
  LGE_DATES,
  LGE_YEARS,
  lgeUrl,
  PROVINCE_IDS,
  type LgeMunicipalityDetail,
  type LgeResult,
  type LgeYear,
  type RawMunicipality,
  type RawNational,
  type RawProvince,
} from "./lge-core";
import { lineageOf, LGE_TRACKED, type PartyId } from "./parties";
import type { TrendPoint } from "./elections";

export * from "./lge-core";

type Snapshot = { generatedAt: string; years: Record<string, LgeYear> };
const SNAPSHOT = history as unknown as Snapshot;


async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(`${url}?t=${Date.now()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "mzansi-elecxions" },
  });
  if (!res.ok) throw new Error(`IEC results feed answered ${res.status}`);
  return JSON.parse((await res.text()).replace(/^﻿/, "")) as T;
}

/** The current election, refreshed from the IEC at most once a minute and shared by every visitor. */
async function fetchLiveYear(): Promise<LgeYear> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 180 });
  const [national, ...provinces] = await Promise.all([
    getJson<RawNational>(lgeUrl(CURRENT_LGE, "national")),
    ...Object.keys(PROVINCE_IDS).map((id) => getJson<RawProvince>(lgeUrl(CURRENT_LGE, { province: Number(id) }))),
  ]);
  return buildYear(CURRENT_LGE, national, provinces);
}

export function isLgeYear(year: number) {
  return LGE_YEARS.includes(year);
}

/** Past elections come from the bundled snapshot. The current one comes live from the IEC, with the snapshot as fallback. */
export async function getLgeYear(year: number): Promise<LgeResult | undefined> {
  const snap = SNAPSHOT.years[String(year)];
  if (year !== CURRENT_LGE) return snap ? { data: snap, source: "snapshot", stale: false } : undefined;
  // Live figures are request-time data: never bake them into the prerendered shell.
  await connection();
  try {
    return { data: await fetchLiveYear(), source: "iec", stale: false };
  } catch (err) {
    // Let Next.js's own control-flow errors (e.g. postponing a dynamic hole during prerender) through.
    unstable_rethrow(err);
    return snap ? { data: snap, source: "snapshot", stale: true } : undefined;
  }
}

/** Synchronous access to bundled years, for static parts of pages (trends, cards). */
export function snapshotYear(year: number): LgeYear | undefined {
  return SNAPSHOT.years[String(year)];
}

export function previousLgeYear(year: number) {
  const i = LGE_YEARS.indexOf(year);
  return i > 0 ? LGE_YEARS[i - 1] : undefined;
}

async function fetchMunicipality(year: number, id: number): Promise<LgeMunicipalityDetail> {
  "use cache";
  if (year === CURRENT_LGE) cacheLife({ stale: 30, revalidate: 60, expire: 180 });
  else cacheLife("max");
  const raw = await getJson<RawMunicipality>(lgeUrl(year, { municipality: id }));
  return buildMunicipalityDetail(raw);
}

export async function getMunicipality(year: number, id: number) {
  return fetchMunicipality(year, id);
}

/** Share by party per local election, for the trend chart. */
export function lgeTrend(latest?: LgeYear): TrendPoint[] {
  return LGE_YEARS.map((year) => {
    const y = year === CURRENT_LGE && latest ? latest : SNAPSHOT.years[String(year)];
    const share: Record<PartyId, number> = {};
    for (const p of y?.parties ?? []) {
      const id = lineageOf(p.id);
      share[id] = (share[id] ?? 0) + p.pct;
    }
    const values: Record<PartyId, number | null> = {};
    // A party with no result that year did not contest it (or was folded into "Other" by the IEC).
    for (const id of LGE_TRACKED) values[id] = share[id] ?? null;
    return { year, date: LGE_DATES[year], values };
  });
}

export function lgeShare(y: LgeYear, id: PartyId) {
  return y.parties.filter((p) => lineageOf(p.id) === id).reduce((s, p) => s + p.pct, 0);
}

/** Party share keyed by lineage id, for "change since last time" columns. */
export function lineageShares(y?: LgeYear) {
  const out: Record<string, number> = {};
  for (const p of y?.parties ?? []) if (p.id !== "OTHER") out[lineageOf(p.id)] = (out[lineageOf(p.id)] ?? 0) + p.pct;
  return out;
}
