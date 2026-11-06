import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { NewsTimeline } from "@/components/news-timeline";
import { EVENTS } from "@/lib/events";

export const metadata: Metadata = { title: "News timeline" };

export default function TimelinePage() {
  const corruption = EVENTS.filter((e) => e.category === "corruption").length;
  return (
    <>
      <PageIntro
        eyebrow="News timeline"
        title="What happened between the votes"
        aside={
          <dl className="flex gap-10">
            <div>
              <dt className="text-xs text-fg-3">Events</dt>
              <dd className="font-mono text-3xl tracking-tight tabular">{EVENTS.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-3">Corruption</dt>
              <dd className="font-mono text-3xl tracking-tight tabular">{corruption}</dd>
            </div>
          </dl>
        }
      >
        Scandals, leadership fights, power cuts and unrest since 1994, grouped by the election that followed them. Each event
        shows how the vote moved next time.
      </PageIntro>
      <div className="mx-auto max-w-[1400px] border-t border-line px-4 py-14 md:px-8">
        <NewsTimeline />
      </div>
    </>
  );
}
