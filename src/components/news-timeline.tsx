"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRightIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import { ELECTIONS, LATEST, previousElection } from "@/lib/elections";
import { CATEGORIES, EVENTS, formatEventDate, shiftAfter, type Category, type NewsEvent } from "@/lib/events";
import { party } from "@/lib/parties";
import { fmtDelta, fmtPct } from "@/lib/format";

const ALL = Object.keys(CATEGORIES) as Category[];

/** Group events into "the road to election X" buckets, newest first. */
function bucket(events: NewsEvent[]) {
  const groups: { key: string; title: string; subtitle: string; year?: number; items: NewsEvent[] }[] = [];
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));
  for (const ev of sorted) {
    const own = ELECTIONS.find((e) => e.date === ev.date);
    const next = own ?? ELECTIONS.find((e) => e.date > ev.date);
    const key = next ? String(next.year) : "next";
    let g = groups.find((x) => x.key === key);
    if (!g) {
      const prev = next ? ELECTIONS[ELECTIONS.indexOf(next) - 1] : ELECTIONS[ELECTIONS.length - 1];
      g = next
        ? {
            key,
            year: next.year,
            title: `The road to ${next.year}`,
            subtitle: prev ? `Between the ${prev.year} and ${next.year} elections` : "Before the first democratic election",
            items: [],
          }
        : {
            key,
            title: "Since the last election",
            subtitle: `After ${ELECTIONS[ELECTIONS.length - 1].year}. The next national election is due in 2029.`,
            items: [],
          };
      groups.push(g);
    }
    g.items.push(ev);
  }
  return groups;
}

