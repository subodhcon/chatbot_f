"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Bot, 
  Database, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const displayName = user?.name || "Admin User";
  const displayEmail = user?.email || "admin@saas.com";
  const initials = getInitials(user?.name || null, displayEmail);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bots", label: "Chatbots", icon: Bot },
    { href: "/knowledge-base", label: "Knowledge Base", icon: Database },
    { href: "/conversations", label: "Conversations", icon: MessageSquare },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(user?.role === "superadmin" ? [{ href: "/users", label: "Users", icon: Users }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-100 border-r border-slate-800/80 transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span>Conflux<span className="text-indigo-400">AI</span></span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-850 p-4 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-sm">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate" title={displayEmail}>
                  {displayEmail}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
