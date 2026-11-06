"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BroadcastIcon,
  BuildingsIcon,
  ChartLineUpIcon,
  CompassIcon,
  NewspaperIcon,
  ScalesIcon,
} from "@phosphor-icons/react";
import { NAV } from "./nav-items";
import { CommandPalette } from "./command-palette";

const ICONS = {
  "/": CompassIcon,
  "/elections": ScalesIcon,
  "/local": BuildingsIcon,
  "/trends": ChartLineUpIcon,
  "/timeline": NewspaperIcon,
  "/live": BroadcastIcon,
} as const;

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Mzansi Elecxions home">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="shrink-0">
        <circle cx="13" cy="13" r="12" fill="none" stroke="currentColor" strokeOpacity="0.25" />
        <circle cx="13" cy="13" r="7" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        <circle cx="13" cy="13" r="2.5" fill="var(--color-signal)" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">
        Mzansi <span className="text-fg-2 font-normal">Elecxions</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ live = false }: { live?: boolean }) {
  return <HeaderView pathname={usePathname() ?? ""} live={live} />;
}

/** Rendered while the pathname resolves (no active state). */
export function SiteHeaderFallback({ live = false }: { live?: boolean }) {
  return <HeaderView pathname="" live={live} />;
}

function HeaderView({ pathname, live }: { pathname: string; live: boolean }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 md:px-8">
          <Wordmark />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    active ? "text-ink" : "text-fg-2 hover:text-fg"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-signal"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {item.href === "/live" && live && <span className="size-1.5 rounded-full bg-live" aria-hidden />}
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <CommandPalette />
        </div>
      </header>

      {/* Mobile: thumb-reachable tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = ICONS[item.href];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10.5px] transition-colors active:scale-[0.96] ${
                    active ? "text-signal" : "text-fg-3"
                  }`}
                >
                  <Icon size={22} weight={active ? "fill" : "regular"} />
                  {item.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
