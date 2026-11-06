import { cacheLife } from "next/cache";
import { parseGeo, wardsGeoUrl, wardsTopology } from "./geo-core";

/** Ward boundaries for one council, simplified. Boundaries never change once published, so cache them for good. */
export async function getWardTopology(year: number, municipality: number) {
  "use cache";
  cacheLife("max");
  const res = await fetch(wardsGeoUrl(year, municipality), {
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "mzansi-elecxions" },
  });
  if (!res.ok) throw new Error(`IEC map server answered ${res.status}`);
  return wardsTopology(parseGeo(await res.text()));
}
