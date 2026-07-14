import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/Brand";

interface LegalLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalLayout({
  title,
  description,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-300">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/15 blur-3xl" />

      {/* Top bar */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-80"
        >
          <BrandMark />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-violet-500/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </header>

      {/* Reading column */}
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-6">
        <div className="mb-10 border-b border-slate-800/80 pb-8">
          <h1 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-400">
            {description}
          </p>
          <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        <article className="space-y-10">{children}</article>

        <div className="mt-16 border-t border-slate-800/80 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ConfluxAI. All rights reserved.
        </div>
      </main>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-white">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
        {children}
      </div>
    </section>
  );
}
