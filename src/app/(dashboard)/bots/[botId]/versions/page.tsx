"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  RotateCcw, 
  Eye, 
  Calendar, 
  Check, 
  AlertCircle, 
  History
} from "lucide-react";
import Link from "next/link";
import { botService, Bot as BotType, BotVersion } from "@/services/bot";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatbotPreview from "@/components/ChatbotPreview";

interface PageProps {
  params: Promise<{ botId: string }>;
}

export default function BotVersionHistoryPage({ params }: PageProps) {
  const { botId } = use(params);
  const router = useRouter();

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bot Info & Version Lists
  const [bot, setBot] = useState<BotType | null>(null);
  const [versions, setVersions] = useState<BotVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BotVersion | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(false);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initial Fetching
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * limit;
      // Fetch bot details and versions in parallel
      const [botResponse, versionsResponse] = await Promise.all([
        botService.getBot(botId),
        botService.getBotVersions(botId, skip, limit + 1), // fetch limit + 1 to see if hasMore
      ]);

      if (botResponse.success && botResponse.data) {
        setBot(botResponse.data);
      } else {
        setError(botResponse.error?.message || "Failed to load bot details.");
      }

      if (versionsResponse.success && versionsResponse.data) {
        const data = versionsResponse.data.versions;
        if (data.length > limit) {
          setHasMore(true);
          setVersions(data.slice(0, limit));
        } else {
          setHasMore(false);
          setVersions(data);
        }

        // Auto-select latest version on page load if none selected
        if (data.length > 0 && !selectedVersion) {
          setSelectedVersion(data[0]);
        }
      } else {
        setError(versionsResponse.error?.message || "Failed to load version history.");
      }
    } catch {
      setError("An unexpected network error occurred while loading history.");
    } finally {
      setLoading(false);
    }
  }, [botId, currentPage, limit, selectedVersion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Restore Handler
  const handleRestore = async (version: BotVersion) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await botService.restoreBotVersion(botId, version.id);

      if (response.success) {
        setSuccess(`Restored config to Version v${version.version_number}! Created new snapshot.`);
        // Refresh version list and auto-select new latest version
        setSelectedVersion(null);
        fetchData();
      } else {
        setError(response.error?.message || "Failed to restore version.");
      }
    } catch {
      setError("Failed to restore version due to a network connection issue.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
        {success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-5">
            <Check className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Header and Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Link href="/bots" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition">
            Chatbots
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white truncate">{bot?.name || "Loading..."}</span>
          <span>/</span>
          <span className="text-slate-400 dark:text-slate-500">Version History</span>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/bots")}
            className="rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <History className="h-7 w-7 text-indigo-500" />
              Version History
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse configuration snapshots, preview historic states, and restore configurations instantly.
            </p>
          </div>
        </div>
      </div>

      {loading && versions.length === 0 ? (
        // Loading skeleton
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="h-[460px] rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse" />
        </div>
      ) : versions.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm">
          <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-500 mb-4">
            <History className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No snapshots recorded</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            This chatbot doesn&apos;t have any saved version entries. Modifying the bot&apos;s conversational setup will automatically generate history snapshots.
          </p>
          <Button
            onClick={() => router.push(`/bots/${botId}/config`)}
            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Configure Bot Settings
          </Button>
        </div>
      ) : (
        // Main view
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Versions Table List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  Available Snapshots
                </CardTitle>
                <CardDescription>
                  Select a snapshot to preview its values and restore configuration.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-3.5">Version</th>
                        <th className="px-6 py-3.5">Timestamp</th>
                        <th className="px-6 py-3.5">Tone</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                      {versions.map((ver) => {
                        const isSelected = selectedVersion?.id === ver.id;
                        const isRestoredSource = ver.snapshot_json?.restored_from_version as number | undefined;

                        return (
                          <tr
                            key={ver.id}
                            onClick={() => setSelectedVersion(ver)}
                            className={`cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${
                              isSelected ? "bg-indigo-50/10 dark:bg-indigo-950/10" : ""
                            }`}
                          >
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                              <span className="flex items-center gap-1.5">
                                v{ver.version_number}
                                {isRestoredSource && (
                                  <span className="text-[10px] font-normal text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1 py-0.5" title={`Restored from v${isRestoredSource}`}>
                                    Restored
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1.5 text-xs">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {new Date(ver.created_at).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="capitalize text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full px-2 py-0.5">
                                {ver.snapshot_json?.tone || "friendly"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedVersion(ver)}
                                  className={isSelected ? "text-indigo-500 bg-indigo-500/5" : "text-slate-400"}
                                  title="Preview Configuration"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestore(ver)}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1 hover:border-indigo-500/50 hover:text-indigo-500"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Restore
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              {/* Pagination footer */}
              <CardFooter className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing page <span className="font-semibold text-slate-700 dark:text-slate-200">{currentPage}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-1.5"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-1.5"
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Configuration Preview Sidebar */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Snapshot Preview
              </h3>
              {selectedVersion ? (
                <div className="space-y-4">
                  {/* Dynamic Device Mockup preview */}
                  <ChatbotPreview
                    name={bot?.name || "AI Agent"}
                    avatarUrl={bot?.avatar_url || null}
                    greetingMessage={selectedVersion.snapshot_json?.welcome_message || ""}
                    fallbackMessage={selectedVersion.snapshot_json?.fallback_message}
                    tone={selectedVersion.snapshot_json?.tone || "friendly"}
                  />

                  {/* Summary card details */}
                  <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Snapshot Metadata
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <p>
                        Version number: <span className="font-bold text-slate-800 dark:text-slate-200">v{selectedVersion.version_number}</span>
                      </p>
                      <p>
                        Created at: <span>{new Date(selectedVersion.created_at).toLocaleString()}</span>
                      </p>
                      {typeof selectedVersion.snapshot_json?.restored_from_version === "number" && (
                        <p className="text-indigo-400">
                          Restored from version: v{selectedVersion.snapshot_json.restored_from_version}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                  Select a version to preview configuration
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
