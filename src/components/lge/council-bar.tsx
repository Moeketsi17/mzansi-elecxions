import { fmtInt } from "@/lib/format";

/** Councils by control: an outright majority, hung (no majority), or still counting. */
export function CouncilBar({ majority, hung, counting = 0 }: { majority: number; hung: number; counting?: number }) {
  const total = majority + hung + counting || 1;
  const segs = [
    { key: "majority", label: "Majority", n: majority, cls: "bg-fg-2" },
    { key: "hung", label: "Hung", n: hung, cls: "bg-[repeating-linear-gradient(135deg,var(--color-fg-3)_0_2px,transparent_2px_6px)] ring-1 ring-inset ring-fg-3/60" },
    { key: "counting", label: "Still counting", n: counting, cls: "bg-panel-2 ring-1 ring-inset ring-line-strong" },
  ].filter((s) => s.n > 0);

  return (
    <div>
      <div className="flex h-3 gap-[2px]" role="img" aria-label={segs.map((s) => `${s.label}: ${s.n}`).join(", ")}>
        {segs.map((s) => (
          <span key={s.key} className={`h-full first:rounded-l-[4px] last:rounded-r-[4px] ${s.cls}`} style={{ width: `${(s.n / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-fg-2">
            <span className={`size-2.5 rounded-[3px] ${s.cls}`} />
            {s.label} <span className="font-mono text-fg tabular">{fmtInt(s.n)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
