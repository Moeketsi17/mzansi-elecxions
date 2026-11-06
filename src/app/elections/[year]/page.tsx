import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapTrifoldIcon } from "@phosphor-icons/react/ssr";
import { Suspense } from "react";
import { YearNav } from "@/components/year-nav";
import { Hemicycle } from "@/components/charts/hemicycle";
import { ResultsTable } from "@/components/results-table";
import { ProvinceExplorer } from "@/components/province-explorer";
import { ELECTIONS, getElection, previousElection, YEARS, type Election } from "@/lib/elections";
import { CATEGORIES, EVENTS, formatEventDate } from "@/lib/events";
import { fmtDate, fmtInt, fmtPct } from "@/lib/format";

export function generateStaticParams() {
  return ELECTIONS.map((e) => ({ year: String(e.year) }));
}

export async function generateMetadata({ params }: PageProps<"/elections/[year]">): Promise<Metadata> {
  const { year } = await params;
  const e = getElection(Number(year));
  return e ? { title: `${e.year} general election`, description: e.summary } : {};
}

export default function ElectionPage({ params }: PageProps<"/elections/[year]">) {
  // Reading params happens inside Suspense so navigations render the shell instantly.
  return (
    <Suspense fallback={<ElectionSkeleton />}>
      <Election params={params} />
    </Suspense>
  );
}

function ElectionSkeleton() {
  return (
    <div aria-hidden>
      <div className="border-b border-line px-4 py-3 md:px-8">
        <div className="skeleton mx-auto h-9 max-w-[1400px]" />
      </div>
      <div className="mx-auto max-w-[1400px] space-y-4 px-4 pb-10 pt-10 md:px-8">
        <div className="skeleton h-3 w-56" />
        <div className="skeleton h-12 w-3/4 max-w-xl" />
        <div className="skeleton h-4 w-full max-w-2xl" />
      </div>
    </div>
  );
}

async function Election({ params }: Pick<PageProps<"/elections/[year]">, "params">) {
  const { year } = await params;
  const election = getElection(Number(year));
  if (!election) notFound();

  const prev = previousElection(election.year);
  const lead = election.results[0];
  const before = EVENTS.filter((ev) => ev.date < election.date && (!prev || ev.date > prev.date) && ev.category !== "election").sort(
    (a, b) => b.date.localeCompare(a.date),
  );

  return (
    <>
      <YearNav years={YEARS} current={election.year} href={(y) => `/elections/${y}`} label="Election year" />

      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-12 pt-10 md:px-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="rise mb-4 text-xs uppercase tracking-[0.16em] text-fg-3">General election &middot; {fmtDate(election.date)}</p>
          <h1 className="rise text-4xl font-medium leading-[1.04] tracking-tighter md:text-5xl" style={{ ["--i" as string]: 1 }}>
            {election.headline}
          </h1>
          <p className="rise mt-5 max-w-[62ch] text-base leading-relaxed text-fg-2" style={{ ["--i" as string]: 2 }}>
            {election.summary}
          </p>
        </div>
        <dl className="rise grid grid-cols-3 gap-4 border-t sm:gap-6 border-line pt-5 lg:border-t-0 lg:pt-0" style={{ ["--i" as string]: 3 }}>
          <Stat label="Turnout" value={fmtPct(election.turnout)} hint={election.registered ? "of registered" : "estimated"} />
          <Stat label="Votes cast" value={`${(election.cast / 1e6).toFixed(2)}m`} hint={`${fmtInt(election.valid)} valid`} />
          <Stat
            label="Largest party"
            value={fmtPct(lead.pct)}
            hint={lead.seats >= 201 ? `${lead.seats} seats, majority` : `${lead.seats} seats, short of 201`}
          />
        </dl>
      </div>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 md:px-8 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <h2 className="mb-6 text-xl tracking-tight">National ballot results</h2>
            <ResultsTable election={election} />
            <p className="mt-2 text-xs text-fg-3">Source: {election.source}.</p>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="mb-6 text-xl tracking-tight">Seats in the National Assembly</h2>
            <Hemicycle results={election.results} />
          </div>
        </div>
      </section>

      {before.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:px-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-xl tracking-tight">What happened before this vote</h2>
              <p className="mt-2 max-w-[40ch] text-sm text-fg-3">
                News {prev ? `between the ${prev.year} and ${election.year} elections` : "before this election"}.
              </p>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {before.map((ev) => (
                <li key={ev.id}>
                  <Link href={`/timeline#${ev.id}`} className="group grid gap-1 py-4 sm:grid-cols-[7rem_1fr_auto] sm:gap-6">
                    <time className="font-mono text-xs text-fg-3" dateTime={ev.date}>
                      {formatEventDate(ev)}
                    </time>
                    <span className="text-sm text-fg transition group-hover:text-signal">{ev.title}</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-fg-3">{CATEGORIES[ev.category].label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-8">
          <h2 className="mb-2 text-xl tracking-tight">Provinces and municipalities</h2>
          {election.regional ? (
            <>
              <p className="mb-8 max-w-[60ch] text-sm text-fg-3">From the OpenUpSA elections dataset.</p>
              <ProvinceExplorer election={election} />
            </>
          ) : (
            <RegionalEmpty election={election} />
          )}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-3">{label}</dt>
      <dd className="mt-1 font-mono text-2xl tracking-tight tabular">{value}</dd>
      <dd className="text-[11px] text-fg-3">{hint}</dd>
    </div>
  );
}

function RegionalEmpty({ election }: { election: Election }) {
  const withData = ELECTIONS.filter((e) => e.regional);
  return (
    <div className="mt-6 grid gap-6 rounded-[1.75rem] border border-dashed border-line-strong p-8 md:grid-cols-[auto_1fr] md:items-center">
      <MapTrifoldIcon size={36} className="text-fg-3" />
      <div>
        <p className="text-sm text-fg">The open dataset does not include province or municipality results for {election.year} yet.</p>
        <p className="mt-1 max-w-[65ch] text-xs leading-relaxed text-fg-3">
          The OpenUpSA dataset covers{" "}
          {withData.map((e) => e.year).join(" and ")}. Adding more years means importing the IEC&rsquo;s results files with{" "}
          <code className="font-mono text-fg-2">scripts/extract_openup.py</code>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {withData.map((e) => (
            <Link
              key={e.year}
              href={`/elections/${e.year}`}
              className="inline-flex min-h-10 items-center rounded-full border border-line-strong px-3.5 text-xs text-fg transition hover:bg-panel active:scale-[0.98] sm:min-h-0 sm:py-1.5"
            >
              Explore {e.year} by province
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
