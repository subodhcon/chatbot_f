"use client";

import React from "react";
import Link from "next/link";
import { Bot, ShieldAlert, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Main Announcement Card */}
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10 text-center">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-600/25">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 justify-center">
            Registration Closed
          </h2>
          <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Public user registration is disabled for this platform. Account creation and access management are managed exclusively by the System Administrator.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Please reach out to your organization administrator to obtain access credentials.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Go to Login Page
          </Link>
        </div>

      </div>
    </div>
  );
}
