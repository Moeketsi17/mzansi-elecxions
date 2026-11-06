import { Suspense } from "react";
import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { LgeLiveBoard } from "@/components/lge/lge-live-board";
import { LiveSkeleton } from "@/components/lge/live-skeleton";
import { LiveRefresh } from "@/components/lge/live-refresh";
import { CouncilMap } from "@/components/map/council-map";
import { CURRENT_LGE, getLgeYear, lineageShares, previousLgeYear, snapshotYear } from "@/lib/lge";

export const metadata: Metadata = { title: "Live results" };

export default function LivePage() {
  return (
    <>
      <PageIntro eyebrow="Live" title={`${CURRENT_LGE} local elections, as they are counted`}>
        Results come straight from the Electoral Commission&rsquo;s results feed as each voting district is captured. This page checks for
        new figures every minute, so you can leave it open.
      </PageIntro>
      <div className="mx-auto max-w-[1400px] border-t border-line px-4 py-12 md:px-8">
        <Suspense fallback={<LiveSkeleton />}>
          <Board />
        </Suspense>
      </div>
    </>
  );
}

async function Board() {
  const result = await getLgeYear(CURRENT_LGE);
  if (!result)
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
        <p className="text-sm text-fg-2">The IEC has not published any {CURRENT_LGE} results yet.</p>
        <p className="mt-1 text-xs text-fg-3">Results appear here as soon as the first voting district is captured.</p>
      </div>
    );
  const prevYear = previousLgeYear(CURRENT_LGE)!;
  const live = !result.data.complete;
  return (
    <>
      {live && <LiveRefresh />}
      <LgeLiveBoard initial={result} previous={lineageShares(snapshotYear(prevYear))} previousYear={prevYear} />
      <section className="mt-16 border-t border-line pt-12">
        <h2 className="mb-1 text-xl tracking-tight">The count on the map</h2>
        <p className="mb-6 max-w-[70ch] text-sm text-fg-3">
          Faded councils are still counting. Click a province, then a council, to watch its wards come in.
        </p>
        <CouncilMap year={CURRENT_LGE} municipalities={result.data.municipalities} live={live} />
      </section>
    </>
  );
}
