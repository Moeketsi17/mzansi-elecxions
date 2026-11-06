"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { trendSeries, type TrendPoint } from "@/lib/elections";
import { CATEGORIES, EVENTS, formatEventDate, type Category, type NewsEvent } from "@/lib/events";
import { party, TRACKED as NATIONAL_TRACKED, type PartyId } from "@/lib/parties";
import { fmtPct } from "@/lib/format";

const NATIONAL_POINTS = trendSeries();
const T0 = Date.UTC(1993, 6, 1);
const T1 = Date.UTC(2027, 3, 1);
const t = (iso: string) => Date.parse(iso + "T00:00:00Z");

const DEFAULT_ON: PartyId[] = ["ANC", "DA", "EFF", "MK", "IFP", "COPE"];

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Push end labels apart so none overlap. */
function relax(items: { id: PartyId; y: number }[], gap: number, min: number, max: number) {
  const sorted = [...items].sort((a, b) => a.y - b.y).map((d) => ({ ...d, ly: d.y }));
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 1; i < sorted.length; i++) {
      const d = sorted[i].ly - sorted[i - 1].ly;
      if (d < gap) {
        const push = (gap - d) / 2;
        sorted[i - 1].ly -= push;
        sorted[i].ly += push;
      }
    }
    for (const s of sorted) s.ly = Math.min(Math.max(s.ly, min), max);
  }
  return sorted;
}

