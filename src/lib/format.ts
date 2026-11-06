const nf = new Intl.NumberFormat("en-ZA");

export const fmtInt = (n: number) => nf.format(Math.round(n)).replace(/ /g, " ");

export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const fmtDelta = (n: number, digits = 1) => {
  const v = Number(n.toFixed(digits));
  if (v === 0) return "±0.0";
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}`;
};

export const fmtMillions = (n: number) => `${(n / 1_000_000).toFixed(1)}m`;

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
