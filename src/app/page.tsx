import { Suspense } from "react";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Hemicycle } from "@/components/charts/hemicycle";
import { TrendChart } from "@/components/charts/trend-chart";
import { TurnoutChart } from "@/components/charts/turnout-chart";
import { ELECTIONS, LATEST, shareByLineage } from "@/lib/elections";
import { CATEGORIES, formatEventDate, sortedEvents } from "@/lib/events";
import { party } from "@/lib/parties";
import { fmtPct } from "@/lib/format";
import { CURRENT_LGE, getLgeYear } from "@/lib/lge";
import { partyOr } from "@/lib/parties";
import { reportTime } from "@/components/lge/report-time";

export default function Home() {
  const peak = ELECTIONS.reduce((a, b) => (shareByLineage(b).ANC > shareByLineage(a).ANC ? b : a));
  const recent = sortedEvents().slice(0, 4);
  const anc = LATEST.results[0];

  return (
    <>
      <Suspense fallback={null}>
        <LiveBanner />
      </Suspense>

      {/* Hero: split, text left, live parliament right */}
      <section className="mx-auto grid max-w-[1400px] gap-12 px-4 pb-16 pt-12 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div className="flex flex-col justify-center">
          <p className="rise mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-3">
            <span className="h-px w-8 bg-fg-3" /> South Africa &middot; National Assembly &middot; 1994 to {LATEST.year}
          </p>
          <h1 className="rise text-4xl font-medium leading-[1.02] tracking-tighter md:text-6xl" style={{ ["--i" as string]: 1 }}>
            Thirty years of votes,
            <br />
            <span className="text-fg-2">in one view.</span>
          </h1>
          <p className="rise mt-6 max-w-[52ch] text-base leading-relaxed text-fg-2" style={{ ["--i" as string]: 2 }}>
            Every general election since 1994, the seats each party won, how turnout has fallen, and the scandals, recalls and
            crises that happened between one vote and the next.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ ["--i" as string]: 3 }}>
            <Link
              href={`/elections/${LATEST.year}`}
              className="group flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-medium text-ink transition hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]"
            >
              See the {LATEST.year} results
              <ArrowRightIcon size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/trends"
              className="rounded-full border border-line-strong px-5 py-3 text-sm text-fg transition hover:bg-panel active:scale-[0.98]"
            >
              How the vote changed
            </Link>
          </div>

          <dl className="rise mt-14 grid grid-cols-3 gap-6 border-t border-line pt-6" style={{ ["--i" as string]: 4 }}>
            <div>
              <dt className="text-xs text-fg-3">ANC in {LATEST.year}</dt>
              <dd className="mt-1 font-mono text-2xl tracking-tight tabular">{fmtPct(anc.pct)}</dd>
              <dd className="text-[11px] text-fg-3">down from {fmtPct(shareByLineage(peak).ANC)} in {peak.year}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-3">Turnout</dt>
              <dd className="mt-1 font-mono text-2xl tracking-tight tabular">{fmtPct(LATEST.turnout)}</dd>
              <dd className="text-[11px] text-fg-3">of registered voters</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-3">Parties in Parliament</dt>
              <dd className="mt-1 font-mono text-2xl tracking-tight tabular">{LATEST.results.filter((r) => r.seats > 0).length}</dd>
              <dd className="text-[11px] text-fg-3">after the {LATEST.year} vote</dd>
            </div>
          </dl>
        </div>

        <div className="rise relative" style={{ ["--i" as string]: 2 }}>
          <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-9">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-fg-3">National Assembly, {LATEST.year}</p>
                <p className="mt-1 text-lg tracking-tight">{LATEST.headline}</p>
              </div>
              <Link href={`/elections/${LATEST.year}`} aria-label={`Open ${LATEST.year} results`} className="rounded-full border border-line p-2 text-fg-2 transition hover:text-fg">
                <ArrowUpRightIcon size={16} />
              </Link>
            </div>
            <Hemicycle results={LATEST.results} />
          </div>
        </div>
      </section>

      {/* Trend */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
          <div className="mb-10 grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-fg-3">Vote share, 1994 to {LATEST.year}</p>
              <h2 className="mt-2 text-3xl tracking-tight md:text-4xl">The long slide from two-thirds to a coalition</h2>
            </div>
            <p className="max-w-[60ch] text-sm leading-relaxed text-fg-2 md:justify-self-end">
              Each line is a party&rsquo;s share of the national ballot. The ticks under the chart are news events. Hover one to see
              what happened, then compare it with the next election. Turn parties on and off with the buttons.
            </p>
          </div>
          <TrendChart />
        </div>
      </section>

      {/* Asymmetric: turnout + latest news */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-fg-3">Turnout</p>
            <h2 className="mt-2 text-2xl tracking-tight md:text-3xl">Fewer registered voters show up each time</h2>
            <p className="mb-8 mt-3 max-w-[48ch] text-sm leading-relaxed text-fg-2">
              Turnout peaked at 89% in 1999. In {LATEST.year}, fewer than six in ten registered voters cast a ballot.
            </p>
            <TurnoutChart />
          </div>

          <div>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-fg-3">News timeline</p>
                <h2 className="mt-2 text-2xl tracking-tight md:text-3xl">The latest events</h2>
              </div>
              <Link href="/timeline" className="group flex items-center gap-1.5 text-sm text-fg-2 hover:text-fg">
                Full timeline <ArrowRightIcon size={14} className="transition group-hover:translate-x-0.5" />
              </Link>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {recent.map((ev, i) => (
                <li key={ev.id} className="rise" style={{ ["--i" as string]: i }}>
                  <Link href={`/timeline#${ev.id}`} className="group grid gap-1 py-5 sm:grid-cols-[7rem_1fr_auto] sm:items-baseline sm:gap-6">
                    <time dateTime={ev.date} className="font-mono text-xs text-fg-3">
                      {formatEventDate(ev)}
                    </time>
                    <div>
                      <div className="text-[15px] text-fg transition group-hover:text-signal">{ev.title}</div>
                      <div className="mt-1 line-clamp-2 max-w-[60ch] text-sm text-fg-3">{ev.summary}</div>
                    </div>
                    <span className="hidden text-[10px] uppercase tracking-[0.1em] text-fg-3 sm:block">{CATEGORIES[ev.category].label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Election rail */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-2xl tracking-tight md:text-3xl">Pick an election</h2>
            <Link href="/elections" className="text-sm text-fg-2 hover:text-fg">
              All elections
            </Link>
          </div>
          <ol className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-7 md:overflow-visible md:px-0">
            {[...ELECTIONS].reverse().map((e) => {
              const w = e.results[0];
              return (
                <li key={e.year} className="w-44 shrink-0 snap-start md:w-auto">
                  <Link
                    href={`/elections/${e.year}`}
                    className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-line-strong active:scale-[0.98]"
                  >
                    <span className="font-mono text-2xl tracking-tight">{e.year}</span>
                    <span>
                      <span className="mb-2 flex h-1.5 gap-[2px] overflow-hidden rounded-full">
                        {e.results.slice(0, 6).map((r) => (
                          <span key={r.party} style={{ width: `${r.pct}%`, background: party(r.party).color }} />
                        ))}
                      </span>
                      <span className="block text-xs text-fg-2">
                        {party(w.party).short} {fmtPct(w.pct)}
                      </span>
                      <span className="block text-[11px] text-fg-3">{fmtPct(e.turnout)} turnout</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}

/** Shown while a local election is being counted. */
async function LiveBanner() {
  const result = await getLgeYear(CURRENT_LGE);
  if (!result || result.data.complete) return null;
  const d = result.data;
  const pct = (d.progress.districts.done / Math.max(d.progress.districts.total, 1)) * 100;
  const leaders = d.parties.filter((p) => p.id !== "OTHER").slice(0, 3);
  return (
    <div className="border-b border-line bg-panel">
      <Link
        href="/live"
        className="group mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm md:px-8"
      >
        <span className="flex items-center gap-2 text-fg">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-live" />
          </span>
          Local elections {d.year} &middot; counting live
        </span>
        <span className="font-mono text-xs text-fg-2 tabular">{pct.toFixed(1)}% of voting districts in</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-2">
          {leaders.map((p) => {
            const meta = partyOr(p.id, p.name);
            return (
              <span key={p.id} className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
                {meta.short} <span className="font-mono text-fg tabular">{fmtPct(p.pct)}</span>
              </span>
            );
          })}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-fg-3 group-hover:text-fg">
          <span className="hidden sm:inline">IEC update {reportTime(d.reportDate)}</span>
          Follow the count <ArrowRightIcon size={13} className="transition group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  );
}
