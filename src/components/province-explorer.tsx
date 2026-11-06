"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { PROVINCES, type AreaResult, type Election } from "@/lib/elections";
import { party } from "@/lib/parties";
import { fmtInt, fmtPct } from "@/lib/format";

type Ballot = "national" | "provincial";

function shares(a: AreaResult) {
  const valid = Object.values(a.votes).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(a.votes).map(([id, v]) => ({ id, v, pct: (v / valid) * 100 }));
}

function StackBar({ area, height = "h-2" }: { area: AreaResult; height?: string }) {
  return (
    <div className={`flex ${height} w-full gap-[2px] overflow-hidden rounded-full`}>
      {shares(area)
        .filter((s) => s.pct >= 0.4)
        .map((s) => (
          <span key={s.id} style={{ width: `${s.pct}%`, background: party(s.id).color }} title={`${party(s.id).short} ${fmtPct(s.pct)}`} />
        ))}
    </div>
  );
}

export function ProvinceExplorer({ election }: { election: Election }) {
  const regional = election.regional!;
  const [ballot, setBallot] = useState<Ballot>("national");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const areas = ballot === "national" ? regional.national : regional.provincial;
  const codes = Object.keys(PROVINCES).filter((c) => areas[c]);

  const munis = useMemo(() => {
    const q = query.trim().toLowerCase();
    return regional.municipalities
      .filter((m) => (selected ? m.province === selected : true))
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
      .sort((a, b) => b.registered - a.registered);
  }, [regional.municipalities, selected, query]);

  const shown = munis.slice(0, query || selected ? 60 : 12);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full border border-line p-1" role="tablist" aria-label="Ballot">
          {(["national", "provincial"] as Ballot[]).map((b) => (
            <button
              key={b}
              role="tab"
              aria-selected={ballot === b}
              onClick={() => setBallot(b)}
              className={`relative rounded-full px-4 py-1.5 text-sm transition-colors ${ballot === b ? "text-ink" : "text-fg-2 hover:text-fg"}`}
            >
              {ballot === b && (
                <motion.span layoutId="ballot-pill" className="absolute inset-0 rounded-full bg-signal" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <span className="relative">{b === "national" ? "National ballot" : "Provincial ballot"}</span>
            </button>
          ))}
        </div>
        <p className="max-w-[52ch] text-xs text-fg-3">
          {ballot === "national"
            ? "How each province voted for the National Assembly."
            : "Who each province chose for its own provincial legislature."}{" "}
          Select a province to filter municipalities.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {codes.map((code) => {
          const a = areas[code];
          const s = shares(a).sort((x, y) => y.pct - x.pct);
          const lead = s[0];
          const active = selected === code;
          return (
            <li key={code}>
              <button
                type="button"
                onClick={() => setSelected(active ? null : code)}
                aria-pressed={active}
                className={`group flex h-full w-full flex-col gap-4 p-5 text-left transition-colors active:scale-[0.995] ${
                  active ? "bg-panel-2" : "bg-panel hover:bg-panel-2/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-fg">{PROVINCES[code]}</div>
                    <div className="font-mono text-[11px] text-fg-3 tabular">
                      {fmtInt(a.registered)} registered &middot; {a.turnout ? fmtPct(a.turnout) : "–"} turnout
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider transition ${
                      active ? "border-signal/50 text-signal" : "border-line text-fg-3 group-hover:text-fg-2"
                    }`}
                  >
                    {active ? "Selected" : code}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-medium tracking-tight">{party(lead.id).short}</span>
                  <span className="font-mono text-sm text-fg-2 tabular">{fmtPct(lead.pct)}</span>
                </div>
                <StackBar area={a} />
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-fg-3">
                  {s.slice(1, 4).map((x) => (
                    <li key={x.id} className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full" style={{ background: party(x.id).color }} />
                      {party(x.id).short} <span className="font-mono tabular">{fmtPct(x.pct)}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="muni-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 id="muni-heading" className="text-lg tracking-tight">
              Municipalities{selected && <span className="text-fg-2"> in {PROVINCES[selected]}</span>}
            </h3>
            <p className="text-xs text-fg-3">
              National ballot, largest first. {munis.length} {munis.length === 1 ? "municipality" : "municipalities"}
              {!query && !selected && munis.length > shown.length && ` · showing the ${shown.length} largest`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-72">
            <label htmlFor="muni-search" className="text-xs text-fg-2">
              Find a municipality
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 focus-within:border-line-strong">
              <MagnifyingGlassIcon size={15} className="text-fg-3" />
              <input
                id="muni-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Tshwane, Msunduzi"
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-fg-3"
              />
              {(query || selected) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelected(null);
                  }}
                  aria-label="Clear filters"
                  className="text-fg-3 hover:text-fg"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
            <p className="text-sm text-fg-2">No municipality matches &ldquo;{query}&rdquo;{selected && ` in ${PROVINCES[selected]}`}.</p>
            <p className="mt-1 text-xs text-fg-3">
              Boundaries changed in 2011, so some names differ between 2009 and 2014. Try a shorter search or clear the province.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            <AnimatePresence initial={false}>
              {shown.map((m) => {
                const s = shares(m).sort((x, y) => y.pct - x.pct);
                return (
                  <motion.li
                    key={m.code}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_6rem] sm:items-center sm:gap-6"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm text-fg">{m.name}</div>
                      <div className="font-mono text-[11px] text-fg-3">
                        {m.code} &middot; {m.province ? PROVINCES[m.province] : ""}
                      </div>
                    </div>
                    <div>
                      <StackBar area={m} height="h-2.5" />
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-fg-3">
                        {s.slice(0, 3).map((x) => (
                          <span key={x.id}>
                            {party(x.id).short} <span className="font-mono tabular">{fmtPct(x.pct)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="font-mono text-xs text-fg-2 tabular sm:text-right">
                      {m.turnout ? fmtPct(m.turnout) : "–"} <span className="text-fg-3">turnout</span>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
        {munis.length > shown.length && (query || selected) && (
          <p className="mt-3 text-xs text-fg-3">Showing {shown.length} of {munis.length}. Narrow your search to see the rest.</p>
        )}
      </section>
    </div>
  );
}