export function NewsTimeline() {
  const [cats, setCats] = useState<Category[]>(ALL);
  const [partyFilter, setPartyFilter] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const read = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      setHighlight(id);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const filtered = useMemo(
    () => EVENTS.filter((e) => cats.includes(e.category) && (!partyFilter || e.parties.includes(partyFilter))),
    [cats, partyFilter],
  );
  const groups = bucket(filtered);
  const activeFilters = (cats.length === ALL.length ? 0 : ALL.length - cats.length) + (partyFilter ? 1 : 0);
  const partyOptions = ["ANC", "DA", "EFF", "MK", "IFP", "COPE"];

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-16">
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Filters">
        {/* Phones: filters fold away behind a button so the news comes first. */}
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="timeline-filters"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex min-h-11 w-full items-center justify-between rounded-xl border border-line px-4 text-sm text-fg-2 transition active:scale-[0.99] lg:hidden"
        >
          <span className="flex items-center gap-2">
            <FunnelSimpleIcon size={16} /> Filter
            {activeFilters > 0 && (
              <span className="rounded-full bg-signal px-2 py-0.5 text-[11px] text-ink">{activeFilters} on</span>
            )}
          </span>
          <span className="font-mono text-xs text-fg-3 tabular">
            {filtered.length} of {EVENTS.length} events
          </span>
        </button>
        <div className="mb-3 hidden items-center gap-2 text-xs uppercase tracking-[0.12em] text-fg-3 lg:flex">
          <FunnelSimpleIcon size={14} /> Filter
        </div>
        <div id="timeline-filters" className={`mt-5 space-y-6 lg:mt-0 lg:block ${filtersOpen ? "block" : "hidden"}`}>
          <fieldset>
            <legend className="mb-2 text-sm text-fg-2">Topic</legend>
            <div className="flex flex-wrap gap-1.5 lg:flex-col lg:items-start">
              <button
                type="button"
                onClick={() => setCats(cats.length === ALL.length ? [] : ALL)}
                className="min-h-10 rounded-full px-2.5 text-xs text-fg-3 underline lg:min-h-0 lg:py-1 decoration-line-strong underline-offset-4 hover:text-fg"
              >
                {cats.length === ALL.length ? "Clear all" : "Select all"}
              </button>
              {ALL.map((c) => {
                const active = cats.includes(c);
                const count = EVENTS.filter((e) => e.category === c).length;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCats((s) => (active ? s.filter((x) => x !== c) : [...s, c]))}
                    className={`flex items-center gap-2 min-h-10 rounded-full border px-3.5 text-xs transition lg:min-h-0 lg:px-3 lg:py-1.5 active:scale-[0.97] ${
                      active ? "border-line-strong bg-panel-2 text-fg" : "border-line text-fg-3 hover:text-fg-2"
                    }`}
                  >
                    {CATEGORIES[c].label}
                    <span className="font-mono text-fg-3 tabular">{count}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm text-fg-2">Involving</legend>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={partyFilter === null}
                onClick={() => setPartyFilter(null)}
                className={`min-h-10 rounded-full border px-3.5 text-xs transition lg:min-h-0 lg:px-3 lg:py-1.5 ${
                  partyFilter === null ? "border-line-strong bg-panel-2 text-fg" : "border-line text-fg-3"
                }`}
              >
                Any party
              </button>
              {partyOptions.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={partyFilter === p}
                  onClick={() => setPartyFilter(partyFilter === p ? null : p)}
                  className={`flex items-center gap-1.5 min-h-10 rounded-full border px-3.5 text-xs transition lg:min-h-0 lg:px-3 lg:py-1.5 ${
                    partyFilter === p ? "border-line-strong bg-panel-2 text-fg" : "border-line text-fg-3 hover:text-fg-2"
                  }`}
                >
                  <span className="size-1.5 rounded-full" style={{ background: party(p).color }} />
                  {party(p).short}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-xs leading-relaxed text-fg-3">
            Each event shows how the vote moved at the next election. That is timing, not proof of cause.
          </p>
        </div>
      </aside>

      <div>
        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
            <p className="text-sm text-fg-2">No events match these filters.</p>
            <button
              type="button"
              onClick={() => {
                setCats(ALL);
                setPartyFilter(null);
              }}
              className="mt-4 rounded-full bg-signal px-4 py-2 text-sm text-ink transition active:scale-[0.98]"
            >
              Show everything
            </button>
          </div>
        )}
        <div className="space-y-16">
          {groups.map((g) => {
            const el = g.year ? ELECTIONS.find((e) => e.year === g.year) : undefined;
            return (
              <section key={g.key} aria-labelledby={`g-${g.key}`}>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <h2 id={`g-${g.key}`} className="text-xl tracking-tight">
                      {g.title}
                    </h2>
                    <p className="text-xs text-fg-3">{g.subtitle}</p>
                  </div>
                  {el && (
                    <Link
                      href={`/elections/${el.year}`}
                      className="group -my-2 flex items-center gap-1.5 py-2 text-xs text-fg-2 hover:text-fg"
                    >
                      {el.year} results
                      <ArrowUpRightIcon size={12} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </header>
                <ol className="relative space-y-3 border-l border-line pl-6">
                  <AnimatePresence initial={false}>
                    {g.items.map((ev) => (
                      <EventItem key={ev.id} ev={ev} highlighted={highlight === ev.id} />
                    ))}
                  </AnimatePresence>
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventItem({ ev, highlighted }: { ev: NewsEvent; highlighted: boolean }) {
  const shift = shiftAfter(ev);
  return (
    <motion.li
      id={ev.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
      className={`relative scroll-mt-28 rounded-2xl border p-5 transition-colors ${
        highlighted ? "border-signal/40 bg-signal/[0.04]" : "border-transparent hover:border-line hover:bg-panel/60"
      }`}
    >
      <span
        className={`absolute -left-[29px] top-7 size-2.5 rounded-full border-2 border-ink ${
          ev.category === "election" ? "bg-signal" : "bg-fg-3"
        }`}
        aria-hidden
      />
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <time dateTime={ev.date} className="font-mono text-fg-3">
          {formatEventDate(ev)}
        </time>
        <span className="rounded-md bg-panel-2 px-1.5 py-0.5 text-[11px] uppercase tracking-[0.1em] text-fg-2">
          {CATEGORIES[ev.category].label}
        </span>
      </div>
      <h3 className="text-[15px] leading-snug text-fg">{ev.title}</h3>
      <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-fg-2">{ev.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        {shift ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <span className="text-fg-3">
              {shift.election.date === ev.date
                ? `Result vs ${previousElection(shift.election.year)?.year}`
                : `Next vote, ${shift.election.year}`}
            </span>
            {shift.shifts.map((s) => (
              <span key={s.party} className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ background: party(s.party).color }} />
                <span className="text-fg-2">{party(s.party).short}</span>
                <span className="font-mono text-fg tabular">{fmtPct(s.to)}</span>
                <span className={`font-mono tabular ${s.delta >= 0 ? "text-fg-2" : "text-fg-3"}`}>({fmtDelta(s.delta)})</span>
              </span>
            ))}
          </div>
        ) : ev.date > LATEST.date ? (
          <span className="text-xs text-fg-3">No national election has been held since. The next one is due in 2029.</span>
        ) : null}
        {ev.link && (
          <a
            href={ev.link}
            target="_blank"
            rel="noreferrer"
            className="-my-2 ml-auto flex items-center gap-1 py-2 text-xs text-fg-3 hover:text-fg"
          >
            Background <ArrowUpRightIcon size={12} />
          </a>
        )}
      </div>
    </motion.li>
  );
}
