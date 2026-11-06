import Link from "next/link";
import type { LgeYear } from "@/lib/lge-core";
import { fmtInt } from "@/lib/format";

/** Majority versus hung councils at each local election. */
export function CouncilsOverTime({ years }: { years: LgeYear[] }) {
  return (
    <div className="space-y-3">
      {years.map((y) => {
        const counting = Math.max(y.progress.councils.total - y.progress.councils.done, 0);
        const total = y.councils.majority + y.councils.hung + counting || 1;
        const hungShare = (y.councils.hung / Math.max(y.councils.majority + y.councils.hung, 1)) * 100;
        return (
          <div key={y.year} className="grid grid-cols-[3rem_1fr] items-center gap-3 sm:grid-cols-[3.5rem_1fr_10rem]">
            <Link href={`/local/${y.year}`} className="font-mono text-xs text-fg-2 hover:text-fg">
              {y.year}
            </Link>
            <div className="flex h-6 gap-[2px]" role="img" aria-label={`${y.year}: ${y.councils.majority} majority, ${y.councils.hung} hung${counting ? `, ${counting} counting` : ""}`}>
              <span className="h-full rounded-l-[4px] bg-fg-2" style={{ width: `${(y.councils.majority / total) * 100}%` }} />
              <span
                className="h-full bg-[repeating-linear-gradient(135deg,var(--color-fg-3)_0_2px,transparent_2px_6px)] ring-1 ring-inset ring-fg-3/60"
                style={{ width: `${(y.councils.hung / total) * 100}%` }}
              />
              {counting > 0 && <span className="h-full rounded-r-[4px] bg-panel-2 ring-1 ring-inset ring-line-strong" style={{ width: `${(counting / total) * 100}%` }} />}
            </div>
            <div className="col-start-2 text-xs text-fg-3 sm:col-start-auto">
              <span className="font-mono text-fg tabular">{fmtInt(y.councils.hung)}</span> hung
              <span className="text-fg-3"> ({hungShare.toFixed(0)}% of declared)</span>
              {counting > 0 && <span className="block text-[11px] text-signal/80">{counting} still counting</span>}
            </div>
          </div>
        );
      })}
      <ul className="flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-fg-2">
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-fg-2" /> Majority</li>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-[repeating-linear-gradient(135deg,var(--color-fg-3)_0_2px,transparent_2px_6px)] ring-1 ring-inset ring-fg-3/60" /> Hung</li>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-panel-2 ring-1 ring-inset ring-line-strong" /> Still counting</li>
      </ul>
    </div>
  );
}
