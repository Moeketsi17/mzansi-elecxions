import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { PageIntro } from "@/components/page-intro";
import { ELECTIONS, previousElection, shareByLineage } from "@/lib/elections";
import { party } from "@/lib/parties";
import { fmtDate, fmtDelta, fmtPct } from "@/lib/format";

export const metadata: Metadata = { title: "All elections" };

export default function ElectionsIndex() {
  const list = [...ELECTIONS].reverse();
  return (
    <>
      <PageIntro eyebrow="Elections" title="Seven national elections since 1994">
        Choose a year for full results, seats and the story of that vote. 2009 and 2014 also break down by province and
        municipality.
      </PageIntro>

      <div className="mx-auto max-w-[1400px] px-4 pb-24 md:px-8">
        <ol className="divide-y divide-line border-y border-line">
          {list.map((e, i) => {
            const prev = previousElection(e.year);
            const ancNow = shareByLineage(e).ANC;
            const ancDelta = prev ? ancNow - shareByLineage(prev).ANC : null;
            return (
              <li key={e.year} className="rise" style={{ ["--i" as string]: i }}>
                <Link
                  href={`/elections/${e.year}`}
                  className="group grid grid-cols-1 gap-4 py-7 transition-colors md:grid-cols-[8rem_minmax(0,1.5fr)_minmax(0,1fr)_2rem] md:items-center md:gap-10"
                >
                  <div>
                    <div className="font-mono text-4xl tracking-tighter transition group-hover:text-signal">{e.year}</div>
                    <div className="text-xs text-fg-3">{fmtDate(e.date)}</div>
                  </div>
                  <div>
                    <div className="text-lg tracking-tight text-fg">{e.headline}</div>
                    <p className="mt-1 line-clamp-2 max-w-[65ch] text-sm text-fg-3">{e.summary}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
                      {e.results.map((r) => (
                        <span key={r.party} style={{ width: `${r.pct}%`, background: party(r.party).color }} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-2">
                      <span>
                        ANC <span className="font-mono tabular">{fmtPct(ancNow)}</span>
                        {ancDelta != null && <span className="font-mono text-fg-3 tabular"> ({fmtDelta(ancDelta)})</span>}
                      </span>
                      <span>
                        Turnout <span className="font-mono tabular">{fmtPct(e.turnout)}</span>
                      </span>
                      {e.regional && <span className="text-signal/80">Province detail</span>}
                    </div>
                  </div>
                  <ArrowRightIcon size={18} className="hidden text-fg-3 transition group-hover:translate-x-1 group-hover:text-fg md:block" />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
