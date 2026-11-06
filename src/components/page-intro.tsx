export function PageIntro({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-12 pt-12 md:px-8 md:pt-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
      <div>
        <p className="rise mb-4 text-xs uppercase tracking-[0.16em] text-fg-3">{eyebrow}</p>
        <h1 className="rise text-4xl font-medium leading-[1.04] tracking-tighter md:text-5xl" style={{ ["--i" as string]: 1 }}>
          {title}
        </h1>
        {children && (
          <div className="rise mt-5 max-w-[62ch] text-base leading-relaxed text-fg-2" style={{ ["--i" as string]: 2 }}>
            {children}
          </div>
        )}
      </div>
      {aside && <div className="rise lg:justify-self-end" style={{ ["--i" as string]: 3 }}>{aside}</div>}
    </div>
  );
}
