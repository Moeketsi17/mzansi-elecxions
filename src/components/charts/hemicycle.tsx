"use client";

import { memo, useMemo, useState } from "react";
import { party, type PartyId } from "@/lib/parties";

type Seat = { x: number; y: number; party: PartyId };

const W = 400;
const H = 214;
const CX = W / 2;
const CY = 204;
const R_OUTER = 196;
const R_INNER = 70;

/** Lay seats out on concentric arcs, then hand them to parties left to right by angle. */
function layout(rows: { party: PartyId; seats: number }[]): { seats: Seat[]; r: number } {
  const total = rows.reduce((s, r) => s + r.seats, 0);
  const ROWS = total > 300 ? 12 : 8;
  const step = (R_OUTER - R_INNER) / (ROWS - 1);
  const radii = Array.from({ length: ROWS }, (_, i) => R_INNER + i * step);
  const sumR = radii.reduce((a, b) => a + b, 0);

  const counts = radii.map((r) => Math.floor((total * r) / sumR));
  let left = total - counts.reduce((a, b) => a + b, 0);
  for (let i = ROWS - 1; left > 0; i = (i - 1 + ROWS) % ROWS, left--) counts[i]++;

  const points: { x: number; y: number; a: number }[] = [];
  radii.forEach((r, ri) => {
    const n = counts[ri];
    for (let k = 0; k < n; k++) {
      const a = Math.PI - (Math.PI * k) / Math.max(n - 1, 1);
      // Round: Math.cos/sin can differ in the last digit between Node and the browser,
      // which would make the server-rendered SVG fail to hydrate.
      points.push({ x: Math.round((CX + r * Math.cos(a)) * 100) / 100, y: Math.round((CY - r * Math.sin(a)) * 100) / 100, a });
    }
  });
  points.sort((p, q) => q.a - p.a);

  const owners: PartyId[] = [];
  for (const row of rows) for (let i = 0; i < row.seats; i++) owners.push(row.party);

  return {
    seats: points.map((p, i) => ({ x: p.x, y: p.y, party: owners[i] })),
    r: Math.min(step * 0.42, 5.4),
  };
}

export const Hemicycle = memo(function Hemicycle({
  results,
  showLegend = true,
}: {
  results: { party: PartyId; seats: number }[];
  showLegend?: boolean;
}) {
  const rows = useMemo(() => results.filter((r) => r.seats > 0), [results]);
  const { seats, r } = useMemo(() => layout(rows), [rows]);
  const total = rows.reduce((s, x) => s + x.seats, 0);
  const majority = Math.floor(total / 2) + 1;
  const [focus, setFocus] = useState<PartyId | null>(null);
  const focused = rows.find((x) => x.party === focus);
  const lead = rows[0];

  return (
    <figure className="w-full">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`${total} seats. ${rows.map((x) => `${party(x.party).short} ${x.seats}`).join(", ")}.`}
        >
          {seats.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={r}
              fill={party(s.party).color}
              fillOpacity={focus && focus !== s.party ? 0.14 : 1}
              className="seat"
              style={{ animationDelay: `${(i / seats.length) * 500}ms` }}
              onMouseEnter={() => setFocus(s.party)}
              onMouseLeave={() => setFocus(null)}
            />
          ))}
          <line x1={CX} x2={CX} y1={CY - R_OUTER - 8} y2={CY - R_INNER + 10} stroke="var(--color-fg)" strokeOpacity="0.35" strokeDasharray="2 3" />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center font-mono text-3xl font-medium tracking-tight tabular">
          {focused ? focused.seats : total}
        </div>
      </div>
      <p className="mt-2 min-h-4 text-center text-xs text-fg-3" aria-live="polite">
        {focused ? (
          <span className="text-fg-2">{party(focused.party).name}</span>
        ) : (
          <>
            seats &middot; {majority} for a majority
            {lead && lead.seats < majority && <span className="text-fg-2"> &middot; nobody reached it</span>}
          </>
        )}
      </p>
      {showLegend && (
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs" aria-label="Seats by party">
          {rows.slice(0, 8).map((x) => (
            <li key={x.party}>
              <button
                type="button"
                onMouseEnter={() => setFocus(x.party)}
                onMouseLeave={() => setFocus(null)}
                onFocus={() => setFocus(x.party)}
                onBlur={() => setFocus(null)}
                className="flex min-h-8 items-center gap-1.5 text-fg-2 hover:text-fg"
              >
                <span className="size-2 rounded-full" style={{ background: party(x.party).color }} />
                {party(x.party).short}
                <span className="font-mono text-fg-3 tabular">{x.seats}</span>
              </button>
            </li>
          ))}
          {rows.length > 8 && (
            <li className="text-fg-3">
              +{rows.length - 8} more ({rows.slice(8).reduce((s, x) => s + x.seats, 0)} seats)
            </li>
          )}
        </ul>
      )}
    </figure>
  );
});
