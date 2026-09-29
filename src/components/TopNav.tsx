"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/ads", title: "Ad Sets", blurb: "Build and edit ads", icon: "📣", match: (p: string) => p.startsWith("/ads") || p.startsWith("/scripts") },
  { href: "/", title: "Funnels", blurb: "TOFU · MOFU · BOFU", icon: "🔻", match: (p: string) => p === "/" },
  { href: "/quotes", title: "Quotes", blurb: "Your quote bank", icon: "❝", match: (p: string) => p.startsWith("/quotes") },
];

/** The three top-level sections of the app, pinned above every page. Height is
 * fixed to --topnav-h so full-height pages (the ad pool) can size around it. */
export function TopNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="Main sections"
      className="grid h-[var(--topnav-h)] shrink-0 grid-cols-3 gap-2 border-b border-neutral-200 bg-white px-3 py-2 sm:gap-3 sm:px-4 dark:border-neutral-800 dark:bg-neutral-950"
    >
      {SECTIONS.map((s) => {
        const active = s.match(pathname);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 transition-colors sm:px-4 ${
              active
                ? "border-orange-500 bg-orange-500/10"
                : "border-neutral-200 hover:border-orange-300 hover:bg-orange-500/5 dark:border-neutral-800 dark:hover:border-orange-800"
            }`}
          >
            <span aria-hidden className="hidden text-2xl sm:block">{s.icon}</span>
            <span className="min-w-0">
              <span className={`block truncate text-sm font-bold sm:text-base ${active ? "text-orange-600 dark:text-orange-400" : "text-neutral-900 dark:text-neutral-100"}`}>
                {s.title}
              </span>
              <span className="hidden truncate text-xs text-neutral-500 sm:block">{s.blurb}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
