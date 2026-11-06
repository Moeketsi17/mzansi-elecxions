/**
 * Boundary data for the council and ward maps.
 *
 * The IEC results dashboard publishes GeoJSON (WGS84) for every local election:
 *   MapData/{year}/nationalMunic.js     every council in the country
 *   MapData/{year}/municward{id}.js     every ward in one council
 * The raw files are large (the 2026 national file is ~10 MB), so we convert them
 * to TopoJSON, which shares borders between neighbours, and simplify. Shared
 * borders mean simplification never opens gaps between councils.
 *
 * Plain TypeScript with relative imports only: used by Next.js and by
 * `node scripts/fetch-geo.mts`.
 */
import { topology } from "topojson-server";
import { presimplify, simplify } from "topojson-simplify";
import { quantize } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

export const GEO_BASE = "https://results.elections.org.za/ElectionMap/MapData";

export const councilsGeoUrl = (year: number) => `${GEO_BASE}/${year}/nationalMunic.js`;
export const wardsGeoUrl = (year: number, municipality: number) => `${GEO_BASE}/${year}/municward${municipality}.js`;

/** Properties kept on each council shape. */
export type CouncilProps = { id: number; province: number; name: string };
/** Properties kept on each ward shape. */
export type WardProps = { id: number; ward: number };

type RawProps = Record<string, string | number | null | undefined>;

function num(p: RawProps, ...keys: string[]) {
  for (const k of keys) {
    const v = p[k];
    if (v != null && v !== "") return Number(v);
  }
  return NaN;
}

/**
 * Convert a FeatureCollection to a simplified, quantized TopoJSON topology
 * holding at most about `budget` points, whatever the detail of the source.
 */
export function simplifyToTopology<P>(
  fc: FeatureCollection<Geometry, RawProps>,
  objectName: string,
  pick: (p: RawProps) => P | null,
  budget: number,
): Topology {
  const features: Feature<Geometry, P>[] = [];
  for (const f of fc.features) {
    if (!f.geometry) continue;
    const props = pick(f.properties ?? {});
    if (props) features.push({ type: "Feature", properties: props, geometry: f.geometry });
  }
  const input = { [objectName]: { type: "FeatureCollection", features } } as unknown as Parameters<typeof topology>[0];
  const pre = presimplify(topology(input) as unknown as Parameters<typeof presimplify>[0]);
  // Pick the weight threshold from positive weights only: some IEC files repeat points,
  // which have zero weight and would otherwise drag the threshold down to nothing.
  const weights: number[] = [];
  for (const arc of pre.arcs) for (const pt of arc) if (pt[2] > 0 && Number.isFinite(pt[2])) weights.push(pt[2]);
  weights.sort((a, b) => b - a);
  const threshold = weights.length > budget ? weights[budget] : Number.MIN_VALUE;
  const simple = simplify(pre, threshold);
  // Integer, delta-encoded coordinates: roughly a tenth of the size of raw floats.
  return quantize(simple, 1e5);
}

export function councilsTopology(fc: FeatureCollection<Geometry, RawProps>, budget = 40_000) {
  return simplifyToTopology<CouncilProps>(
    fc,
    "councils",
    (p) => {
      const id = num(p, "MunicId");
      if (!Number.isFinite(id)) return null;
      const label = String(p.Municipali ?? "");
      return {
        id,
        province: num(p, "ProvinceId", "ProvincId", "ProvId"),
        name: label.includes(" - ") ? label.split(" - ").slice(1).join(" - ") : label,
      };
    },
    budget,
  );
}

export function wardsTopology(fc: FeatureCollection<Geometry, RawProps>, budget = 12_000) {
  return simplifyToTopology<WardProps>(
    fc,
    "wards",
    (p) => {
      const id = num(p, "PklWardID", "WardID");
      if (!Number.isFinite(id)) return null;
      const ward = num(p, "WardNo");
      return { id, ward: Number.isFinite(ward) ? ward : id % 1000 };
    },
    budget,
  );
}

/** The IEC serves these as .js files with a UTF-8 BOM; parse them as JSON. */
export function parseGeo(text: string) {
  return JSON.parse(text.replace(/^\uFEFF/, "")) as FeatureCollection<Geometry, RawProps>;
}
