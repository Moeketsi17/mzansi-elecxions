import type { LgeYear } from "@/lib/lge-core";
import { lineageOf, partyOr } from "@/lib/parties";
import { fmtDelta, fmtInt, fmtPct } from "@/lib/format";

export function LgeResultsTable({
  year,
  previous,
  previousYear,
}: {
  year: LgeYear;
  previous?: Record<string, number>;
  previousYear?: number;
}) {
  const rows = year.parties.filter((p) => p.votes > 0);
  const max = rows.find((r) => r.id !== "OTHER")?.pct || 1;
  const cols = "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.8fr)_4.5rem_4.5rem_4.5rem_4.5rem]";

  return (
    <div>
      <div className={`grid ${cols} gap-x-4 border-b border-line pb-2 text-[11px] uppercase tracking-[0.1em] text-fg-3`}>
        <span>Party</span>
        <span className="hidden sm:block">Share of ballots</span>
        <span className="text-right">Share</span>
        <span className="hidden text-right sm:block">{previousYear ? `vs ${previousYear}` : "Change"}</span>
        <span className="hidden text-right sm:block">Seats</span>
        <span className="hidden text-right sm:block" title="Councils where the party won an outright majority">
          Councils
        </span>
      </div>
      <ol className="divide-y divide-line">
        {rows.map((r, i) => {
          const p = partyOr(r.id, r.name);
          const before = previous?.[lineageOf(r.id)];
          return (
            <li key={r.id} className={`rise grid ${cols} items-center gap-x-4 py-3`} style={{ ["--i" as string]: i }}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: p.color }} />
                <div className="min-w-0">
                  <div className="truncate text-sm text-fg">{r.id === "OTHER" ? "Other parties" : p.short}</div>
                  <div className="truncate text-xs text-fg-3">
                    {r.id === "OTHER" ? "Combined by the IEC" : p.name !== p.short ? p.name : ""}
                    <span className="sm:hidden"> · {fmtInt(r.seats)} seats</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 row-start-2 mt-2 sm:col-span-1 sm:row-start-auto sm:mt-0">
                <div className="h-2 rounded-full bg-panel-2">
                  <div className="h-2 rounded-full" style={{ width: `${Math.max((r.pct / max) * 100, 0.6)}%`, background: p.color }} />
                </div>
                <div className="mt-1 font-mono text-[11px] text-fg-3 tabular">{fmtInt(r.votes)} ballots</div>
              </div>
              <div className="text-right font-mono text-sm tabular">{fmtPct(r.pct, r.pct < 1 ? 2 : 1)}</div>
              <div className="hidden text-right font-mono text-xs tabular sm:block">
                {r.id === "OTHER" || !previous ? (
                  <span className="text-fg-3">–</span>
                ) : before == null ? (
                  <span className="rounded bg-signal/10 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-signal">New</span>
                ) : (
                  <span className={r.pct >= before ? "text-fg" : "text-fg-3"}>{fmtDelta(r.pct - before)}</span>
                )}
              </div>
              <div className="hidden text-right font-mono text-sm text-fg-2 tabular sm:block">{fmtInt(r.seats)}</div>
              <div className="hidden text-right font-mono text-sm text-fg-2 tabular sm:block">{r.majorityWon || "–"}</div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-fg-3">
        Share is of all ward, proportional and district ballots, as the IEC reports it. &ldquo;Councils&rdquo; counts councils where the
        party won more than half the seats.
        {previous && " Change is in percentage points."}
      </p>
    </div>
  );
}
