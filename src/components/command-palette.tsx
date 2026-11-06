"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { ELECTIONS } from "@/lib/elections";
import { LGE_YEARS } from "@/lib/lge-core";
import { LGE_COPY } from "@/lib/lge-copy";
import { EVENTS, CATEGORIES, formatEventDate } from "@/lib/events";
import { NAV } from "./nav-items";

type Item = { id: string; group: string; label: string; hint?: string; href: string };

const ITEMS: Item[] = [
  ...NAV.map((n) => ({ id: `page-${n.href}`, group: "Pages", label: n.label, href: n.href })),
  ...[...ELECTIONS].reverse().map((e) => ({
    id: `el-${e.year}`,
    group: "Elections",
    label: `${e.year} general election`,
    hint: e.headline,
    href: `/elections/${e.year}`,
  })),
  ...[...LGE_YEARS].reverse().map((y) => ({
    id: `lge-${y}`,
    group: "Local elections",
    label: `${y} local elections`,
    hint: LGE_COPY[y].headline,
    href: `/local/${y}`,
  })),
  ...EVENTS.map((ev) => ({
    id: `ev-${ev.id}`,
    group: "News",
    label: ev.title,
    hint: `${CATEGORIES[ev.category].label} · ${formatEventDate(ev)}`,
    href: `/timeline#${ev.id}`,
  })),
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const show = () => {
    setQuery("");
    setCursor(0);
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else {
          setQuery("");
          setCursor(0);
          setOpen(true);
        }
      }
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setQuery("");
        setCursor(0);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS.filter((i) => i.group !== "News").concat(ITEMS.filter((i) => i.group === "News").slice(-5).reverse());
    return ITEMS.filter((i) => `${i.label} ${i.hint ?? ""} ${i.group}`.toLowerCase().includes(q)).slice(0, 12);
  }, [query]);

  const go = (item: Item) => {
    setOpen(false);
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      go(results[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-sm text-fg-2 transition hover:border-line-strong hover:text-fg active:scale-[0.98]"
        aria-label="Search elections and news"
      >
        <MagnifyingGlassIcon size={16} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-line px-1.5 font-mono text-[11px] text-fg-3 lg:inline">Ctrl K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-ink/70 px-4 pt-[12vh] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]"
              initial={{ y: -8, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -6, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <div className="flex items-center gap-3 border-b border-line px-4">
                <MagnifyingGlassIcon size={18} className="text-fg-3" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCursor(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Jump to an election, page or news event"
                  className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-3"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="palette-list"
                  aria-activedescendant={results[cursor]?.id}
                />
                <kbd className="rounded border border-line px-1.5 font-mono text-[11px] text-fg-3">Esc</kbd>
              </div>
              <ul id="palette-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
                {results.length === 0 && (
                  <li className="px-3 py-10 text-center text-sm text-fg-3">
                    Nothing matches &ldquo;{query}&rdquo;. Try a year like 2009, or a word like Nkandla.
                  </li>
                )}
                {results.map((item, i) => {
                  const header = i === 0 || results[i - 1].group !== item.group;
                  return (
                    <li key={item.id} role="presentation">
                      {header && (
                        <div className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">
                          {item.group}
                        </div>
                      )}
                      <button
                        id={item.id}
                        role="option"
                        aria-selected={i === cursor}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => go(item)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          i === cursor ? "bg-panel-2 text-fg" : "text-fg-2"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{item.label}</span>
                          {item.hint && <span className="block truncate text-xs text-fg-3">{item.hint}</span>}
                        </span>
                        <ArrowRightIcon size={14} className={i === cursor ? "opacity-100" : "opacity-0"} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
