"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-render the server parts of a live page every minute while it is visible. */
export function LiveRefresh({ every = 60_000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => window.clearInterval(id);
  }, [router, every]);
  return null;
}
