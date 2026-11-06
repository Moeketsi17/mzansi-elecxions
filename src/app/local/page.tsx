import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { TrendChart } from "@/components/charts/trend-chart";
import { LgeLiveBoard } from "@/components/lge/lge-live-board";
import { CouncilsOverTime } from "@/components/lge/councils-over-time";
import { LiveSkeleton } from "@/components/lge/live-skeleton";
import {
  CURRENT_LGE,
  getLgeYear,
  LGE_DATES,
  LGE_YEARS,
  lgeTrend,
  lineageShares,
  previousLgeYear,
  snapshotYear,
  type LgeYear,
} from "@/lib/lge";
import { LGE_COPY } from "@/lib/lge-copy";
import { LGE_TRACKED, partyOr } from "@/lib/parties";
import { fmtDate, fmtPct } from "@/lib/format";

export const metadata: Metadata = { title: "Local elections" };

export default function LocalPage() {
  const past = LGE_YEARS.filter((y) => y !== CURRENT_LGE).map((y) => snapshotYear(y)!);
  return (
    <>
      <PageIntro eyebrow="Local government elections" title="Who runs your council">
        Every local election since 2000: party support, which councils one party controls, which are hung, and every ward winner. The{" "}
        {CURRENT_LGE} count updates live from the IEC.
      </PageIntro>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
          <Suspense fallback={<LiveSkeleton />}>
            <LiveSection />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-8">
          <h2 className="mb-1 text-xl tracking-tight">Local vote share since 2000</h2>
          <p className="mb-8 text-sm text-fg-3">Share of all ballots in each local election. Hollow markers are still being counted.</p>
          <Suspense fallback={<div className="skeleton h-[420px]" />}>
            <LiveTrend />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-4 py-14 md:px-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="mb-1 text-xl tracking-tight">More councils without a majority</h2>
            <p className="mb-6 max-w-[48ch] text-sm text-fg-3">
              A hung council needs a coalition to elect a mayor and pass a budget. Their number has grown with almost every election.
            </p>
            <Suspense fallback={<div className="skeleton h-56" />}>
              <LiveCouncils past={past} />
            </Suspense>
          </div>
          <div>
            <h2 className="mb-6 text-xl tracking-tight">Choose an election</h2>
            <ol className="divide-y divide-line border-y border-line">
              {[...LGE_YEARS].reverse().map((year) => {
                const y = snapshotYear(year);
                const lead = y?.parties[0];
                return (
                  <li key={year}>
                    <Link href={`/local/${year}`} className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-4">
                      <span className="font-mono text-2xl tracking-tight transition group-hover:text-signal">{year}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-fg">{LGE_COPY[year].headline}</span>
                        <span className="block text-xs text-fg-3">{fmtDate(LGE_DATES[year])}</span>
                      </span>
                      <span className="text-right text-xs text-fg-2">
                        {year === CURRENT_LGE && y && !y.complete ? (
                          <span className="rounded-full bg-live/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-live">Live</span>
                        ) : (
                          lead && (
                            <>
                              {partyOr(lead.id, lead.name).short} <span className="font-mono tabular">{fmtPct(lead.pct)}</span>
                            </>
                          )
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}

async function LiveSection() {
  const result = await getLgeYear(CURRENT_LGE);
  if (!result) return <p className="text-sm text-fg-3">Results for {CURRENT_LGE} are not available yet.</p>;
  const prevYear = previousLgeYear(CURRENT_LGE)!;
  return (
    <>
      <h2 className="mb-6 text-2xl tracking-tight md:text-3xl">
        {result.data.complete ? `${CURRENT_LGE} final results` : `${CURRENT_LGE}: counting now`}
      </h2>
      <LgeLiveBoard initial={result} previous={lineageShares(snapshotYear(prevYear))} previousYear={prevYear} variant="compact" />
    </>
  );
}

async function LiveTrend() {
  const result = await getLgeYear(CURRENT_LGE);
  return (
    <TrendChart
      points={lgeTrend(result?.data)}
      parties={LGE_TRACKED}
      defaultOn={["ANC", "DA", "EFF", "MK", "IFP", "ASA"]}
      provisionalYear={result && !result.data.complete ? CURRENT_LGE : undefined}
      label={`Local election vote share by party, 2000 to ${CURRENT_LGE}`}
    />
  );
}

async function LiveCouncils({ past }: { past: LgeYear[] }) {
  const result = await getLgeYear(CURRENT_LGE);
  return <CouncilsOverTime years={result ? [...past, result.data] : past} />;
}
