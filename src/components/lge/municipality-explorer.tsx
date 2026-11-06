"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDownIcon, MagnifyingGlassIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { PROVINCE_IDS, type CouncilStatus, type LgeMunicipality, type LgeMunicipalityDetail } from "@/lib/lge-core";
import { partyOr } from "@/lib/parties";
import { fmtInt, fmtPct } from "@/lib/format";

const STATUS_LABEL: Record<CouncilStatus, string> = { majority: "Majority", hung: "Hung", counting: "Counting" };

export function MunicipalityExplorer({ year, municipalities }: { year: number; municipalities: LgeMunicipality[] }) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState<number | null>(null);
  const [status, setStatus] = useState<CouncilStatus | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [limit, setLimit] = useState(25);

  const counts = useMemo(() => {
    const c: Record<CouncilStatus, number> = { majority: 0, hung: 0, counting: 0 };
    for (const m of municipalities) if (province == null || m.provinceId === province) c[m.status]++;
    return c;
  }, [municipalities, province]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return municipalities.filter(
      (m) =>
        (province == null || m.provinceId === province) &&
        (status == null || m.status === status) &&
        (!q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)),
    );
  }, [municipalities, query, province, status]);

  const shown = list.slice(0, limit);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="council-search" className="text-xs text-fg-2">
            Find a council
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 focus-within:border-line-strong lg:max-w-md">
            <MagnifyingGlassIcon size={15} className="text-fg-3" />
            <input
              id="council-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(25);
              }}
              placeholder="e.g. Johannesburg, eThekwini, Stellenbosch"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-fg-3"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-fg-3 hover:text-fg">
                <XIcon size={14} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-fg-3">Search by name or IEC code. Select a council to see every party and ward.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Council status">
          <Chip active={status == null} onClick={() => setStatus(null)}>
            All
          </Chip>
          {(Object.keys(STATUS_LABEL) as CouncilStatus[])
            .filter((s) => counts[s] > 0)
            .map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? null : s)}>
                {STATUS_LABEL[s]} <span className="font-mono text-fg-3 tabular">{counts[s]}</span>
              </Chip>
            ))}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Province">
        <Chip active={province == null} onClick={() => setProvince(null)}>
          All provinces
        </Chip>
        {Object.entries(PROVINCE_IDS).map(([id, p]) => (
          <Chip key={id} active={province === Number(id)} onClick={() => setProvince(province === Number(id) ? null : Number(id))}>
            {p.name}
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="text-sm text-fg-2">No council matches these filters.</p>
          <p className="mt-1 text-xs text-fg-3">
            Municipal boundaries and names changed in 2011 and 2016, so older years may use different names.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setProvince(null);
              setStatus(null);
            }}
            className="mt-4 rounded-full bg-signal px-4 py-2 text-sm text-ink transition active:scale-[0.98]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {shown.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                aria-expanded={open === m.id}
                onClick={() => setOpen(open === m.id ? null : m.id)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3.5 text-left transition-colors hover:bg-panel/50 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_6.5rem_1.25rem]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-fg">{m.name}</span>
                  <span className="block font-mono text-[11px] text-fg-3">
                    {m.code && `${m.code} · `}
                    {PROVINCE_IDS[m.provinceId]?.name} · {fmtInt(m.seatsTotal)} seats
                  </span>
                </span>
                <span className="order-3 col-span-2 sm:order-none sm:col-span-1">
                  <span className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-panel-2">
                    {m.top.map((t) => (
                      <span key={t.id} style={{ width: `${t.pct}%`, background: partyOr(t.id, t.name).color }} />
                    ))}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-fg-3">
                    {m.top.map((t) => (
                      <span key={t.id}>
                        {partyOr(t.id, t.name).short} <span className="font-mono tabular">{fmtPct(t.pct)}</span>
                      </span>
                    ))}
                  </span>
                </span>
                <StatusBadge status={m.status} pct={m.districtsPct} />
                <CaretDownIcon size={14} className={`hidden text-fg-3 transition sm:block ${open === m.id ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === m.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <CouncilDetail year={year} id={m.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      )}

      {list.length > shown.length && (
        <div className="flex items-center justify-between gap-4 text-xs text-fg-3">
          <span>
            Showing {shown.length} of {list.length}
          </span>
          <button
            type="button"
            onClick={() => setLimit((l) => l + 50)}
            className="rounded-full border border-line-strong px-4 py-2 text-sm text-fg transition hover:bg-panel active:scale-[0.98]"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition active:scale-[0.97] ${
        active ? "border-line-strong bg-panel-2 text-fg" : "border-line text-fg-3 hover:text-fg-2"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status, pct }: { status: CouncilStatus; pct: number }) {
  if (status === "counting")
    return (
      <span className="justify-self-end text-right font-mono text-[11px] text-fg-3 tabular">
        <span className="font-sans text-[10px] uppercase tracking-[0.1em]">Counting</span>
        <br />
        {pct.toFixed(0)}% in
      </span>
    );
  return (
    <span
      className={`justify-self-end rounded-md px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${
        status === "majority" ? "bg-fg-2/15 text-fg" : "text-fg-2 ring-1 ring-inset ring-fg-3/50"
      }`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

type DetailState = { status: "loading" } | { status: "error"; message: string } | { status: "ok"; data: LgeMunicipalityDetail };

const detailCache = new Map<string, LgeMunicipalityDetail>();

function CouncilDetail({ year, id }: { year: number; id: number }) {
  const key = `${year}-${id}`;
  const [state, setState] = useState<DetailState>(() => {
    const hit = detailCache.get(key);
    return hit ? { status: "ok", data: hit } : { status: "loading" };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (detailCache.has(key)) return;
    let alive = true;
    fetch(`/api/lge/${year}/municipality/${id}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Could not load this council.");
        return body as LgeMunicipalityDetail;
      })
      .then((data) => {
        detailCache.set(key, data);
        if (alive) setState({ status: "ok", data });
      })
      .catch((e: Error) => alive && setState({ status: "error", message: e.message }));
    return () => {
      alive = false;
    };
  }, [year, id, key, attempt]);

  if (state.status === "loading")
    return (
      <div className="grid gap-3 pb-6 pt-2 sm:grid-cols-2" aria-busy>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-5" style={{ width: `${85 - i * 9}%` }} />
        ))}
      </div>
    );

  if (state.status === "error")
    return (
      <div role="alert" className="mb-5 mt-1 flex items-start gap-3 rounded-xl border border-line-strong bg-panel p-4 text-sm">
        <WarningIcon size={18} className="mt-0.5 shrink-0 text-fg-2" />
        <div className="flex-1">
          <p className="text-fg-2">{state.message}</p>
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt(attempt + 1);
            }}
            className="mt-2 text-xs text-fg underline decoration-line-strong underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );

  const d = state.data;
  const parties = d.parties.filter((p) => p.votes > 0);
  const max = parties[0]?.pct || 1;
  const counted = d.wards.filter((w) => w.party);

  return (
    <div className="grid gap-8 pb-8 pt-2 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.1em] text-fg-3">
          <span>Party</span>
          <span>Share · seats</span>
        </div>
        <ol className="space-y-1.5">
          {parties.slice(0, 10).map((p) => {
            const meta = partyOr(p.id, p.name);
            return (
              <li key={p.id} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem_2.5rem] items-center gap-3 text-sm">
                <span className="truncate text-fg-2">{p.id === "OTHER" ? "Other" : meta.short}</span>
                <span className="h-1.5 rounded-full bg-panel-2">
                  <span className="block h-1.5 rounded-full" style={{ width: `${(p.pct / max) * 100}%`, background: meta.color }} />
                </span>
                <span className="text-right font-mono text-xs tabular">{fmtPct(p.pct)}</span>
                <span className="text-right font-mono text-xs text-fg-2 tabular">{p.seats}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[11px] text-fg-3">
          {fmtInt(d.registered)} registered voters · {fmtInt(d.seatsTotal)} seats ·{" "}
          {d.status === "counting" ? `${fmtPct((d.progress.districts.done / Math.max(d.progress.districts.total, 1)) * 100, 0)} of districts counted` : STATUS_LABEL[d.status].toLowerCase() + " council"}
        </p>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.1em] text-fg-3">
          <span>Ward winners</span>
          <span>
            {counted.length} of {d.wards.length}
          </span>
        </div>
        {d.wards.length === 0 ? (
          <p className="text-xs text-fg-3">This council has no wards (district councils are elected by list only).</p>
        ) : (
          <ul className="flex flex-wrap gap-1" aria-label="Ward winners">
            {d.wards.map((w) => {
              const meta = w.party ? partyOr(w.party, w.partyName ?? w.party) : null;
              const label = meta
                ? `Ward ${w.number}: ${meta.short} ${w.pct != null ? fmtPct(w.pct) : ""}${w.candidate ? `, ${w.candidate}` : ""}`
                : `Ward ${w.number}: not yet counted`;
              return (
                <li key={w.id}>
                  <span
                    title={label}
                    aria-label={label}
                    className="block size-4 rounded-[3px]"
                    style={meta ? { background: meta.color } : { boxShadow: "inset 0 0 0 1px var(--color-line-strong)" }}
                  />
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-fg-3">Hover a square for the ward, winning party and candidate.</p>
      </div>
    </div>
  );
}
