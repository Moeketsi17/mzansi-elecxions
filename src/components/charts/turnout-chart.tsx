"use client";

import { useState } from "react";
import { ELECTIONS } from "@/lib/elections";
import { fmtInt, fmtMillions, fmtPct } from "@/lib/format";

/** Turnout as a share of registered voters, one bar per election. One axis only. */
export function TurnoutChart({ height = 220 }: { height?: number }) {
  const [focus, setFocus] = useState<number | null>(null);
  const f = ELECTIONS.find((e) => e.year === focus) ?? ELECTIONS[ELECTIONS.length - 1];

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <div className="font-mono text-2xl tracking-tight text-fg tabular">{fmtPct(f.turnout)}</div>
          <div className="text-xs text-fg-3">
            {f.year} turnout
            {f.registered ? ` · ${fmtMillions(f.cast)} of ${fmtMillions(f.registered)} registered voters` : ` · ${fmtMillions(f.cast)} votes cast`}
          </div>
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <div className="absolute inset-x-0 border-t border-dashed border-line-strong" style={{ bottom: "50%" }}>
          <span className="absolute -top-4 right-0 text-[10px] text-fg-3">50%</span>
        </div>
        <ul className="relative grid h-full grid-cols-7 items-end gap-1.5 sm:gap-3" aria-label="Turnout by election">
          {ELECTIONS.map((e, i) => {
            const active = f.year === e.year;
            return (
              <li key={e.year} className="flex h-full flex-col justify-end">
                <button
                  type="button"
                  onMouseEnter={() => setFocus(e.year)}
                  onFocus={() => setFocus(e.year)}
                  onClick={() => setFocus(e.year)}
                  aria-label={`${e.year}: ${fmtPct(e.turnout)} turnout, ${fmtInt(e.cast)} votes cast`}
                  className="group flex h-full flex-col justify-end"
                >
                  <span
                    className="rise block w-full rounded-t-[4px] transition-colors"
                    style={{
                      height: `${e.turnout}%`,
                      ["--i" as string]: i,
                      background: active ? "var(--color-signal)" : "rgb(169 171 179 / 0.28)",
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-3">
        {ELECTIONS.map((e) => (
          <span key={e.year} className={`text-center font-mono text-[10px] ${f.year === e.year ? "text-fg" : "text-fg-3"}`}>
            {e.year}
          </span>
        ))}
      </div>
      {f.turnoutNote && <p className="mt-3 text-xs text-fg-3">{f.turnoutNote}</p>}
    </div>
  );
}
