"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { SITE } from "@/lib/site";
import type { QrType } from "@/lib/payloads";

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-indigo-600" />
      <rect x="6" y="6" width="8" height="8" rx="2.2" fill="none" stroke="#fff" strokeWidth="2" />
      <rect x="18" y="6" width="8" height="8" rx="2.2" fill="none" stroke="#fff" strokeWidth="2" />
      <rect x="6" y="18" width="8" height="8" rx="2.2" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="20" cy="20" r="1.6" fill="#5eead4" />
      <circle cx="25" cy="20" r="1.6" fill="#fff" />
      <circle cx="20" cy="25" r="1.6" fill="#fff" />
      <circle cx="25" cy="25" r="1.6" fill="#5eead4" />
    </svg>
  );
}

const subscribe = (cb: () => void) => {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => o.disconnect();
};

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("qrzen.theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span className="text-lg">{SITE.name}</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-zinc-600 md:flex dark:text-zinc-400">
          <Link href="/#generator" className="hover:text-zinc-900 dark:hover:text-zinc-100">Generator</Link>
          <Link href="/#designs" className="hover:text-zinc-900 dark:hover:text-zinc-100">My designs</Link>
          <Link href="/#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">Features</Link>
          <Link href="/#pro" className="hover:text-zinc-900 dark:hover:text-zinc-100">Free vs Pro</Link>
          <Link href="/#faq" className="hover:text-zinc-900 dark:hover:text-zinc-100">FAQ</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href={SITE.githubUrl} className="hidden rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 sm:block dark:text-zinc-400 dark:hover:bg-zinc-800" rel="noopener">
            GitHub
          </a>
          <ThemeToggle />
          <a href={SITE.proUrl} className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            Get Pro
          </a>
        </div>
      </div>
    </header>
  );
}

function GeneratorSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]" aria-busy="true" aria-label="Loading the generator">
      <div className="space-y-5">
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-44 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
      <div className="h-[560px] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}

const Generator = dynamic(() => import("./Generator"), { ssr: false, loading: GeneratorSkeleton });

export function GeneratorLoader({ initialType }: { initialType?: QrType }) {
  return <Generator initialType={initialType} />;
}
