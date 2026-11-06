import Link from "next/link";
import { ELECTIONS } from "@/lib/elections";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-24 md:grid-cols-[1fr_1fr] md:px-8">
      <div>
        <p className="font-mono text-sm text-fg-3">404</p>
        <h1 className="mt-3 text-4xl font-medium tracking-tighter">That page isn&rsquo;t on the ballot.</h1>
        <p className="mt-4 max-w-[48ch] text-fg-2">
          The link may be old, or the year may not have a national election. These are the ones we cover:
        </p>
      </div>
      <ul className="flex flex-wrap content-start gap-2">
        {ELECTIONS.map((e) => (
          <li key={e.year}>
            <Link href={`/elections/${e.year}`} className="block rounded-full border border-line-strong px-4 py-2 font-mono text-sm transition hover:bg-panel active:scale-[0.98]">
              {e.year}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
