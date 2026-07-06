"use client";

import React from "react";
import { useAuthStore } from "@/store/auth";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.name || "Admin User";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
      {/* Mobile Toggle & Brand Indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          aria-label="Open sidebar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="hidden md:inline text-sm font-semibold text-slate-500 dark:text-slate-400">
          Admin Dashboard
        </span>
      </div>

      {/* Right Side Header Items */}
      <div className="flex items-center gap-4">
        {/* Notifications Mock */}
        <button className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
          <span className="sr-only">Notifications</span>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Profile Details */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
