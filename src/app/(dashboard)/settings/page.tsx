"use client";

import React from "react";
import { Settings, Shield, Key, Bell } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function SettingsPage() {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure profile configurations, api credentials, and warning alerts.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Navigation tabs */}
        <div className="space-y-1">
          {[
            { label: "Account Profile", icon: Settings, active: true },
            { label: "Security & Passwords", icon: Shield, active: false },
            { label: "API Keys", icon: Key, active: false },
            { label: "Notifications", icon: Bell, active: false },
          ].map((tab, i) => (
            <button key={i} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ${
              tab.active ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800"
            }`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Configurations Box */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-850">Profile Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300">Name</label>
              <input
                type="text"
                disabled
                value={user?.name || "Admin User"}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || "admin@saas.com"}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
