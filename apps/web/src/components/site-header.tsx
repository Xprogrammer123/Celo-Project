"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { useRovaBalance } from "@/hooks/useRovaBalance";

const links = [
  { href: "/", label: "HOME" },
  { href: "/play", label: "PLAY" },
  { href: "/gallery", label: "GALLERY" },
  { href: "/leaderboard", label: "LEADERBOARD" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { balance, hydrated } = useRovaBalance();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-black bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-head text-xl font-black uppercase tracking-tight [-webkit-text-stroke:1px_black] md:text-2xl"
        >
          <img src="/logo.png" alt="Rova Logo" className="h-8 w-8" />
          ROVA
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "font-head text-xs font-black uppercase tracking-wide hover:text-muted-foreground",
                pathname === l.href ? "underline decoration-4 underline-offset-4" : ""
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/play"
            className="border-2 border-black bg-primary px-3 py-1 font-head text-[11px] font-black uppercase tracking-wide shadow-[var(--shadow-sm)]"
          >
            {hydrated ? `${balance} ROVA` : "ROVA"}
          </Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/play"
            className="border-2 border-black bg-primary px-2 py-1 font-head text-[10px] font-black uppercase tracking-wide"
          >
            {hydrated ? `${balance} ROVA` : "ROVA"}
          </Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-black px-4 py-2 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "font-head shrink-0 text-[11px] font-black uppercase",
              pathname === l.href ? "bg-primary px-2 py-1" : ""
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
