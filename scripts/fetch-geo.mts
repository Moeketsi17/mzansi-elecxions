/**
 * Download council boundaries for every local election from the IEC results
 * dashboard, simplify them, and write them to public/geo/councils-{year}.json
 * (TopoJSON). Ward boundaries are fetched on demand by /api/geo instead.
 *
 * Usage: node scripts/fetch-geo.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { councilsGeoUrl, councilsTopology, parseGeo } from "../src/lib/geo-core.ts";
import { LGE_YEARS } from "../src/lib/lge-core.ts";

const dir = new URL("../public/geo/", import.meta.url);
mkdirSync(dir, { recursive: true });

for (const year of LGE_YEARS) {
  const res = await fetch(councilsGeoUrl(year), { headers: { "User-Agent": "mzansi-elecxions-snapshot" } });
  if (!res.ok) throw new Error(`${res.status} for ${year}`);
  const raw = await res.text();
  const topo = councilsTopology(parseGeo(raw));
  const out = JSON.stringify(topo);
  writeFileSync(new URL(`councils-${year}.json`, dir), out);
  console.log(`${year}: ${(raw.length / 1e6).toFixed(1)} MB -> ${(out.length / 1e3).toFixed(0)} KB`);
}
