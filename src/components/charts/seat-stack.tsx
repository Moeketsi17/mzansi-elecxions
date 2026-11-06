"use client";

import { useState } from "react";
import Link from "next/link";
import { ELECTIONS } from "@/lib/elections";
import { party, TRACKED, type PartyId } from "@/lib/parties";

type Seg = { id: PartyId; seats: number; color: string; label: string };

/** National Assembly seats per election as 400-seat bars, tracked parties first, minor parties grouped. */
function segments(year: number): Seg[] {
  const e = ELECTIONS.find((x) => x.year === year)!;
  const groups = new Map<PartyId, number>();
  for (const r of e.results) {
    if (!r.seats) continue;
    const lin = party(r.party).lineage ?? r.party;
    const key = TRACKED.includes(lin) ? r.party : "OTHER";
    groups.set(key, (groups.get(key) ?? 0) + r.seats);
  }
  return [...groups.entries()]
    .map(([id, seats]) => ({
      id,
      seats,
      color: party(id).color,
      label: id === "OTHER" ? "Smaller parties" : party(id).short,
    }))
    .sort((a, b) => (a.id === "OTHER" ? 1 : b.id === "OTHER" ? -1 : b.seats - a.seats));
}

export function SeatStack() {
  const [hover, setHover] = useState<{ year: number; id: PartyId } | null>(null);

  return (
    <div className="space-y-2.5">
      {ELECTIONS.map((e, i) => {
        const segs = segments(e.year);
        const total = segs.reduce((s, x) => s + x.seats, 0);
        const h = hover?.year === e.year ? segs.find((s) => s.id === hover.id) : null;
        return (
          <div key={e.year} className="rise grid grid-cols-[3rem_1fr] items-center gap-3 sm:grid-cols-[3.5rem_1fr_9rem]" style={{ ["--i" as string]: i }}>
            <Link href={`/elections/${e.year}`} className="font-mono text-xs text-fg-2 hover:text-fg">
              {e.year}
            </Link>
            <div className="relative flex h-7 gap-[2px]" onMouseLeave={() => setHover(null)}>
              {segs.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onMouseEnter={() => setHover({ year: e.year, id: s.id })}
                  onFocus={() => setHover({ year: e.year, id: s.id })}
                  aria-label={`${e.year}: ${s.label} ${s.seats} seats`}
                  className="h-full first:rounded-l-[4px] last:rounded-r-[4px] transition-opacity"
                  style={{
                    width: `${(s.seats / total) * 100}%`,
                    background: s.color,
                    opacity: hover?.year === e.year && hover.id !== s.id ? 0.35 : 1,
                  }}
                />
              ))}
              <span className="pointer-events-none absolute inset-y-[-3px] left-1/2 w-px bg-fg/60" aria-hidden />
            </div>
            <div className="col-start-2 text-xs text-fg-3 sm:col-start-auto">
              {h ? (
                <span className="text-fg">
                  {h.label} <span className="font-mono tabular">{h.seats}</span>
                </span>
              ) : (
                <span>
                  {segs[0].label} <span className="font-mono tabular">{segs[0].seats}</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
      <p className="pt-2 text-xs text-fg-3">The white tick marks 200 seats. A majority needs 201.</p>
    </div>
  );
}
