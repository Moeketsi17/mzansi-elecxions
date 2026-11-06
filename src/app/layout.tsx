import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import { CURRENT_LGE, snapshotYear } from "@/lib/lge";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Mzansi Elecxions: South African election results, 1994 to now",
    template: "%s · Mzansi Elecxions",
  },
  description:
    "Every South African general election since 1994: results, seats, turnout, provincial detail, and the news events between votes.",
};

export const viewport: Viewport = {
  themeColor: "#0c0d10",
};

// Whether the current local election was still being counted when the results snapshot was taken.
const countingNow = !snapshotYear(CURRENT_LGE)?.complete;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="grain flex min-h-[100dvh] flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-signal focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <Suspense fallback={<SiteHeaderFallback live={countingNow} />}>
          <SiteHeader live={countingNow} />
        </Suspense>
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line pb-28 md:pb-0">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 text-sm text-fg-3 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div className="max-w-[60ch] space-y-3 leading-relaxed">
          <p className="text-fg-2">Where the numbers come from</p>
          <p>
            Local election results, including the live count, come from the{" "}
            <a className="underline decoration-line-strong underline-offset-4 hover:text-fg" href="https://results.elections.org.za/dashboards/lge/">
              IEC results dashboard
            </a>
            . National province and municipality results for 2009 and 2014 come from the{" "}
            <a className="underline decoration-line-strong underline-offset-4 hover:text-fg" href="https://github.com/OpenUpSA/elections-api">
              OpenUpSA elections-api
            </a>{" "}
            dataset (CC BY 4.0), built from IEC results. National totals for 1994 to 2004, 2019 and 2024 are the IEC&rsquo;s
            official National Assembly results. News events link to their sources where available.
          </p>
          <p>
            The timeline shows what happened between elections. It does not claim any event caused a change in the vote.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-fg-2">Explore</p>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-fg" href="/elections/2024">2024 national results</Link></li>
            <li><Link className="hover:text-fg" href="/local">Local elections</Link></li>
            <li><Link className="hover:text-fg" href="/trends">How the vote changed</Link></li>
            <li><Link className="hover:text-fg" href="/timeline">News timeline</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-fg-2">Official sources</p>
          <ul className="space-y-1.5">
            <li><a className="hover:text-fg" href="https://www.elections.org.za">Electoral Commission (IEC)</a></li>
            <li><a className="hover:text-fg" href="https://openup.org.za">OpenUp</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
