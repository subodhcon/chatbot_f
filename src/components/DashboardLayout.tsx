"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { isAuthenticated, isRestored, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isRestored && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isRestored, isAuthenticated, router]);

  // Loading indicator while session is being verified
  if (!isRestored) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white gap-3">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium animate-pulse">Restoring session...</p>
      </div>
    );
  }

  // Guard routing - return null if not authenticated to prevent flickering
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
