export const NAV = [
  { href: "/", label: "Overview", short: "Overview", match: (p: string) => p === "/" },
  { href: "/elections", label: "National", short: "National", match: (p: string) => p.startsWith("/elections") },
  { href: "/local", label: "Local", short: "Local", match: (p: string) => p.startsWith("/local") },
  { href: "/trends", label: "Trends", short: "Trends", match: (p: string) => p.startsWith("/trends") },
  { href: "/timeline", label: "News timeline", short: "News", match: (p: string) => p.startsWith("/timeline") },
  { href: "/live", label: "Live", short: "Live", match: (p: string) => p.startsWith("/live") },
] as const;
