"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  MessageSquare, 
  MessageCircle, 
  Smile, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { analyticsService, BotAnalyticsData } from "@/services/analytics";
import { botService, Bot } from "@/services/bot";

export default function AnalyticsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [analytics, setAnalytics] = useState<BotAnalyticsData | null>(null);
  
  // View settings
  const [timeView, setTimeView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dateFilter, setDateFilter] = useState<"7days" | "30days" | "90days" | "custom">("30days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  
  // Export settings
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  const [mounted, setMounted] = useState(false);
  
  // Loading & Error States
  const [isLoadingBots, setIsLoadingBots] = useState<boolean>(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user bots first
  useEffect(() => {
    async function loadBots() {
      try {
        const res = await botService.getBots();
        if (res.success && res.data) {
          setBots(res.data);
          if (res.data.length > 0) {
            setSelectedBotId(res.data[0].id);
          }
        } else {
          setError(res.error?.message || "Failed to load chatbots.");
        }
      } catch (err) {
        console.error("Error loading bots:", err);
        setError("An unexpected error occurred while fetching your bots.");
      } finally {
        setIsLoadingBots(false);
      }
    }
    loadBots();
  }, []);

  // Helper to compute date range parameters for the backend API
  const getDateRangeParams = () => {
    let start: string | undefined = undefined;
    let end: string | undefined = undefined;

    const today = new Date();
    if (dateFilter === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      start = past.toISOString();
    } else if (dateFilter === "30days") {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      start = past.toISOString();
    } else if (dateFilter === "90days") {
      const past = new Date();
      past.setDate(today.getDate() - 90);
      start = past.toISOString();
    } else if (dateFilter === "custom") {
      if (customStartDate) {
        start = new Date(customStartDate).toISOString();
      }
      if (customEndDate) {
        const endDay = new Date(customEndDate);
        endDay.setHours(23, 59, 59, 999);
        end = endDay.toISOString();
      }
    }
    return { start, end };
  };

  // Fetch bot analytics when selection or date range changes
  useEffect(() => {
    if (!selectedBotId) return;

    // For custom date filter, require both dates before calling API
    if (dateFilter === "custom" && (!customStartDate || !customEndDate)) return;

    async function loadAnalytics() {
      setIsLoadingAnalytics(true);
      setError(null);
      try {
        const { start, end } = getDateRangeParams();
        const res = await analyticsService.getBotAnalytics(selectedBotId, start, end);
        if (res.success && res.data) {
          setAnalytics(res.data);
        } else {
          setError(res.error?.message || "Failed to fetch bot analytics.");
        }
      } catch (err) {
        console.error("Error loading analytics:", err);
        setError("An unexpected error occurred while fetching analytics.");
      } finally {
        setIsLoadingAnalytics(false);
      }
    }
    loadAnalytics();
  }, [selectedBotId, dateFilter, customStartDate, customEndDate]);

  // Aggregate and format chart data based on selected view
  const getChartData = () => {
    if (!analytics?.conversation_volume) return [];

    if (timeView === "daily") {
      return analytics.conversation_volume.map((d) => {
        const parts = d.date.split("-");
        const dateLabel = parts.length === 3 
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : d.date;
        return { name: dateLabel, chats: d.count };
      });
    }

    if (timeView === "weekly") {
      const weeklyGroups: Record<string, number> = {};
      analytics.conversation_volume.forEach((d) => {
        const dateObj = new Date(d.date);
        const dayOfWeek = dateObj.getDay();
        const diff = dateObj.getDate() - dayOfWeek;
        const sunday = new Date(dateObj.setDate(diff));
        const weekKey = sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        weeklyGroups[weekKey] = (weeklyGroups[weekKey] || 0) + d.count;
      });

      return Object.entries(weeklyGroups).map(([week, count]) => ({
        name: `W/O ${week}`,
        chats: count,
      }));
    }

    if (timeView === "monthly") {
      const monthlyGroups: Record<string, number> = {};
      analytics.conversation_volume.forEach((d) => {
        const dateObj = new Date(d.date);
        const monthKey = dateObj.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + d.count;
      });

      return Object.entries(monthlyGroups).map(([month, count]) => ({
        name: month,
        chats: count,
      }));
    }

    return [];
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId || !exportStartDate || !exportEndDate || isExporting) return;

    setIsExporting(true);
    setExportError(null);
    setExportDownloadUrl(null);

    try {
      const startIso = new Date(exportStartDate).toISOString();
      const endDay = new Date(exportEndDate);
      endDay.setHours(23, 59, 59, 999);
      const endIso = endDay.toISOString();

      const res = await analyticsService.exportBotData(selectedBotId, startIso, endIso);
      if (res.success && res.data) {
        setExportDownloadUrl(res.data.download_url);
      } else {
        setExportError(res.error?.message || "Failed to trigger data export.");
      }
    } catch (err) {
      console.error("Export error:", err);
      setExportError("An unexpected error occurred while generating your export.");
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = getChartData();

  if (isLoadingBots) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm">Loading analytics workspace...</p>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 max-w-md mx-auto mt-12 shadow-sm">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">No Chatbots Found</h3>
        <p className="text-sm text-slate-555 dark:text-slate-400 mb-6">
          You need to create at least one chatbot to start tracking user interaction telemetry and analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header & Bot Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time deflection rates, conversational volume, and customer satisfaction metrics.
          </p>
        </div>
        
        {/* Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">Select Bot:</span>
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition shadow-sm cursor-pointer min-w-[180px]"
          >
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Filter Selection Row */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/5 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
        <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-850">
          {(["7days", "30days", "90days", "custom"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setDateFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                dateFilter === filter
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-250 cursor-pointer"
              }`}
            >
              {filter === "7days" && "7 Days"}
              {filter === "30days" && "30 Days"}
              {filter === "90days" && "90 Days"}
              {filter === "custom" && "Custom"}
            </button>
          ))}
        </div>

        {/* Custom Inputs */}
        {dateFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-350">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition shadow-sm"
            />
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition shadow-sm"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex gap-3 text-xs text-red-750 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Loading Error</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Conversations",
            value: isLoadingAnalytics ? null : (analytics?.total_conversations ?? 0).toString(),
            desc: "Unique client sessions",
            icon: MessageSquare,
            color: "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/5",
          },
          {
            label: "Total Messages",
            value: isLoadingAnalytics ? null : (analytics?.total_messages ?? 0).toString(),
            desc: "Total sent messages & replies",
            icon: MessageCircle,
            color: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/5",
          },
          {
            label: "CSAT Score",
            value: isLoadingAnalytics ? null : `${analytics?.csat ?? 0}%`,
            desc: "Thumbs up satisfaction rate",
            icon: Smile,
            color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5",
          },
          {
            label: "Deflection Rate",
            value: isLoadingAnalytics ? null : `${analytics?.deflection_rate ?? 0}%`,
            desc: "Resolved without human help",
            icon: ShieldCheck,
            color: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/5",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900/60 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="mt-1 flex items-baseline gap-1.5 min-h-[36px]">
                  {card.value === null ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
                      {card.value}
                    </span>
                  )}
                </div>
              </div>
              <div className={`rounded-xl p-2.5 ${card.color} shrink-0`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-850">
              <span className="text-[11px] text-slate-550 dark:text-slate-450 font-medium">
                {card.desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Columns Section: Chart & CSV Export */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Analytics Chart Block */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-850 dark:bg-slate-900/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-950 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Conversational Volume Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily, weekly, or monthly conversation volume logs.
              </p>
            </div>
            
            {/* Timeframe selector controls */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850 w-fit">
              {(["daily", "weekly", "monthly"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setTimeView(view)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    timeView === view
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 cursor-pointer"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Area Chart */}
          {isLoadingAnalytics ? (
            <div className="h-[280px] flex items-center justify-center text-slate-500">
              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mr-2" />
              <span className="text-xs">Computing chart data...</span>
            </div>
          ) : !analytics?.conversation_volume || analytics.conversation_volume.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-slate-500 dark:text-slate-455 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No volume logs recorded for this chatbot.
            </div>
          ) : mounted ? (
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415515" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "1px solid #33415560",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 600
                    }}
                    itemStyle={{ color: "#818cf8" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="chats" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorChats)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px]" />
          )}
        </div>

        {/* CSV Export Card Block */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-850 dark:bg-slate-900/60 p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-950 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-500" />
                Export Chat History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate a structured UTF-8 CSV archive containing conversations, logs, and thumbs ratings.
              </p>
            </div>

            {exportError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 flex gap-2.5 text-[10px] text-red-750 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{exportError}</span>
              </div>
            )}

            <form onSubmit={handleExportSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  disabled={isExporting}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition shadow-sm disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  disabled={isExporting}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition shadow-sm disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isExporting || !exportStartDate || !exportEndDate}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:scale-100 transition py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Archive...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Generate CSV Report</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Download Box */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 min-h-[50px] flex items-center justify-center">
            {exportDownloadUrl ? (
              <a
                href={exportDownloadUrl}
                download
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition active:scale-95 w-full justify-center animate-bounce cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download CSV Archive
              </a>
            ) : (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center">
                Configure range and export above to generate download link.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
