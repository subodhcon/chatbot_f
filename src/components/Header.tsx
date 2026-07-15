"use client";

import React from "react";
import { Bell, Menu, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.name || "Admin User";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-100 shadow-sm z-30">
      {/* Mobile Toggle & Brand Indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-slate-650 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-850">
          {user?.role === "superadmin" ? (
            <><ShieldAlert className="h-4 w-4 text-indigo-500" /> Super Admin</>
          ) : (
            <><ShieldCheck className="h-4 w-4 text-emerald-500" /> Administrator</>
          )}
        </span>
      </div>

      {/* Right Side Header Items */}
      <div className="flex items-center gap-4">
        {/* Notifications Mock */}
        <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-slate-200 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-850">
          <span className="sr-only">Notifications</span>
          <Bell className="h-5 w-5" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-850" />

        {/* Profile Details */}
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline text-sm font-bold text-slate-850 dark:text-slate-200">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
