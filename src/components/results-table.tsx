import { previousElection, shareByLineage, type Election } from "@/lib/elections";
import { lineageOf, party } from "@/lib/parties";
import { fmtDelta, fmtInt, fmtPct } from "@/lib/format";

export function ResultsTable({ election, limit }: { election: Election; limit?: number }) {
  const prev = previousElection(election.year);
  const prevShare = prev ? shareByLineage(prev) : null;
  const rows = limit ? election.results.filter((r) => r.party !== "OTHER").slice(0, limit) : election.results;
  const max = election.results[0].pct;

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-line pb-2 text-[11px] uppercase tracking-[0.1em] text-fg-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_5rem_4rem_4.5rem]">
        <span>Party</span>
        <span className="hidden sm:block">Share of valid votes</span>
        <span className="text-right">Share</span>
        <span className="hidden text-right sm:block">Seats</span>
        <span className="hidden text-right sm:block">Change</span>
      </div>
      <ol className="divide-y divide-line">
        {rows.map((r, i) => {
          const p = party(r.party);
          const lin = lineageOf(r.party);
          const before = prevShare ? prevShare[lin] : undefined;
          const delta = prevShare && r.party !== "OTHER" ? r.pct - (before ?? 0) : null;
          const isNew = prevShare && before == null && r.party !== "OTHER";
          return (
            <li
              key={r.party}
              className="rise grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_5rem_4rem_4.5rem]"
              style={{ ["--i" as string]: i }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: p.color }} />
                <div className="min-w-0">
                  <div className="truncate text-sm text-fg">{p.short}</div>
                  <div className="truncate text-xs text-fg-3">
                    {r.party === "OTHER" ? "Combined" : p.name}
                    <span className="sm:hidden"> &middot; {r.seats} seats</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 row-start-2 mt-2 sm:col-span-1 sm:row-start-auto sm:mt-0">
                <div className="h-2 w-full rounded-full bg-panel-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${Math.max((r.pct / max) * 100, 0.6)}%`, background: p.color }}
                  />
                </div>
                <div className="mt-1 font-mono text-[11px] text-fg-3 tabular">{fmtInt(r.votes)} votes</div>
              </div>
              <div className="text-right font-mono text-sm text-fg tabular">{fmtPct(r.pct, r.pct < 1 ? 2 : 1)}</div>
              <div className="hidden text-right font-mono text-sm text-fg-2 tabular sm:block">{r.seats || "–"}</div>
              <div className="hidden text-right font-mono text-xs tabular sm:block">
                {isNew ? (
                  <span className="rounded bg-signal/10 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-signal">New</span>
                ) : delta == null || Math.abs(delta) < 0.05 ? (
                  <span className="text-fg-3">{delta == null ? "–" : "±0.0"}</span>
                ) : (
                  <span className={delta >= 0 ? "text-fg" : "text-fg-3"}>
                    {delta >= 0 ? "▲" : "▼"} {fmtDelta(delta).replace(/^[+−]/, "")}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {prev && (
        <p className="mt-3 text-xs text-fg-3">
          Change is in percentage points against {prev.year}. Predecessor parties are counted together (DP into DA, NP into NNP, FF into FF Plus).
        </p>
      )}
    </div>
  );
}
