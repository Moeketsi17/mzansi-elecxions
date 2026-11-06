import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";

/**
 * Year switcher. On phones every year fits on screen as an equal-width grid
 * (no hidden, scrolled-off years); from `sm` up it becomes a row with arrows.
 */
export function YearNav({
  years,
  current,
  href,
  label,
  liveYear,
}: {
  years: number[];
  current: number;
  href: (year: number) => string;
  label: string;
  liveYear?: number;
}) {
  const i = years.indexOf(current);
  const prev = years[i - 1];
  const next = years[i + 1];
  return (
    <nav aria-label={label} className="border-b border-line">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-2 py-2 sm:px-4 sm:py-3 md:px-8">
        <Arrow to={prev ? href(prev) : undefined} dir="prev" />
        <ol
          className="grid flex-1 gap-1 sm:flex sm:flex-none"
          style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}
        >
          {years.map((y) => (
            <li key={y}>
              <Link
                href={href(y)}
                aria-current={y === current ? "page" : undefined}
                className={`relative flex min-h-11 items-center justify-center rounded-full font-mono text-[13px] transition sm:min-h-0 sm:px-3.5 sm:py-1.5 sm:text-sm ${
                  y === current ? "bg-signal text-ink" : "text-fg-2 hover:bg-panel hover:text-fg active:bg-panel"
                }`}
              >
                {y}
                {y === liveYear && (
                  <span className="absolute right-1 top-1.5 size-1.5 rounded-full bg-live sm:static sm:ml-1.5" aria-label="counting live" />
                )}
              </Link>
            </li>
          ))}
        </ol>
        <Arrow to={next ? href(next) : undefined} dir="next" />
      </div>
    </nav>
  );
}

function Arrow({ to, dir }: { to?: string; dir: "prev" | "next" }) {
  const Icon = dir === "prev" ? ArrowLeftIcon : ArrowRightIcon;
  const label = dir === "prev" ? "Previous election" : "Next election";
  // Hidden on phones: every year is already on screen there.
  if (!to)
    return (
      <span className="hidden p-2 text-fg-3/40 sm:block" aria-hidden>
        <Icon size={16} />
      </span>
    );
  return (
    <Link href={to} aria-label={label} className="hidden rounded-full p-2 text-fg-2 transition hover:bg-panel hover:text-fg sm:block">
      <Icon size={16} />
    </Link>
  );
}
