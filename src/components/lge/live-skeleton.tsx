/** Placeholder matching the live board's layout while the first IEC response arrives. */
export function LiveSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="skeleton h-9 w-72" />
      <div className="grid gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-3 w-32" />
            <div className="skeleton h-9 w-24" />
            <div className="skeleton h-1.5" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[90, 70, 45, 30, 20, 12].map((w) => (
          <div key={w} className="skeleton h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
