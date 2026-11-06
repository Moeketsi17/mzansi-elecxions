import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { TrendChart } from "@/components/charts/trend-chart";
import { SeatStack } from "@/components/charts/seat-stack";
import { TurnoutChart } from "@/components/charts/turnout-chart";
import { ELECTIONS, shareByLineage } from "@/lib/elections";
import { party, TRACKED } from "@/lib/parties";
import { fmtDelta } from "@/lib/format";

export const metadata: Metadata = { title: "How the vote changed" };

export default function TrendsPage() {
  const swings = ELECTIONS.slice(1).map((e, i) => {
    const a = shareByLineage(ELECTIONS[i]);
    const b = shareByLineage(e);
    return { year: e.year, from: ELECTIONS[i].year, d: Object.fromEntries(TRACKED.map((p) => [p, (b[p] ?? 0) - (a[p] ?? 0)])) };
  });
  const cols = TRACKED.filter((p) => p !== "NNP");

  return (
    <>
      <PageIntro eyebrow="Trends" title={<>How South Africa&rsquo;s vote has changed</>}>
        Thirty years of national results side by side. Start with the vote-share lines, then see how seats and turnout moved with
        them.
      </PageIntro>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-8">
          <h2 className="mb-1 text-xl tracking-tight">Share of the national vote</h2>
          <p className="mb-8 text-sm text-fg-3">
            Predecessors are joined to their successors: DP to DA, NP to NNP, FF to FF Plus.
          </p>
          <TrendChart height={460} />
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-8">
          <h2 className="mb-1 text-xl tracking-tight">Swing between elections</h2>
          <p className="mb-6 text-sm text-fg-3">Change in vote share, in percentage points. The biggest move in each row is highlighted.</p>
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Percentage point swing by party between consecutive elections</caption>
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.1em] text-fg-3">
                  <th scope="col" className="py-2 pr-4 font-normal">Election</th>
                  {cols.map((p) => (
                    <th key={p} scope="col" className="px-3 py-2 text-right font-normal">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full" style={{ background: party(p).color }} />
                        {party(p).short}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {swings.map((s) => {
                  const biggest = cols.reduce((m, p) => (Math.abs(s.d[p]) > Math.abs(s.d[m]) ? p : m), cols[0]);
                  return (
                    <tr key={s.year}>
                      <th scope="row" className="py-3 pr-4 text-left font-mono font-normal text-fg-2">
                        {s.from} <span className="text-fg-3">to</span> {s.year}
                      </th>
                      {cols.map((p) => {
                        const v = s.d[p];
                        const zero = Math.abs(v) < 0.05;
                        return (
                          <td key={p} className="px-3 py-3 text-right font-mono tabular">
                            <span
                              className={`rounded px-1.5 py-0.5 ${
                                p === biggest ? "bg-signal/10 text-signal" : zero ? "text-fg-3/50" : v > 0 ? "text-fg" : "text-fg-3"
                              }`}
                            >
                              {zero ? "·" : fmtDelta(v)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-4 py-14 md:px-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-1 text-xl tracking-tight">Seats over time</h2>
            <p className="mb-6 text-sm text-fg-3">400 seats in the National Assembly. Hover a block for the count.</p>
            <SeatStack />
          </div>
          <div>
            <h2 className="mb-1 text-xl tracking-tight">Turnout</h2>
            <p className="mb-6 text-sm text-fg-3">Votes cast as a share of registered voters.</p>
            <TurnoutChart height={240} />
          </div>
        </div>
      </section>
    </>
  );
}
