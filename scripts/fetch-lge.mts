/**
 * Snapshot local government election results from the IEC results dashboard
 * into src/data/lge-history.json, so past elections render without depending on
 * the IEC being reachable. The current election is snapshotted too, as a
 * fallback for when the live feed cannot be reached.
 *
 * Usage: node scripts/fetch-lge.mts
 */
import { writeFileSync } from "node:fs";
import {
  buildYear,
  LGE_BASE,
  LGE_YEARS,
  lgeUrl,
  PROVINCE_IDS,
  type LgeYear,
  type RawNational,
  type RawProvince,
} from "../src/lib/lge-core.ts";

const OUT = new URL("../src/data/lge-history.json", import.meta.url);

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`, { headers: { "User-Agent": "mzansi-elecxions-snapshot" } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      const text = (await res.text()).replace(/^﻿/, "");
      return JSON.parse(text) as T;
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

type PartyListEntry = { ID: number; PartyFullName: string };

const years: Record<number, LgeYear> = {};
for (const year of LGE_YEARS) {
  const [national, list, ...provinces] = await Promise.all([
    getJson<RawNational>(lgeUrl(year, "national")),
    getJson<PartyListEntry[]>(`${LGE_BASE}/${year}/PartyList.js`).catch(() => [] as PartyListEntry[]),
    ...Object.keys(PROVINCE_IDS).map((id) => getJson<RawProvince>(lgeUrl(year, { province: Number(id) }))),
  ]);
  const names = new Map(list.map((p) => [p.ID, p.PartyFullName]));
  years[year] = buildYear(year, national, provinces, (id) => names.get(id));
  const y = years[year];
  const top = y.parties.slice(0, 3).map((p) => `${p.id} ${p.pct}%`).join(", ");
  console.log(
    `${year}: ${y.municipalities.length} councils, ${y.progress.districts.done}/${y.progress.districts.total} districts, ${top}`,
  );
}

writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), years }));
console.log(`wrote ${OUT.pathname}`);
