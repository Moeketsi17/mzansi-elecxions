"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { geoConicEqualArea, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import { ArrowLeftIcon, CaretRightIcon, MapTrifoldIcon, WarningIcon } from "@phosphor-icons/react";
import { PROVINCE_IDS, type CouncilStatus, type LgeMunicipality, type LgeMunicipalityDetail } from "@/lib/lge-core";
import type { CouncilProps, WardProps } from "@/lib/geo-core";
import { NEUTRAL, partyOr } from "@/lib/parties";
import { fmtInt, fmtPct } from "@/lib/format";

type CouncilTopo = Topology<{ councils: GeometryCollection<CouncilProps> }>;
type WardTopo = Topology<{ wards: GeometryCollection<WardProps> }>;
type Level = { kind: "country" } | { kind: "province"; id: number } | { kind: "council"; id: number; province: number };
type Hover =
  | { kind: "council"; id: number }
  | { kind: "ward"; id: number }
  | null;

const STATUS_LABEL: Record<CouncilStatus, string> = { majority: "Majority", hung: "Hung council", counting: "Still counting" };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function CouncilMap({
  year,
  municipalities,
  live = false,
}: {
  year: number;
  municipalities: LgeMunicipality[];
  live?: boolean;
}) {
  const [boxRef, width] = useWidth<HTMLDivElement>();
  const height = Math.round(width * (width < 640 ? 0.95 : 0.74));
  const [topo, setTopo] = useState<CouncilTopo | null>(null);
  const [topoError, setTopoError] = useState(false);
  const [level, setLevel] = useState<Level>({ kind: "country" });
  const [hover, setHover] = useState<Hover>(null);
  const tipX = useMotionValue(0);
  const tipY = useMotionValue(0);

  // Council boundaries for the year (static files built by scripts/fetch-geo.mts).
  useEffect(() => {
    let alive = true;
    fetch(`/geo/councils-${year}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CouncilTopo>) : Promise.reject(new Error(String(r.status)))))
      .then((t) => alive && setTopo(t))
      .catch(() => alive && setTopoError(true));
    return () => {
      alive = false;
    };
  }, [year]);

  const byId = useMemo(() => new Map(municipalities.map((m) => [m.id, m])), [municipalities]);

  const geo = useMemo(() => {
    if (!topo || !width) return null;
    const fc = feature(topo, topo.objects.councils);
    const projection = geoConicEqualArea()
      .parallels([-22, -34])
      .rotate([-25, 0])
      .fitExtent(
        [
          [12, 12],
          [width - 12, height - 12],
        ],
        fc as GeoPermissibleObjects,
      );
    const path = geoPath(projection);
    const councils = fc.features.map((f) => ({
      id: f.properties.id,
      province: f.properties.province,
      name: f.properties.name,
      d: path(f) ?? "",
      bounds: path.bounds(f),
    }));
    const prov = (g: { properties?: unknown }) => (g.properties as CouncilProps | undefined)?.province;
    const provinceLines = path(mesh(topo, topo.objects.councils, (a, b) => prov(a) !== prov(b))) ?? "";
    const outline = path(mesh(topo, topo.objects.councils, (a, b) => a === b)) ?? "";
    return { projection, path, councils, provinceLines, outline };
  }, [topo, width, height]);

  // Ward boundaries and ward results for the selected council.
  const councilId = level.kind === "council" ? level.id : null;
  const [wards, setWards] = useState<{ key: string; topo: WardTopo } | null>(null);
  const [detail, setDetail] = useState<{ key: string; data: LgeMunicipalityDetail } | null>(null);
  const [wardError, setWardError] = useState<string | null>(null);
  const key = councilId ? `${year}-${councilId}` : null;

  useEffect(() => {
    if (!councilId || !key) return;
    let alive = true;
    const loadDetail = () =>
      fetch(`/api/lge/${year}/municipality/${councilId}`)
        .then((r) => (r.ok ? (r.json() as Promise<LgeMunicipalityDetail>) : Promise.reject(new Error("detail"))))
        .then((data) => alive && setDetail({ key, data }));
    fetch(`/api/geo/${year}/wards/${councilId}`)
      .then((r) => (r.ok ? (r.json() as Promise<WardTopo>) : Promise.reject(new Error("wards"))))
      .then((t) => alive && setWards({ key, topo: t }))
      .catch(() => alive && setWardError("Ward boundaries could not be loaded from the IEC."));
    loadDetail().catch(() => alive && setWardError("Ward results could not be loaded from the IEC."));
    // While counting, keep the open council's ward results fresh.
    const id = live ? window.setInterval(() => loadDetail().catch(() => {}), 60_000) : undefined;
    return () => {
      alive = false;
      if (id) window.clearInterval(id);
    };
  }, [year, councilId, key, live]);

  const wardShapes = useMemo(() => {
    if (!geo || !wards || wards.key !== key) return [];
    const fc = feature(wards.topo, wards.topo.objects.wards);
    return fc.features.map((f: Feature<Geometry, WardProps>) => ({ id: f.properties.id, ward: f.properties.ward, d: geo.path(f) ?? "" }));
  }, [geo, wards, key]);

  const wardResults = useMemo(
    () => new Map((detail && detail.key === key ? detail.data.wards : []).map((w) => [w.id, w])),
    [detail, key],
  );

  // Zoom: fit the current level's bounds into the viewport.
  const view = useMemo(() => {
    if (!geo) return { x: 0, y: 0, k: 1 };
    let shapes = geo.councils;
    if (level.kind === "province") shapes = geo.councils.filter((c) => c.province === level.id);
    if (level.kind === "council") shapes = geo.councils.filter((c) => c.id === level.id);
    if (level.kind === "country" || !shapes.length) return { x: 0, y: 0, k: 1 };
    const x0 = Math.min(...shapes.map((s) => s.bounds[0][0]));
    const y0 = Math.min(...shapes.map((s) => s.bounds[0][1]));
    const x1 = Math.max(...shapes.map((s) => s.bounds[1][0]));
    const y1 = Math.max(...shapes.map((s) => s.bounds[1][1]));
    const k = Math.min(40, 0.86 / Math.max((x1 - x0) / width, (y1 - y0) / height));
    return { x: width / 2 - k * ((x0 + x1) / 2), y: height / 2 - k * ((y0 + y1) / 2), k };
  }, [geo, level, width, height]);

  // Animate the zoom as an SVG transform attribute. (CSS transforms on SVG groups use the group's own
  // bounding box as their origin, which drifts as layers change; the attribute always uses the SVG origin.)
  const spring = { stiffness: 70, damping: 18, mass: 0.9 };
  const zx = useSpring(0, spring);
  const zy = useSpring(0, spring);
  const zk = useSpring(1, spring);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) {
      zx.jump(view.x);
      zy.jump(view.y);
      zk.jump(view.k);
    } else {
      zx.set(view.x);
      zy.set(view.y);
      zk.set(view.k);
    }
  }, [view, zx, zy, zk, reduceMotion]);
  // Write the transform straight to the DOM on every spring frame: no React re-render per frame.
  const zoomRef = useRef<SVGGElement>(null);
  const hasGeo = !!geo;
  useEffect(() => {
    const apply = () => zoomRef.current?.setAttribute("transform", `translate(${zx.get()} ${zy.get()}) scale(${zk.get()})`);
    apply();
    const unsubscribe = [zx.on("change", apply), zy.on("change", apply), zk.on("change", apply)];
    return () => unsubscribe.forEach((u) => u());
  }, [zx, zy, zk, hasGeo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setLevel((l) => (l.kind === "council" ? { kind: "province", id: l.province } : { kind: "country" }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const select = (id: number) => {
    const c = geo?.councils.find((x) => x.id === id);
    if (!c) return;
    setWardError(null);
    setHover(null);
    if (level.kind === "council" && level.id === id) return;
    if (level.kind === "province" || level.kind === "council") setLevel({ kind: "council", id, province: c.province });
    else setLevel({ kind: "province", id: c.province });
  };

  const onMove = (e: React.PointerEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    tipX.set(Math.min(e.clientX - box.left + 14, width - 230));
    tipY.set(Math.max(e.clientY - box.top - 10, 0));
  };

  const councilFill = (id: number) => {
    const m = byId.get(id);
    const lead = m?.top[0];
    return lead ? partyOr(lead.id, lead.name).color : "var(--color-panel-2)";
  };

  const legend = useMemo(() => {
    const counts = new Map<string, { name: string; n: number }>();
    for (const m of municipalities) {
      const t = m.top[0];
      if (!t) continue;
      const c = counts.get(t.id) ?? { name: t.name, n: 0 };
      c.n++;
      counts.set(t.id, c);
    }
    return [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [municipalities]);

  const hoveredCouncil = hover?.kind === "council" ? byId.get(hover.id) : undefined;
  const hoveredWard = hover?.kind === "ward" ? wardResults.get(hover.id) : undefined;
  const hoveredWardNo = hover?.kind === "ward" ? wardShapes.find((w) => w.id === hover.id)?.ward : undefined;
  const selected = level.kind === "council" ? byId.get(level.id) : undefined;
  const wardsLoading = level.kind === "council" && !wardError && (!wards || wards.key !== key);
  const sortedCouncils = useMemo(() => [...municipalities].sort((a, b) => a.name.localeCompare(b.name)), [municipalities]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        {/* Breadcrumb */}
        <nav aria-label="Map level" className="mb-3 flex min-h-8 flex-wrap items-center gap-1 text-sm">
          {level.kind !== "country" && (
            <button
              type="button"
              onClick={() => setLevel(level.kind === "council" ? { kind: "province", id: level.province } : { kind: "country" })}
              className="mr-2 flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-xs text-fg transition hover:bg-panel active:scale-[0.97]"
            >
              <ArrowLeftIcon size={12} /> Back
            </button>
          )}
          <button type="button" onClick={() => setLevel({ kind: "country" })} className="text-fg-2 hover:text-fg">
            South Africa
          </button>
          {level.kind !== "country" && (
            <>
              <CaretRightIcon size={12} className="text-fg-3" />
              <button
                type="button"
                onClick={() => setLevel({ kind: "province", id: level.kind === "province" ? level.id : level.province })}
                className={level.kind === "province" ? "text-fg" : "text-fg-2 hover:text-fg"}
              >
                {PROVINCE_IDS[level.kind === "province" ? level.id : level.province]?.name}
              </button>
            </>
          )}
          {level.kind === "council" && (
            <>
              <CaretRightIcon size={12} className="text-fg-3" />
              <span className="text-fg">{selected?.name ?? geo?.councils.find((c) => c.id === level.id)?.name}</span>
            </>
          )}
        </nav>

        <div
          ref={boxRef}
          className="relative w-full overflow-hidden rounded-[1.5rem] border border-line bg-[radial-gradient(ellipse_at_center,rgb(255_255_255/0.025),transparent_70%)]"
          style={{ height: height || undefined, minHeight: 280 }}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {!geo && !topoError && <div className="skeleton absolute inset-4" aria-label="Loading map" />}
          {topoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <MapTrifoldIcon size={32} className="text-fg-3" />
              <p className="text-sm text-fg-2">The map could not be loaded.</p>
              <p className="text-xs text-fg-3">The council list below has the same results.</p>
            </div>
          )}

          {geo && (
            <svg width={width} height={height} role="img" aria-label={`Map of ${year} council results`} className="block touch-manipulation">
              <defs>
                <pattern
                  id="hung-hatch"
                  patternUnits="userSpaceOnUse"
                  width="5"
                  height="5"
                  patternTransform={`scale(${1 / view.k}) rotate(45)`}
                >
                  <rect width="5" height="5" fill="transparent" />
                  <line x1="0" y1="0" x2="0" y2="5" stroke="var(--color-ink)" strokeWidth="2" strokeOpacity="0.55" />
                </pattern>
              </defs>
              <g ref={zoomRef}>
                {geo.councils.map((c) => {
                  const m = byId.get(c.id);
                  const inScope =
                    level.kind === "country" ||
                    (level.kind === "province" && c.province === level.id) ||
                    (level.kind === "council" && c.id === level.id);
                  const isHover = hover?.kind === "council" && hover.id === c.id;
                  return (
                    <g key={c.id}>
                      <path
                        d={c.d}
                        fill={councilFill(c.id)}
                        fillOpacity={(m?.status === "counting" ? 0.45 : 0.92) * (inScope ? 1 : 0.28)}
                        stroke={isHover ? "var(--color-fg)" : "var(--color-ink)"}
                        strokeWidth={isHover ? 1.6 : 0.5}
                        vectorEffect="non-scaling-stroke"
                        className="cursor-pointer transition-[fill-opacity] duration-300"
                        onPointerEnter={() => setHover({ kind: "council", id: c.id })}
                        onClick={() => select(c.id)}
                      >
                        <title>{`${c.name}${m ? `: ${partyOr(m.top[0]?.id ?? "", m.top[0]?.name ?? "").short} leads, ${STATUS_LABEL[m.status].toLowerCase()}` : ""}`}</title>
                      </path>
                      {m?.status === "hung" && (
                        <path d={c.d} fill="url(#hung-hatch)" pointerEvents="none" opacity={inScope ? 1 : 0.3} />
                      )}
                    </g>
                  );
                })}

                {/* Wards of the selected council */}
                {level.kind === "council" &&
                  wardShapes.map((w) => {
                    const r = wardResults.get(w.id);
                    const isHover = hover?.kind === "ward" && hover.id === w.id;
                    return (
                      <path
                        key={w.id}
                        d={w.d}
                        fill={r?.party ? partyOr(r.party, r.partyName ?? r.party).color : NEUTRAL}
                        fillOpacity={r?.party ? 0.95 : 0.35}
                        stroke={isHover ? "var(--color-fg)" : "var(--color-ink)"}
                        strokeWidth={isHover ? 1.8 : 0.7}
                        vectorEffect="non-scaling-stroke"
                        onPointerEnter={() => setHover({ kind: "ward", id: w.id })}
                      >
                        <title>{`Ward ${w.ward}${r?.partyName ? `: ${r.partyName}` : ": not yet counted"}`}</title>
                      </path>
                    );
                  })}

                <path d={geo.provinceLines} fill="none" stroke="var(--color-fg)" strokeOpacity="0.5" strokeWidth={1.1} vectorEffect="non-scaling-stroke" pointerEvents="none" />
                <path d={geo.outline} fill="none" stroke="var(--color-fg)" strokeOpacity="0.35" strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none" />
              </g>
            </svg>
          )}

          {wardsLoading && (
            <div className="absolute bottom-3 left-3 rounded-full border border-line bg-panel/90 px-3 py-1.5 text-xs text-fg-2 backdrop-blur">
              Loading wards&hellip;
            </div>
          )}

          {/* Tooltip */}
          <AnimatePresence>
            {(hoveredCouncil || hover?.kind === "ward") && (
              <motion.div
                key={hover?.kind === "ward" ? `w${hover.id}` : `c${hover?.id}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ x: tipX, y: tipY }}
                className="pointer-events-none absolute left-0 top-0 z-10 w-56 rounded-xl border border-line-strong bg-panel/95 p-3 text-xs shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur"
              >
                {hoveredCouncil && hover?.kind === "council" && (
                  <>
                    <div className="text-sm text-fg">{hoveredCouncil.name}</div>
                    <div className="mb-2 text-[11px] text-fg-3">
                      {STATUS_LABEL[hoveredCouncil.status]}
                      {hoveredCouncil.status === "counting" && ` · ${hoveredCouncil.districtsPct.toFixed(0)}% in`} · {fmtInt(hoveredCouncil.seatsTotal)} seats
                    </div>
                    {hoveredCouncil.top.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-fg-2">
                          <span className="size-1.5 rounded-full" style={{ background: partyOr(t.id, t.name).color }} />
                          {partyOr(t.id, t.name).short}
                        </span>
                        <span className="font-mono tabular">{fmtPct(t.pct)}</span>
                      </div>
                    ))}
                    <div className="mt-2 text-[10px] text-fg-3">
                      {level.kind === "country" ? "Click to zoom into the province" : "Click to see the wards"}
                    </div>
                  </>
                )}
                {hover?.kind === "ward" && (
                  <>
                    <div className="text-sm text-fg">Ward {hoveredWardNo}</div>
                    {hoveredWard?.partyName ? (
                      <>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-fg-2">
                            <span className="size-1.5 rounded-full" style={{ background: partyOr(hoveredWard.party ?? "", hoveredWard.partyName).color }} />
                            {partyOr(hoveredWard.party ?? "", hoveredWard.partyName).short}
                          </span>
                          {hoveredWard.pct != null && <span className="font-mono tabular">{fmtPct(hoveredWard.pct)}</span>}
                        </div>
                        {hoveredWard.candidate && <div className="mt-1 text-[11px] text-fg-3">{hoveredWard.candidate}</div>}
                      </>
                    ) : (
                      <div className="mt-1 text-[11px] text-fg-3">No result captured yet</div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-2">
          {legend.slice(0, 7).map(([id, v]) => (
            <span key={id} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px]" style={{ background: partyOr(id, v.name).color }} />
              {partyOr(id, v.name).short} <span className="font-mono text-fg-3 tabular">{v.n}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden>
              <rect width="10" height="10" rx="2" fill="var(--color-fg-3)" />
              <path d="M-2 4 L4 -2 M0 10 L10 0 M6 12 L12 6" stroke="var(--color-ink)" strokeWidth="1.6" />
            </svg>
            Hung
          </span>
          {live && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px] bg-[#3c9a5f]/45" /> Darker: still counting
            </span>
          )}
        </div>
      </div>

      {/* Side panel */}
      <aside className="space-y-6 lg:pt-11">
        <div className="flex flex-col gap-2">
          <label htmlFor="map-jump" className="text-xs text-fg-2">
            Jump to a council
          </label>
          <select
            id="map-jump"
            value={level.kind === "council" ? level.id : ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const c = geo?.councils.find((x) => x.id === id);
              if (c) {
                setWardError(null);
                setLevel({ kind: "council", id, province: c.province });
              }
            }}
            className="h-10 rounded-lg border border-line bg-panel px-3 text-sm text-fg outline-none focus:border-line-strong"
          >
            <option value="">Choose a council</option>
            {sortedCouncils.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <AnimatePresence mode="wait">
          {level.kind === "council" ? (
            <motion.div
              key={`c${level.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg tracking-tight">{selected?.name}</h3>
                <p className="text-xs text-fg-3">
                  {selected && STATUS_LABEL[selected.status]} · {fmtInt(selected?.seatsTotal ?? 0)} seats · {PROVINCE_IDS[level.province]?.name}
                </p>
              </div>
              {wardError && (
                <p role="alert" className="flex items-start gap-2 text-xs text-fg-2">
                  <WarningIcon size={14} className="mt-0.5 shrink-0" /> {wardError}
                </p>
              )}
              {detail && detail.key === key ? (
                <>
                  <ol className="space-y-1.5">
                    {detail.data.parties
                      .filter((p) => p.votes > 0 && p.id !== "OTHER")
                      .slice(0, 6)
                      .map((p) => {
                        const meta = partyOr(p.id, p.name);
                        return (
                          <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_3.5rem_2.5rem] items-center gap-2 text-sm">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="size-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                              <span className="truncate text-fg-2">{meta.short}</span>
                            </span>
                            <span className="text-right font-mono text-xs tabular">{fmtPct(p.pct)}</span>
                            <span className="text-right font-mono text-xs text-fg-3 tabular">{p.seats}</span>
                          </li>
                        );
                      })}
                  </ol>
                  <p className="text-[11px] text-fg-3">
                    Share and seats. {detail.data.wards.filter((w) => w.party).length} of {detail.data.wards.length} wards have a winner.
                    Hover a ward on the map for its winning candidate.
                  </p>
                </>
              ) : (
                !wardError && (
                  <div className="space-y-2" aria-hidden>
                    {[80, 60, 40, 30].map((w) => (
                      <div key={w} className="skeleton h-4" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )
              )}
            </motion.div>
          ) : (
            <motion.div
              key={level.kind === "province" ? `p${level.id}` : "country"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg tracking-tight">
                  {level.kind === "province" ? PROVINCE_IDS[level.id]?.name : "South Africa"}
                </h3>
                <p className="text-xs text-fg-3">
                  {level.kind === "province"
                    ? "Click a council to see its wards. Press Esc to zoom out."
                    : "Each council is coloured by its leading party. Click a province to zoom in."}
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-1.5">
                {Object.entries(PROVINCE_IDS).map(([id, p]) => {
                  const active = level.kind === "province" && level.id === Number(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setLevel({ kind: "province", id: Number(id) })}
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-xs transition active:scale-[0.98] ${
                          active ? "border-line-strong bg-panel-2 text-fg" : "border-line text-fg-2 hover:text-fg"
                        }`}
                      >
                        {p.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}
