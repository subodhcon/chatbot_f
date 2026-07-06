"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Globe
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

    async function loadKnowledge() {
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
    }
    loadKnowledge();
  }, [selectedBotId, currentPage]);

  // 3. Connect to WebSocket for real-time status updates
  useEffect(() => {
    if (!selectedBotId) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = () => {
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!accessToken) return;

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const wsBase = apiBase.replace(/^http/, "ws");
      const wsUrl = `${wsBase}/ws/ingestion/${selectedBotId}?token=${accessToken}`;

      console.log("Connecting ingestion WebSocket to:", wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received ingestion WS update:", data);
          const { source_id, status, progress } = data;

          if (source_id) {
            setKnowledgeSources((prevSources) =>
              prevSources.map((source) => {
                if (source.id === source_id) {
                  return {
                    ...source,
                    status: status as KnowledgeSource['status'],
                    progress: progress,
                    error_message: data.error_message,
                  };
                }
                return source;
              })
            );
          }
        } catch (err) {
          console.error("Failed to parse ingestion WS message:", err);
        }
      };

      socket.onerror = (err) => {
        console.error("Ingestion WebSocket error:", err);
      };

      socket.onclose = () => {
        console.log("Ingestion WebSocket closed, attempting reconnect...");
        reconnectTimeout = setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [selectedBotId]);

  const selectedBot = bots.find(b => b.id === selectedBotId);

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
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUploadFile = async (file: File) => {
    if (!selectedBotId) {
      setError("Please select or create a chatbot first before uploading files.");
      return;
    }

    setError(null);
    setSuccessMsg(null);

    // Validate type (PDF and DOCX only)
    const validExtensions = [".pdf", ".docx"];
    const validMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExt) && !validMimes.includes(file.type)) {
      setError("Unsupported format. Only PDF and DOCX files are allowed.");
      return;
    }

    // Validate size (50MB)
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

    // Simple URL format validation
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
        
        // Reload knowledge sources after a small delay to pick up the pending crawl job
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
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const isAllPageSelected =
    knowledgeSources.length > 0 &&
    knowledgeSources.every((s) => selectedSourceIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedSourceIds((prev) =>
        prev.filter((id) => !knowledgeSources.some((s) => s.id === id))
      );
    } else {
      const newSelections = knowledgeSources
        .map((s) => s.id)
        .filter((id) => !selectedSourceIds.includes(id));
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

        // Refresh current page or go back page if current page becomes empty
        const remainingTotal = Math.max(totalSources - deletedCount, 0);
        setTotalSources(remainingTotal);
        
        const maxPages = Math.max(Math.ceil(remainingTotal / pageSize), 1);
        if (currentPage > maxPages) {
          setCurrentPage(maxPages);
        } else {
          // Reload current page manually to get fresh paginated items
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
        return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/40";
      case "processing":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/40 animate-pulse";
      case "failed":
        return "bg-rose-50 dark:bg-rose-955/30 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/40";
      default:
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-250 dark:border-blue-900/40";
    }
  };

  if (isBotsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading bots configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Train your AI chatbots by uploading PDF or DOCX training documents to their knowledge base.
          </p>
        </div>

        {/* Bot selector */}
        {bots.length > 0 ? (
          <div className="flex items-center gap-3">
            <label htmlFor="bot-select" className="text-sm font-semibold text-slate-700 dark:text-slate-350 shrink-0">
              Select Chatbot:
            </label>
            <select
              id="bot-select"
              value={selectedBotId}
              onChange={(e) => {
                setSelectedBotId(e.target.value);
                setCurrentPage(1);
                setSelectedSourceIds([]);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px] shadow-sm transition"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.is_active ? "" : "(Inactive)"}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <a
            href="/bots"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-md transition-all duration-200"
          >
            Create Your First Bot <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>

      {bots.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm">
          <BookOpen className="h-16 w-16 text-indigo-400/80 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Chatbots</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
            You need to create a chatbot profile first before you can associate and train it with custom knowledge materials.
          </p>
          <a
            href="/bots"
            className="bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow transition duration-200"
          >
            Go to Bots Page
          </a>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main panel (takes 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Selector */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-px">
              <button
                type="button"
                onClick={() => { setActiveTab("file"); setError(null); setSuccessMsg(null); }}
                className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "file"
                    ? "border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300"
                }`}
              >
                Upload Files
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("url"); setError(null); setSuccessMsg(null); }}
                className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "url"
                    ? "border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300"
                }`}
              >
                Crawl Website
              </button>
            </div>

            {activeTab === "file" ? (
              /* Drag and Drop Zone */
              <div
                onDragOver={isUploading ? undefined : handleDragOver}
                onDragLeave={isUploading ? undefined : handleDragLeave}
                onDrop={isUploading ? undefined : handleDrop}
                onClick={isUploading ? undefined : () => fileInputRef.current?.click()}
                className={`relative group rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center transition-all duration-300 backdrop-blur-md ${
                  isDragActive 
                    ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 scale-[1.01]" 
                    : "border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 hover:bg-slate-50/30 dark:hover:bg-slate-950/10"
                } ${isUploading ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  disabled={isUploading}
                  className="hidden"
                />

                {/* Decorative sparkles */}
                <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition duration-300">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                </div>

                {isUploading ? (
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-4 border border-indigo-100/30 dark:border-indigo-900">
                    <Loader2 className="h-7 w-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center mb-4 border border-slate-100/50 dark:border-slate-700/50 group-hover:scale-105 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition duration-300">
                    <UploadCloud className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
                  </div>
                )}

                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1.5">
                  {isUploading ? "Uploading training document..." : `Train ${selectedBot?.name || "Chatbot"}`}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
                  Drag and drop your knowledge materials or click to browse local files. 
                  <span className="block mt-1 text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80">
                    Supports PDF and DOCX documents up to 50MB.
                  </span>
                </p>

                {/* Progress bar */}
                {isUploading && uploadProgress !== null && (
                  <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/20 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2 block">
                      {uploadProgress}% Uploaded
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* URL Crawl Form */
              <form onSubmit={handleStartCrawl} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <label htmlFor="url-input" className="block text-sm font-semibold text-slate-850 dark:text-slate-200">
                    Start URL
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      id="url-input"
                      required
                      placeholder="https://example.com/docs"
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      disabled={isCrawling}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                    />
                  </div>
                  <p className="text-xs text-slate-450 dark:text-slate-400 leading-normal">
                    Enter the URL from which the crawl should start. The crawler will respect robots.txt rules.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="depth-select" className="block text-sm font-semibold text-slate-850 dark:text-slate-200">
                    Crawl Depth
                  </label>
                  <select
                    id="depth-select"
                    value={crawlDepth}
                    onChange={(e) => setCrawlDepth(parseInt(e.target.value))}
                    disabled={isCrawling}
                    className="block w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition cursor-pointer"
                  >
                    <option value={0}>Depth 0: Page only</option>
                    <option value={1}>Depth 1: Page and direct links</option>
                    <option value={2}>Depth 2: Deep recursive crawl</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCrawling}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-550 hover:to-violet-550 text-white font-semibold text-sm py-3 rounded-xl shadow-md disabled:opacity-75 transition duration-200 cursor-pointer"
                >
                  {isCrawling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Starting crawl job...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" /> Start Crawling
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Error & Success Feedback alerts */}
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-955/20 border border-rose-200/50 dark:border-rose-900/55 rounded-2xl flex items-start gap-3 text-sm text-rose-700 dark:text-rose-400 shadow-sm animate-shake">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Error</span>
                  <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/55 rounded-2xl flex items-start gap-3 text-sm text-emerald-700 dark:text-emerald-400 shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <span className="font-semibold block mb-0.5">Succeeded</span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{successMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Bot stats card */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-indigo-500" /> chatbot Details
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                  <span className="text-slate-450 dark:text-slate-400">Name</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">{selectedBot?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                  <span className="text-slate-450 dark:text-slate-400">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    selectedBot?.is_active 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50" 
                      : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}>
                    {selectedBot?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                  <span className="text-slate-450 dark:text-slate-400">Total Uploaded Files</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{knowledgeSources.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded materials List (responsive table/list layout) */}
      {bots.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="h-5.5 w-5.5 text-slate-400" /> Uploaded Training Materials
            </h2>
            <div className="flex items-center gap-3">
              {selectedSourceIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-550 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition duration-150 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedSourceIds.length})
                </button>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
                Total: {totalSources} sources
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isKnowledgeLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
              </div>
            ) : knowledgeSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No custom knowledge uploaded yet</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  Provide custom training materials or crawl URLs above to build your bot&apos;s intelligence base.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-850">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 dark:border-slate-850 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                      </th>
                      <th scope="col" className="px-6 py-4">Name</th>
                      <th scope="col" className="px-6 py-4">Source Type</th>
                      <th scope="col" className="px-6 py-4">File Size</th>
                      <th scope="col" className="px-6 py-4">Upload Date</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350">
                    {knowledgeSources.map((source) => (
                      <tr key={source.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition duration-150">
                        {/* Checkbox Column */}
                        <td className="px-6 py-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(source.id)}
                            onChange={() => handleToggleSelect(source.id)}
                            className="rounded border-slate-300 dark:border-slate-850 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* Name Column */}
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-xs sm:max-w-md truncate" title={source.source_name}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 border border-indigo-100/30 dark:border-indigo-900/30">
                              {source.source_type === "url" ? (
                                <Globe className="h-4.5 w-4.5 text-indigo-500" />
                              ) : (
                                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                              )}
                            </div>
                            <span className="truncate">{source.source_name}</span>
                          </div>
                        </td>

                        {/* Source Type Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            source.source_type === "url"
                              ? "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-200/50 dark:border-sky-900/30"
                              : source.source_type === "pdf"
                              ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/30"
                              : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-250/50 dark:border-blue-900/30"
                          }`}>
                            {source.source_type}
                          </span>
                        </td>

                        {/* File Size Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {source.source_type === "url" ? "N/A" : formatBytes(source.file_size)}
                        </td>

                        {/* Upload Date Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {formatTime(source.created_at)}
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1.5 max-w-[150px]">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(source.status)}`}>
                              {source.status}
                            </span>
                            {source.status === "processing" && source.progress !== undefined && (
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${source.progress}%` }}
                                />
                              </div>
                            )}
                            {source.status === "failed" && source.error_message && (
                              <p className="text-[10px] text-rose-600 dark:text-rose-400 line-clamp-1 truncate" title={source.error_message}>
                                {source.error_message}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-850">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalSources)}</span> of{" "}
                    <span className="font-bold text-slate-900 dark:text-white">{totalSources}</span> entries
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage((prev) => Math.max(prev - 1, 1));
                        setSelectedSourceIds([]);
                      }}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-slate-850 dark:text-slate-200 px-2">
                      Page {currentPage} of {Math.max(Math.ceil(totalSources / pageSize), 1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalSources / pageSize)));
                        setSelectedSourceIds([]);
                      }}
                      disabled={currentPage * pageSize >= totalSources}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Custom Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-850 p-6 space-y-6 transform scale-100 transition-all duration-300">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-955/25 flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Bulk Deletion</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-650 dark:text-slate-300 leading-normal">
              Are you sure you want to delete the <span className="font-bold text-rose-600">{selectedSourceIds.length}</span> selected knowledge sources? Their raw files and ingestion records will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 transition duration-150 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-550 text-white shadow-md transition duration-150 cursor-pointer disabled:opacity-75 flex items-center gap-1.5"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