export function TrendChart({
  height = 420,
  showEvents = true,
  compact = false,
  points: POINTS = NATIONAL_POINTS,
  parties: TRACKED = NATIONAL_TRACKED,
  defaultOn = DEFAULT_ON,
  provisionalYear,
  label = "National vote share by party, 1994 to 2024",
}: {
  height?: number;
  showEvents?: boolean;
  compact?: boolean;
  points?: TrendPoint[];
  parties?: PartyId[];
  defaultOn?: PartyId[];
  /** A year whose result is still being counted; its markers are drawn hollow. */
  provisionalYear?: number;
  label?: string;
}) {
  const LAST_YEAR = POINTS[POINTS.length - 1].year;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [on, setOn] = useState<PartyId[]>(defaultOn);
  const [hover, setHover] = useState<number | null>(null);
  const [eventsOn, setEventsOn] = useState(showEvents);
  const [cats, setCats] = useState<Category[]>(["corruption", "leadership", "unrest", "economy"]);
  const [activeEvent, setActiveEvent] = useState<NewsEvent | null>(null);

  const narrow = width < 640;
  const M = { top: 16, right: narrow ? 64 : 92, bottom: eventsOn ? 64 : 30, left: narrow ? 30 : 40 };
  const iw = width - M.left - M.right;
  const ih = height - M.top - M.bottom;
  const x = (iso: string) => M.left + ((t(iso) - T0) / (T1 - T0)) * iw;
  const yMax = 75;
  const y = (v: number) => M.top + ih - (v / yMax) * ih;

  const visible = TRACKED.filter((id) => on.includes(id));

  const paths = visible.map((id) => {
        const segs: string[] = [];
        let pen = false;
        for (const p of POINTS) {
          const v = p.values[id];
          if (v == null) {
            pen = false;
            continue;
          }
          segs.push(`${pen ? "L" : "M"}${x(p.date).toFixed(1)},${y(v).toFixed(1)}`);
          pen = true;
        }
        return { id, d: segs.join(" ") };
      });

  const endLabels = relax(
    visible
      .map((id) => ({ id, v: POINTS[POINTS.length - 1].values[id] }))
      .filter((d): d is { id: PartyId; v: number } => d.v != null)
      .map((d) => ({ id: d.id, y: y(d.v) })),
    14,
    M.top,
    M.top + ih,
  );

  const events = eventsOn ? EVENTS.filter((e) => cats.includes(e.category) && t(e.date) < T1) : [];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * width;
    let best = 0;
    let dist = Infinity;
    POINTS.forEach((p, i) => {
      const d = Math.abs(x(p.date) - px);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover != null ? POINTS[hover] : null;
  const ticks = [0, 20, 40, 60];

  return (
    <div>
      {!compact && (
        <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Parties shown">
          {TRACKED.map((id) => {
            const active = on.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setOn((s) => (active ? s.filter((p) => p !== id) : [...s, id]))}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition active:scale-[0.97] ${
                  active ? "border-line-strong bg-panel-2 text-fg" : "border-line text-fg-3 hover:text-fg-2"
                }`}
              >
                <span
                  className="size-2 rounded-full transition"
                  style={{ background: active ? party(id).color : "transparent", boxShadow: `inset 0 0 0 1.5px ${party(id).color}` }}
                />
                {party(id).short}
              </button>
            );
          })}
          {showEvents && (
            <>
              <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
              <button
                type="button"
                aria-pressed={eventsOn}
                onClick={() => setEventsOn((v) => !v)}
                className={`rounded-full border px-3 py-1.5 text-xs transition active:scale-[0.97] ${
                  eventsOn ? "border-signal/40 bg-signal/10 text-signal" : "border-line text-fg-3"
                }`}
              >
                {eventsOn ? "News markers on" : "News markers off"}
              </button>
            </>
          )}
        </div>
      )}

      {!compact && eventsOn && (
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="News categories shown">
          {(Object.keys(CATEGORIES) as Category[]).map((c) => {
            const active = cats.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCats((s) => (active ? s.filter((x) => x !== c) : [...s, c]))}
                className={`rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.08em] transition ${
                  active ? "bg-panel-2 text-fg-2" : "text-fg-3/70 line-through decoration-fg-3/40"
                }`}
              >
                {CATEGORIES[c].label}
              </button>
            );
          })}
        </div>
      )}

      <div ref={ref} className="relative w-full select-none">
        <svg
          width={width}
          height={height}
          className="block touch-pan-y"
          role="img"
          aria-label={label}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {/* grid */}
          {ticks.map((v) => (
            <g key={v}>
              <line x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
              <text x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-fg-3 font-mono text-[10px]">
                {v}%
              </text>
            </g>
          ))}
          {/* majority line */}
          <line x1={M.left} x2={M.left + iw} y1={y(50)} y2={y(50)} stroke="var(--color-signal)" strokeOpacity="0.35" strokeDasharray="3 4" />
          <text x={M.left + 6} y={y(50) - 6} className="fill-signal/70 text-[10px]">
            50% majority
          </text>

          {/* election columns */}
          {POINTS.map((p, i) => (
            <g key={p.year}>
              <line
                x1={x(p.date)}
                x2={x(p.date)}
                y1={M.top}
                y2={M.top + ih}
                stroke={hover === i ? "var(--color-line-strong)" : "transparent"}
              />
              <text
                x={x(p.date)}
                y={M.top + ih + 18}
                textAnchor="middle"
                className={`font-mono text-[10px] ${hover === i ? "fill-fg" : "fill-fg-3"}`}
              >
                {narrow ? `'${String(p.year).slice(2)}` : p.year}
                {p.year === provisionalYear && !narrow ? "*" : ""}
              </text>
            </g>
          ))}

          {/* series */}
          {paths.map(({ id, d }) => (
            <motion.path
              key={id}
              d={d}
              fill="none"
              stroke={party(id).color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
          {visible.map((id) =>
            POINTS.map((p, i) => {
              const v = p.values[id];
              if (v == null) return null;
              return (
                <circle
                  key={`${id}-${p.year}`}
                  cx={x(p.date)}
                  cy={y(v)}
                  r={hover === i ? 5 : 3.5}
                  fill={p.year === provisionalYear ? "var(--color-ink)" : party(id).color}
                  stroke={p.year === provisionalYear ? party(id).color : "var(--color-ink)"}
                  strokeWidth={2}
                />
              );
            }),
          )}

          {/* end labels */}
          {endLabels.map((l) => {
            const v = POINTS[POINTS.length - 1].values[l.id] ?? 0;
            const ex = x(POINTS[POINTS.length - 1].date);
            return (
              <g key={l.id}>
                {Math.abs(l.ly - l.y) > 2 && (
                  <line x1={ex + 6} x2={ex + 14} y1={l.y} y2={l.ly} stroke="var(--color-line-strong)" />
                )}
                <text x={ex + 16} y={l.ly} dy="0.32em" className="text-[11px]">
                  <tspan className="fill-fg-2">{party(l.id).short}</tspan>
                  {!narrow && <tspan className="fill-fg-3 font-mono"> {v.toFixed(1)}</tspan>}
                </text>
              </g>
            );
          })}

          {/* news markers */}
          {eventsOn && (
            <g>
              <line x1={M.left} x2={M.left + iw} y1={M.top + ih + 36} y2={M.top + ih + 36} stroke="var(--color-line)" />
              {!narrow && (
                <text x={M.left - 8} y={M.top + ih + 36} dy="0.32em" textAnchor="end" className="fill-fg-3 text-[9px] uppercase">
                  News
                </text>
              )}
              {events.map((ev) => {
                const ex = x(ev.date);
                const active = activeEvent?.id === ev.id;
                return (
                  <g
                    key={ev.id}
                    className="cursor-pointer"
                    onPointerEnter={() => setActiveEvent(ev)}
                    onClick={() => setActiveEvent(ev)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${formatEventDate(ev)}: ${ev.title}`}
                    onFocus={() => setActiveEvent(ev)}
                  >
                    <rect x={ex - 7} y={M.top + ih + 26} width={14} height={22} fill="transparent" />
                    <line
                      x1={ex}
                      x2={ex}
                      y1={M.top + ih + 30}
                      y2={M.top + ih + 42}
                      stroke={active ? "var(--color-signal)" : "var(--color-fg-3)"}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    {active && (
                      <line x1={ex} x2={ex} y1={M.top} y2={M.top + ih} stroke="var(--color-signal)" strokeOpacity="0.3" strokeDasharray="2 3" />
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* crosshair tooltip */}
        <AnimatePresence>
          {hp && (
            <motion.div
              key="tip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-xl border border-line-strong bg-panel/95 p-3 text-xs shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur"
              style={{
                left: Math.min(Math.max(x(hp.date) + 14, 0), width - 180),
              }}
            >
              <div className="mb-2 font-mono text-fg">
                {hp.year}
                {hp.year === provisionalYear && <span className="ml-2 font-sans text-[10px] text-signal">Still counting</span>}
              </div>
              <ul className="space-y-1">
                {visible
                  .filter((id) => hp.values[id] != null)
                  .sort((a, b) => (hp.values[b] ?? 0) - (hp.values[a] ?? 0))
                  .map((id) => (
                    <li key={id} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-fg-2">
                        <span className="size-1.5 rounded-full" style={{ background: party(id).color }} />
                        {party(id).short}
                      </span>
                      <span className="font-mono text-fg tabular">{fmtPct(hp.values[id] ?? 0)}</span>
                    </li>
                  ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected news event */}
      {eventsOn && (
        <div className="mt-3 min-h-[68px]">
          <AnimatePresence mode="wait">
            {activeEvent ? (
              <motion.div
                key={activeEvent.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col gap-1 border-l-2 border-signal/60 pl-4 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="shrink-0 font-mono text-xs text-fg-3">{formatEventDate(activeEvent)}</span>
                <span className="text-sm text-fg">
                  {activeEvent.title}{" "}
                  <Link href={`/timeline#${activeEvent.id}`} className="whitespace-nowrap text-fg-3 underline decoration-line-strong underline-offset-4 hover:text-fg">
                    Read more
                  </Link>
                </span>
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-fg-3">
                Hover or tap a marker on the News row to see what happened. Last election shown: {LAST_YEAR}
                {provisionalYear === LAST_YEAR ? " (still counting, hollow markers)" : ""}.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
