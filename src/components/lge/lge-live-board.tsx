"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon, ArrowsClockwiseIcon, WarningIcon } from "@phosphor-icons/react";
import type { LgeResult } from "@/lib/lge-core";
import { lineageOf, partyOr } from "@/lib/parties";
import { fmtDelta, fmtInt, fmtPct } from "@/lib/format";
import { CouncilBar } from "./council-bar";
import { reportTime } from "./report-time";

const POLL_MS = 60_000;

export function LgeLiveBoard({
  initial,
  previous,
  previousYear,
  variant = "full",
}: {
  initial: LgeResult;
  /** Party share at the previous local election, by lineage id. */
  previous: Record<string, number>;
  previousYear: number;
  variant?: "full" | "compact";
}) {
  const [result, setResult] = useState(initial);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  useEffect(() => {
    if (initial.data.complete) return;
    let alive = true;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/lge/live", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<LgeResult>) : Promise.reject(new Error(String(r.status)))))
        .then((next) => {
          if (!alive) return;
          setResult(next);
          setFailed(next.stale);
          setCheckedAt(Date.now());
        })
        .catch(() => alive && setFailed(true))
        .finally(() => alive && setChecking(false));
    };
    const id = window.setInterval(() => {
      setChecking(true);
      tick();
    }, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [initial.data.complete]);

  const d = result.data;
  const pDistricts = pct(d.progress.districts.done, d.progress.districts.total);
  const rows = d.parties.filter((p) => p.id !== "OTHER").slice(0, variant === "full" ? 12 : 7);
  const max = rows[0]?.pct || 1;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-panel px-4 py-2 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2" aria-hidden>
            {!d.complete && !failed && <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />}
            <span className={`relative inline-flex size-2 rounded-full ${d.complete ? "bg-signal" : failed ? "bg-fg-3" : "bg-live"}`} />
          </span>
          <span className="text-fg">
            {d.complete ? "Final result" : failed || result.stale ? "Showing last known figures" : "Counting live"}
          </span>
          <span className="text-fg-3">&middot; {d.year} local government elections</span>
        </div>
        <div className="flex items-center gap-3 text-fg-3">
          <span className="font-mono tabular">IEC update {reportTime(d.reportDate)}</span>
          {!d.complete && (
            <span className="flex items-center gap-1.5" title="This page checks the IEC feed every minute">
              <ArrowsClockwiseIcon size={13} className={checking ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{checkedAt ? "Checked just now" : "Checks every minute"}</span>
            </span>
          )}
        </div>
      </div>

      {(failed || result.stale) && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-line-strong bg-panel p-4 text-sm">
          <WarningIcon size={18} className="mt-0.5 shrink-0 text-fg-2" />
          <p className="text-fg-2">
            The IEC results feed did not answer on the last check, so these are the most recent figures we have. We will keep trying.
          </p>
        </div>
      )}

      {/* Progress */}
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Meter label="Voting districts counted" done={d.progress.districts.done} total={d.progress.districts.total} big />
        <Meter label="Councils declared" done={d.progress.councils.done} total={d.progress.councils.total} />
        <Meter label="Council seats allocated" done={d.progress.seats.done} total={d.progress.seats.total} />
      </dl>

      <div className={`grid gap-12 ${variant === "full" ? "lg:grid-cols-[1.5fr_1fr]" : "lg:grid-cols-[1.4fr_1fr]"}`}>
        {/* Leaderboard */}
        <div>
          <div className="mb-3 grid grid-cols-[minmax(0,8rem)_1fr_4rem_4rem] gap-3 border-b border-line pb-2 text-[11px] uppercase tracking-[0.1em] text-fg-3 sm:grid-cols-[minmax(0,10rem)_1fr_4.5rem_4.5rem_4rem]">
            <span>Party</span>
            <span>Share of ballots</span>
            <span className="text-right">Share</span>
            <span className="hidden text-right sm:block">vs {previousYear}</span>
            <span className="text-right">Seats</span>
          </div>
          <ol>
            <AnimatePresence initial={false}>
              {rows.map((r) => {
                const p = partyOr(r.id, r.name);
                const before = previous[lineageOf(r.id)];
                return (
                  <motion.li
                    key={r.id}
                    layout
                    transition={{ type: "spring", stiffness: 140, damping: 22 }}
                    className="grid grid-cols-[minmax(0,8rem)_1fr_4rem_4rem] items-center gap-3 py-2 sm:grid-cols-[minmax(0,10rem)_1fr_4.5rem_4.5rem_4rem]"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
                      <span className="truncate">{p.short}</span>
                    </span>
                    <div className="h-2.5 rounded-full bg-panel-2">
                      <motion.div
                        className="h-2.5 rounded-full"
                        style={{ background: p.color, transformOrigin: "left" }}
                        initial={false}
                        animate={{ scaleX: Math.max(r.pct / max, 0.01) }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      />
                    </div>
                    <span className="text-right font-mono text-sm tabular">{fmtPct(r.pct, r.pct < 1 ? 2 : 1)}</span>
                    <span className="hidden text-right font-mono text-xs tabular sm:block">
                      {before == null ? (
                        <span className="rounded bg-signal/10 px-1.5 py-0.5 font-sans text-[11px] uppercase tracking-wider text-signal">New</span>
                      ) : (
                        <span className={r.pct >= before ? "text-fg" : "text-fg-3"}>{fmtDelta(r.pct - before)}</span>
                      )}
                    </span>
                    <span className="text-right font-mono text-sm text-fg-2 tabular">{fmtInt(r.seats)}</span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-fg-3">
            Share combines ward, proportional and district ballots, as the IEC reports it. Seats so far are mostly ward seats; proportional
            seats are allocated as each council finishes counting.
          </p>
        </div>

        {/* Councils */}
        <div className="space-y-8">
          <div>
            <h3 className="mb-1 text-sm text-fg">Who controls the councils</h3>
            <p className="mb-4 text-xs text-fg-3">
              {fmtInt(d.councils.hung)} of {fmtInt(d.progress.councils.done)} declared councils are hung, with no party holding a majority.
            </p>
            <CouncilBar
              majority={d.councils.majority}
              hung={d.councils.hung}
              counting={Math.max(d.progress.councils.total - d.progress.councils.done, 0)}
            />
          </div>
          <div>
            <h3 className="mb-3 text-sm text-fg">Leading party by province</h3>
            <ul className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {d.provinces.map((pr) => {
                const lead = pr.parties.find((p) => p.id !== "OTHER");
                const lp = lead ? partyOr(lead.id, lead.name) : null;
                return (
                  <li key={pr.id} className="bg-panel p-3">
                    <div className="truncate text-[11px] text-fg-3">{pr.name}</div>
                    {lp && lead ? (
                      <div className="mt-1 flex items-center gap-1.5 text-sm">
                        <span className="size-1.5 rounded-full" style={{ background: lp.color }} />
                        {lp.short}
                        <span className="font-mono text-[11px] text-fg-3 tabular">{lead.pct.toFixed(0)}%</span>
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-fg-3">Awaiting results</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <Link
            href={`/local/${d.year}`}
            className="group flex items-center justify-between rounded-2xl border border-line-strong px-5 py-4 text-sm transition hover:bg-panel active:scale-[0.99]"
          >
            <span>
              Every council, ward by ward
              <span className="block text-xs text-fg-3">Search {fmtInt(d.municipalities.length)} municipalities</span>
            </span>
            <ArrowRightIcon size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {variant === "full" && pDistricts < 100 && (
        <p className="text-xs text-fg-3">
          Figures change as results are captured. Final results are declared by the IEC once every council is complete.
        </p>
      )}
    </div>
  );
}

function pct(done: number, total: number) {
  return total ? (done / total) * 100 : 0;
}

function Meter({ label, done, total, big }: { label: string; done: number; total: number; big?: boolean }) {
  const p = pct(done, total);
  return (
    <div>
      <dt className="text-xs text-fg-3">{label}</dt>
      <dd className={`mt-1 font-mono tracking-tight tabular ${big ? "text-4xl" : "text-2xl"}`}>{fmtPct(p)}</dd>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <motion.div
          className="h-1.5 rounded-full bg-signal"
          style={{ transformOrigin: "left" }}
          initial={false}
          animate={{ scaleX: Math.min(p / 100, 1) }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
      <dd className="mt-1.5 font-mono text-[11px] text-fg-3 tabular">
        {fmtInt(done)} of {fmtInt(total)}
      </dd>
    </div>
  );
}

