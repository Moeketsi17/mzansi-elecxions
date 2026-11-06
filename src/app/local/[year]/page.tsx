import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { LgeResultsTable } from "@/components/lge/lge-results-table";
import { CouncilBar } from "@/components/lge/council-bar";
import { MunicipalityExplorer } from "@/components/lge/municipality-explorer";
import { LiveRefresh } from "@/components/lge/live-refresh";
import { LiveSkeleton } from "@/components/lge/live-skeleton";
import { reportTime } from "@/components/lge/report-time";
import { CURRENT_LGE, getLgeYear, isLgeYear, LGE_DATES, LGE_YEARS, lineageShares, previousLgeYear, snapshotYear } from "@/lib/lge";
import { LGE_COPY } from "@/lib/lge-copy";
import { partyOr } from "@/lib/parties";
import { fmtDate, fmtInt, fmtPct } from "@/lib/format";

export function generateStaticParams() {
  return LGE_YEARS.map((y) => ({ year: String(y) }));
}

export async function generateMetadata({ params }: PageProps<"/local/[year]">): Promise<Metadata> {
  const { year } = await params;
  return isLgeYear(Number(year)) ? { title: `${year} local elections`, description: LGE_COPY[Number(year)].summary } : {};
}

export default async function LocalYearPage({ params }: PageProps<"/local/[year]">) {
  const { year: raw } = await params;
  const year = Number(raw);
  if (!isLgeYear(year)) notFound();
  const copy = LGE_COPY[year];
  const i = LGE_YEARS.indexOf(year);
  const prev = LGE_YEARS[i - 1];
  const next = LGE_YEARS[i + 1];

  return (
    <>
      <nav aria-label="Local election year" className="border-b border-line">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-3 md:px-8">
          <YearArrow href={prev ? `/local/${prev}` : undefined} label="Previous local election" dir="prev" />
          <ol className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
            {LGE_YEARS.map((y) => (
              <li key={y}>
                <Link
                  href={`/local/${y}`}
                  aria-current={y === year ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-sm transition ${
                    y === year ? "bg-signal text-ink" : "text-fg-2 hover:bg-panel hover:text-fg"
                  }`}
                >
                  {y}
                  {y === CURRENT_LGE && !snapshotYear(y)?.complete && <span className="size-1.5 rounded-full bg-live" aria-label="live" />}
                </Link>
              </li>
            ))}
          </ol>
          <YearArrow href={next ? `/local/${next}` : undefined} label="Next local election" dir="next" />
        </div>
      </nav>

      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-10 md:px-8">
        <p className="rise mb-4 text-xs uppercase tracking-[0.16em] text-fg-3">
          Local government elections &middot; {fmtDate(LGE_DATES[year])}
        </p>
        <h1 className="rise max-w-[22ch] text-4xl font-medium leading-[1.04] tracking-tighter md:text-5xl" style={{ ["--i" as string]: 1 }}>
          {copy.headline}
        </h1>
        <p className="rise mt-5 max-w-[62ch] text-base leading-relaxed text-fg-2" style={{ ["--i" as string]: 2 }}>
          {copy.summary}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1400px] border-t border-line px-4 py-12 md:px-8">
            <LiveSkeleton />
          </div>
        }
      >
        <YearBody year={year} />
      </Suspense>
    </>
  );
}

async function YearBody({ year }: { year: number }) {
  const result = await getLgeYear(year);
  if (!result) notFound();
  const d = result.data;
  const prevYear = previousLgeYear(year);
  const prev = prevYear ? lineageShares(snapshotYear(prevYear)) : undefined;
  const live = year === CURRENT_LGE && !d.complete;
  const counting = Math.max(d.progress.councils.total - d.progress.councils.done, 0);

  return (
    <>
      {live && <LiveRefresh />}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
          {live && (
            <p className="mb-6 flex flex-wrap items-center gap-2 text-xs text-fg-2">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-live" />
              </span>
              Counting live &middot; IEC update {reportTime(d.reportDate)} &middot; this page refreshes every minute
              {result.stale && <span className="text-fg-3"> &middot; the feed did not answer, showing last known figures</span>}
            </p>
          )}
          <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <Stat label="Registered voters" value={`${(d.registered / 1e6).toFixed(1)}m`} hint={fmtInt(d.registered)} />
            <Stat label="Ballots counted" value={`${(d.ballots / 1e6).toFixed(1)}m`} hint="ward, PR and district" />
            <Stat
              label="Voting districts in"
              value={fmtPct((d.progress.districts.done / Math.max(d.progress.districts.total, 1)) * 100, 0)}
              hint={`${fmtInt(d.progress.districts.done)} of ${fmtInt(d.progress.districts.total)}`}
            />
            <Stat label="Council seats" value={fmtInt(d.seatsTotal)} hint={`${fmtInt(d.municipalities.length)} councils`} />
          </dl>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 md:px-8 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <h2 className="mb-6 text-xl tracking-tight">Results across all councils</h2>
            <LgeResultsTable year={d} previous={prev} previousYear={prevYear} />
          </div>
          <div className="space-y-10 lg:sticky lg:top-24 lg:self-start">
            <div>
              <h2 className="mb-1 text-xl tracking-tight">Council control</h2>
              <p className="mb-5 text-sm text-fg-3">
                {d.councils.hung} hung, {d.councils.majority} with a majority
                {counting ? `, ${counting} still counting` : ""}.
              </p>
              <CouncilBar majority={d.councils.majority} hung={d.councils.hung} counting={counting} />
            </div>
            <div>
              <h2 className="mb-4 text-xl tracking-tight">By province</h2>
              <ul className="divide-y divide-line border-y border-line">
                {d.provinces.map((p) => {
                  const ps = p.parties.filter((x) => x.id !== "OTHER").slice(0, 4);
                  return (
                    <li key={p.id} className="py-3">
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span>{p.name}</span>
                        <span className="text-[11px] text-fg-3">
                          {p.councils.hung} hung &middot; {p.councils.majority} majority
                        </span>
                      </div>
                      <div className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-panel-2">
                        {ps.map((x) => (
                          <span key={x.id} style={{ width: `${x.pct}%`, background: partyOr(x.id, x.name).color }} />
                        ))}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-fg-3">
                        {ps.slice(0, 3).map((x) => (
                          <span key={x.id}>
                            {partyOr(x.id, x.name).short} <span className="font-mono tabular">{fmtPct(x.pct)}</span>
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-8">
          <h2 className="mb-1 text-xl tracking-tight">Every council</h2>
          <p className="mb-8 text-sm text-fg-3">Largest first. Open a council for the full party result and every ward winner.</p>
          <MunicipalityExplorer year={year} municipalities={d.municipalities} />
          <p className="mt-6 text-xs text-fg-3">
            Source: Electoral Commission of South Africa results dashboard
            {result.source === "iec" ? ", fetched live" : ""}.
          </p>
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

function YearArrow({ href, label, dir }: { href?: string; label: string; dir: "prev" | "next" }) {
  const Icon = dir === "prev" ? ArrowLeftIcon : ArrowRightIcon;
  if (!href)
    return (
      <span className="p-2 text-fg-3/40" aria-hidden>
        <Icon size={16} />
      </span>
    );
  return (
    <Link href={href} aria-label={label} className="rounded-full p-2 text-fg-2 transition hover:bg-panel hover:text-fg">
      <Icon size={16} />
    </Link>
  );
}
