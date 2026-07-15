"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen,
  FileText,
  UploadCloud,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Database,
  ArrowRight,
  Globe,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  Shield,
} from "lucide-react";
import { botService, Bot, KnowledgeSource } from "@/services/bot";

export default function KnowledgeBasePage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [isBotsLoading, setIsBotsLoading] = useState(true);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Crawl states
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlDepth, setCrawlDepth] = useState<number>(1);
  const [isCrawling, setIsCrawling] = useState(false);

  // Pagination states
  const [totalSources, setTotalSources] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Bulk delete states
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref so WebSocket handler can trigger a knowledge reload without stale closure
  const refreshKnowledgeRef = useRef<(() => void) | null>(null);

  const [stats, setStats] = useState({ completed: 0, processing: 0, failed: 0 });

  // 1. Fetch bots on mount
  useEffect(() => {
    async function loadBots() {
      try {
        const res = await botService.getBots();
        if (res.success && res.data) {
          setBots(res.data);
          if (res.data.length > 0) {
            setSelectedBotId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load bots", err);
        setError("Could not load bots. Please try again.");
      } finally {
        setIsBotsLoading(false);
      }
    }
    loadBots();
  }, []);

  // 3. Fetch knowledge sources when selected bot or page changes
  useEffect(() => {
    if (!selectedBotId) return;

    const loadKnowledge = async () => {
      setIsKnowledgeLoading(true);
      setError(null);
      try {
        const res = await botService.getBotKnowledge(
          selectedBotId,
          (currentPage - 1) * pageSize,
          pageSize
        );
        if (res.success && res.data) {
          setKnowledgeSources(res.data.items);
          setTotalSources(res.data.total);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        } else {
          setKnowledgeSources([]);
          setTotalSources(0);
        }
      } catch (err) {
        console.error("Failed to load bot knowledge sources", err);
        setError("Failed to load existing knowledge sources for this bot.");
      } finally {
        setIsKnowledgeLoading(false);
      }
    };
    // Assign to ref so WebSocket can call it
    refreshKnowledgeRef.current = loadKnowledge;
    loadKnowledge();
  }, [selectedBotId, currentPage]);

  // 4. WebSocket for live ingestion updates
  useEffect(() => {
    if (!selectedBotId) return;

    let socket: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000"}/api/v1/ws/ingestion/${selectedBotId}${
        token ? `?token=${token}` : ""
      }`;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received ingestion WS update:", data);
          const { source_id, status, progress } = data;

          // If a crawl started or completed, refresh the full knowledge list
          const source_name: string = data.source_name || "";
          if (source_name.startsWith("Crawling:") || (status === "completed" && !source_id)) {
            if (refreshKnowledgeRef.current) {
              setTimeout(() => refreshKnowledgeRef.current?.(), 500);
            }
            return;
          }

          if (source_id) {
            setKnowledgeSources((prevSources) => {
              const exists = prevSources.some((s) => s.id === source_id);
              if (exists) {
                if (status === "completed" || status === "failed") {
                  setTimeout(() => refreshKnowledgeRef.current?.(), 800);
                }
                return prevSources.map((source) => {
                  if (source.id === source_id) {
                    return {
                      ...source,
                      status: status as KnowledgeSource["status"],
                      progress: progress,
                      error_message: data.error_message,
                    };
                  }
                  return source;
                });
              } else {
                const newSource: KnowledgeSource = {
                  id: source_id,
                  bot_id: selectedBotId,
                  source_type: "url",
                  source_name: data.source_name || "Crawled Page",
                  file_path: null,
                  url: data.url || null,
                  file_size: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  status: status as KnowledgeSource["status"],
                  progress: progress,
                  error_message: data.error_message,
                };
                setTotalSources((prev) => prev + 1);
                return [newSource, ...prevSources];
              }
            });
          }
        } catch (err) {
          console.error("Failed to parse ingestion WS message:", err);
        }
      };

      socket.onerror = (err) => {
        // Suppress repetitive error prints during dev idle states
      };

      socket.onclose = (event) => {
        reconnectTimeout = setTimeout(connectWS, 10000); // Back off reconnect timer to 10s
      };
    };

    connectWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [selectedBotId]);

  const selectedBot = bots.find((b) => b.id === selectedBotId);

  const formatBytes = (bytes: number | null, decimals = 1) => {
    if (bytes === null || bytes === undefined) return "N/A";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "N/A";
    let formattedStr = isoString;
    if (!formattedStr.endsWith("Z") && !formattedStr.match(/[+-]\d{2}:\d{2}$/)) {
      formattedStr = formattedStr + "Z";
    }
    const date = new Date(formattedStr);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleUploadFile = async (file: File) => {
    if (!selectedBotId) {
      setError("Please select or create a chatbot first before uploading files.");
      return;
    }

    setError(null);
    setSuccessMsg(null);

    const validExtensions = [".pdf", ".docx"];
    const validMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExt) && !validMimes.includes(file.type)) {
      setError("Unsupported format. Only PDF and DOCX files are allowed.");
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File is too large. Maximum size limit is 50MB.");
      return;
    }

    if (file.size === 0) {
      setError("File is empty.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await botService.uploadKnowledge(selectedBotId, file, (pct) => {
        setUploadProgress(pct);
      });

      if (res.success && res.data) {
        setKnowledgeSources((prev) => [res.data!.knowledge_source, ...prev.slice(0, pageSize - 1)]);
        setTotalSources((prev) => prev + 1);
        setSuccessMsg(`Successfully uploaded "${file.name}" to knowledge base.`);
        setError(null);
      } else {
        setError(res.error?.message || "Failed to upload file to the server.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred while uploading.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId) {
      setError("Please select or create a chatbot first before starting a crawl.");
      return;
    }

    if (!crawlUrl) {
      setError("Please enter a URL to crawl.");
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (!urlPattern.test(crawlUrl)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsCrawling(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await botService.crawlUrl(selectedBotId, crawlUrl, crawlDepth);
      if (res.success && res.data) {
        setSuccessMsg(`Successfully queued crawl job for: ${crawlUrl}. Discovered pages will automatically appear below.`);
        setCrawlUrl("");

        setTimeout(async () => {
          try {
            const kRes = await botService.getBotKnowledge(selectedBotId, 0, pageSize);
            if (kRes.success && kRes.data) {
              setKnowledgeSources(kRes.data.items);
              setTotalSources(kRes.data.total);
              setCurrentPage(1);
            }
          } catch (err) {
            console.error("Failed to reload knowledge sources", err);
          }
        }, 1500);
      } else {
        setError(res.error?.message || "Failed to start crawl job.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred while starting crawl.");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleToggleSelect = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  };

  const isAllPageSelected =
    knowledgeSources.length > 0 &&
    knowledgeSources.every((s) => selectedSourceIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedSourceIds((prev) => prev.filter((id) => !knowledgeSources.some((s) => s.id === id)));
    } else {
      const newSelections = knowledgeSources.map((s) => s.id).filter((id) => !selectedSourceIds.includes(id));
      setSelectedSourceIds((prev) => [...prev, ...newSelections]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSourceIds.length === 0 || !selectedBotId) return;
    setIsBulkDeleting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await botService.bulkDeleteKnowledge(selectedBotId, selectedSourceIds);
      if (res.success && res.data) {
        setSuccessMsg(`Successfully deleted ${res.data.deleted_count} selected sources.`);
        const deletedCount = selectedSourceIds.length;
        setSelectedSourceIds([]);
        setShowDeleteModal(false);
        const remainingTotal = Math.max(totalSources - deletedCount, 0);
        setTotalSources(remainingTotal);
        const maxPages = Math.max(Math.ceil(remainingTotal / pageSize), 1);
        if (currentPage > maxPages) {
          setCurrentPage(maxPages);
        } else {
          const kRes = await botService.getBotKnowledge(selectedBotId, (currentPage - 1) * pageSize, pageSize);
          if (kRes.success && kRes.data) {
            setKnowledgeSources(kRes.data.items);
            setTotalSources(kRes.data.total);
          }
        }
      } else {
        setError(res.error?.message || "Failed to bulk delete knowledge sources.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred while bulk deleting.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40";
      case "processing":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 animate-pulse";
      case "failed":
        return "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40";
      default:
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40";
    }
  };

  // Computed stats from backend payload or fallback to current page filtering
  const completedCount = stats.completed || knowledgeSources.filter((s) => s.status === "completed").length;
  const processingCount = stats.processing || knowledgeSources.filter(
    (s) => s.status === "processing" || s.status === "queued" || (s.source_name && s.source_name.startsWith("Crawling:"))
  ).length;
  const failedCount = stats.failed || knowledgeSources.filter((s) => s.status === "failed").length;

  if (isBotsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-5">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading Knowledge Base</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fetching your bots configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-2">
      {/* ── Premium Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 shadow-xl border border-indigo-900/30">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-6 opacity-10">
          <Sparkles className="h-28 w-28 text-indigo-300" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div className="h-px w-16 bg-gradient-to-r from-indigo-500/60 to-transparent" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Knowledge Base</h1>
            <p className="text-sm text-indigo-200/60 mt-1.5 max-w-lg">
              Train your AI chatbots by uploading PDF / DOCX documents or crawling websites into their knowledge base.
            </p>
          </div>

          {bots.length > 0 ? (
            <div className="shrink-0 w-full md:w-auto">
              <label htmlFor="bot-select" className="block text-xs font-semibold text-indigo-300/70 mb-1.5 uppercase tracking-wider">
                Active Chatbot
              </label>
              <select
                id="bot-select"
                value={selectedBotId}
                onChange={(e) => { setSelectedBotId(e.target.value); setCurrentPage(1); setSelectedSourceIds([]); }}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer w-full md:min-w-[220px] shadow-sm transition hover:bg-white/15"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                    {b.name} {b.is_active ? "" : "(Inactive)"}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <a href="/bots" className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200">
              Create Your First Bot <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Stat Cards */}
        {bots.length > 0 && (
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Total Sources", value: totalSources, icon: Database, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
              { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Processing", value: processingCount, icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { label: "Failed", value: failedCount, icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl ${stat.bg} border ${stat.border} p-3 sm:p-4 backdrop-blur-sm flex items-center gap-2 sm:gap-3`}>
                <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-white/50 font-medium truncate">{stat.label}</p>
                  <p className={`text-lg sm:text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── No Bots Empty State ── */}
      {bots.length === 0 ? (
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 p-14 text-center flex flex-col items-center shadow-sm">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 animate-bounce">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Chatbots</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
            You need to create a chatbot profile first before you can train it with custom knowledge materials.
          </p>
          <a href="/bots" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition duration-200">
            <Zap className="h-4 w-4" /> Create Your First Bot
          </a>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Main Panel ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Pill Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
              {(["file", "url"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setActiveTab(tab); setError(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2.5 px-5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {tab === "file" ? <><UploadCloud className="h-4 w-4" /> Upload Files</> : <><Globe className="h-4 w-4" /> Crawl Website</>}
                  </span>
                </button>
              ))}
            </div>

            {activeTab === "file" ? (
              <div
                onDragOver={isUploading ? undefined : handleDragOver}
                onDragLeave={isUploading ? undefined : handleDragLeave}
                onDrop={isUploading ? undefined : handleDrop}
                onClick={isUploading ? undefined : () => fileInputRef.current?.click()}
                className={`relative group rounded-2xl border-2 p-6 sm:p-12 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xl shadow-indigo-500/10 scale-[1.01]"
                    : "border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10"
                } ${isUploading ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx" disabled={isUploading} className="hidden" />
                <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-80 transition-all duration-500">
                  <Sparkles className={`h-6 w-6 text-indigo-400 ${isDragActive ? "animate-spin" : "animate-pulse"}`} />
                </div>
                <div className="absolute bottom-4 left-4 opacity-10 group-hover:opacity-40 transition-all duration-500">
                  <Shield className="h-5 w-5 text-violet-400" />
                </div>
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 border transition-all duration-300 ${
                  isDragActive ? "bg-indigo-500 border-indigo-400 shadow-lg shadow-indigo-500/30 scale-110"
                  : isUploading ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100/30 dark:border-indigo-900"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 group-hover:scale-105 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 group-hover:border-indigo-200"
                }`}>
                  {isUploading
                    ? <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    : <UploadCloud className={`h-8 w-8 ${isDragActive ? "text-white" : "text-indigo-500 dark:text-indigo-400"}`} />
                  }
                </div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">
                  {isUploading ? "Uploading training document..." : isDragActive ? "Drop it here!" : `Train ${selectedBot?.name || "Chatbot"}`}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
                  Drag and drop your knowledge materials or click to browse local files.
                </p>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                  ✦ PDF and DOCX up to 50MB
                </span>
                {isUploading && uploadProgress !== null && (
                  <div className="w-full max-w-sm mt-6">
                    <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
                      <span>Uploading...</span><span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleStartCrawl} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Web Crawler</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Auto-discover and ingest content from any website</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="url-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Start URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="url" id="url-input" required placeholder="https://example.com/docs"
                      value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} disabled={isCrawling}
                      className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">The crawler respects robots.txt and will not crawl disallowed pages.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="depth-select" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Crawl Depth</label>
                  <select
                    id="depth-select" value={crawlDepth} onChange={(e) => setCrawlDepth(parseInt(e.target.value))} disabled={isCrawling}
                    className="block w-full px-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition cursor-pointer"
                  >
                    <option value={0}>Depth 0: Single page only</option>
                    <option value={1}>Depth 1: Page + direct links</option>
                    <option value={2}>Depth 2: Deep recursive crawl</option>
                  </select>
                </div>
                <button
                  type="submit" disabled={isCrawling}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-75 transition duration-200 cursor-pointer"
                >
                  {isCrawling ? <><Loader2 className="h-4 w-4 animate-spin" /> Queuing crawl job...</> : <><Globe className="h-4 w-4" /> Start Crawling</>}
                </button>
              </form>
            )}

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-400 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div><span className="font-bold text-sm block mb-0.5">Error</span><p className="text-xs">{error}</p></div>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3 text-emerald-700 dark:text-emerald-400 shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
                <div><span className="font-bold text-sm block mb-0.5">Success</span><p className="text-xs">{successMsg}</p></div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/20 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-500" /> Chatbot Details
                </h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Name</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{selectedBot?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    selectedBot?.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
                      : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}>
                    {selectedBot?.is_active ? "● Active" : "○ Inactive"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total Sources</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">{totalSources}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/10 p-5 space-y-3">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Tips for better results
              </h4>
              <ul className="space-y-2.5">
                {[
                  { icon: FileText, text: "PDF & DOCX give the most accurate results" },
                  { icon: Globe, text: "Use Depth 2 to crawl large websites fully" },
                  { icon: TrendingUp, text: "More quality sources = smarter answers" },
                  { icon: Shield, text: "Remove outdated sources to improve accuracy" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2 text-xs text-indigo-700/70 dark:text-indigo-300/70">
                    <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Training Materials Table ── */}
      {bots.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950/50 dark:to-transparent">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-indigo-500" /> Uploaded Training Materials
            </h2>
            <div className="flex items-center gap-3">
              {selectedSourceIds.length > 0 && (
                <button
                  type="button" onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedSourceIds.length})
                </button>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                Total: {totalSources} sources
              </div>
            </div>
          </div>

          {isKnowledgeLoading ? (
            <div className="flex flex-col justify-center items-center py-24 gap-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading training materials...</p>
            </div>
          ) : knowledgeSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/30 flex items-center justify-center mb-5 border border-slate-100 dark:border-slate-800">
                <BookOpen className="h-8 w-8 text-indigo-400/80" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">No knowledge sources yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Upload PDF/DOCX files or crawl a website above to begin training your bot&apos;s intelligence.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-4 w-12 text-center">
                      <input type="checkbox" checked={isAllPageSelected} onChange={handleToggleSelectAll} className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                    </th>
                    <th scope="col" className="px-5 py-4">Name</th>
                    <th scope="col" className="px-5 py-4">Type</th>
                    <th scope="col" className="px-5 py-4">Size</th>
                    <th scope="col" className="px-5 py-4">Uploaded</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {knowledgeSources.map((source) => {
                    const isActive =
                      source.status === "processing" ||
                      source.status === "queued" ||
                      (source.source_name && source.source_name.startsWith("Crawling:"));
                    const rowAccent =
                      source.status === "completed" ? "border-l-emerald-400" :
                      source.status === "failed" ? "border-l-rose-400" :
                      isActive ? "border-l-amber-400" : "border-l-indigo-400";
                    return (
                      <tr key={source.id} className={`group hover:bg-slate-50/60 dark:hover:bg-slate-950/30 transition-all duration-150 border-l-2 ${rowAccent}`}>
                        <td className="px-5 py-4 w-12 text-center">
                          <input type="checkbox" checked={selectedSourceIds.includes(source.id)} onChange={() => handleToggleSelect(source.id)} className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white max-w-xs sm:max-w-sm" title={source.source_name}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                              source.source_type === "url"
                                ? "bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/30"
                                : "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30"
                            }`}>
                              {source.source_type === "url" ? <Globe className="h-4 w-4 text-sky-500" /> : <FileText className="h-4 w-4 text-indigo-500" />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm">{source.source_name}</p>
                              {isActive && (
                                <div className="mt-1.5 w-full max-w-[180px]">
                                  <div className="w-full bg-amber-100 dark:bg-amber-900/20 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full transition-all duration-500 animate-pulse" style={{ width: `${source.progress ?? 25}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            source.source_type === "url"
                              ? "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-200/50 dark:border-sky-900/30"
                              : source.source_type === "pdf"
                              ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30"
                              : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30"
                          }`}>
                            {source.source_type}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {formatBytes(source.file_size)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(source.created_at)}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="space-y-1.5 max-w-[140px]">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(source.status)}`}>
                              {source.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                              {source.status === "failed" && <XCircle className="h-3 w-3" />}
                              {(source.status === "processing" || source.status === "queued") && <Loader2 className="h-3 w-3 animate-spin" />}
                              {source.status}
                            </span>
                            {source.status === "failed" && source.error_message && (
                              <p className="text-[10px] text-rose-500 dark:text-rose-400 truncate" title={source.error_message}>{source.error_message}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalSources)}</span> of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{totalSources}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setCurrentPage((p) => Math.max(p - 1, 1)); setSelectedSourceIds([]); }}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >← Prev</button>
                  <span className="text-xs font-bold text-slate-900 dark:text-white px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30">
                    {currentPage} / {Math.max(Math.ceil(totalSources / pageSize), 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setCurrentPage((p) => Math.min(p + 1, Math.ceil(totalSources / pageSize))); setSelectedSourceIds([]); }}
                    disabled={currentPage * pageSize >= totalSources}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-7 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Sources?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You are about to permanently delete <span className="font-extrabold text-rose-600">{selectedSourceIds.length}</span> knowledge source{selectedSourceIds.length > 1 ? "s" : ""}. All associated vectors and files will be removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button" onClick={() => setShowDeleteModal(false)} disabled={isBulkDeleting}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >Cancel</button>
              <button
                type="button" onClick={handleBulkDelete} disabled={isBulkDeleting}
                className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-500/25 transition cursor-pointer disabled:opacity-75 flex items-center gap-2"
              >
                {isBulkDeleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="h-4 w-4" /> Delete Permanently</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
