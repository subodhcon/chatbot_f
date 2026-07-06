"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  Bot as BotIcon,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import { botService } from "@/services/bot";
import type { Bot } from "@/services/bot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BotForm from "@/components/BotForm";
import type { BotFormData } from "@/components/BotForm";
import {
  Card,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BotsPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperadmin = user?.role === "superadmin";

  // Lists and loading
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6; // Bots per page
  const [hasMore, setHasMore] = useState(false);

  // Modal Open/Close states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active items for editing/deleting
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  // Copy state
  const [copiedBotId, setCopiedBotId] = useState<string | null>(null);

  const handleCopyShareLink = (botId: string) => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/chat/${botId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedBotId(botId);
      setTimeout(() => setCopiedBotId(null), 2000);
    }
  };

  // Form States
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch Bots handler
  const fetchBots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * limit;
      // Fetch limit + 1 to check for next page presence
      const response = await botService.getBots(skip, limit + 1);

      if (response.success && response.data) {
        const data = response.data;
        if (data.length > limit) {
          setHasMore(true);
          setBots(data.slice(0, limit));
        } else {
          setHasMore(false);
          setBots(data);
        }
      } else {
        setError(response.error?.message || "Failed to load bots.");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit]);

  // Initial and page-change fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBots();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBots]);

  // Create Bot handler
  const handleCreateBot = async (formData: BotFormData) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await botService.createBot(formData);

      if (response.success && response.data) {
        setSuccessMessage(`Bot "${response.data.name}" created successfully!`);
        setIsCreateOpen(false);
        fetchBots();
      } else {
        setError(response.error?.message || "Failed to create bot.");
      }
    } catch {
      setError("Failed to create bot due to a network connection issue.");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Bot opener helper
  const openEditModal = (bot: Bot) => {
    setSelectedBot(bot);
    setIsEditOpen(true);
  };

  // Edit Bot handler
  const handleEditBot = async (formData: BotFormData) => {
    if (!selectedBot) return;

    setActionLoading(true);
    setError(null);
    try {
      const response = await botService.updateBot(selectedBot.id, formData);

      if (response.success && response.data) {
        setSuccessMessage(`Bot "${response.data.name}" updated successfully!`);
        setIsEditOpen(false);
        setSelectedBot(null);
        fetchBots();
      } else {
        setError(response.error?.message || "Failed to update bot.");
      }
    } catch {
      setError("Failed to update bot due to a network connection issue.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Bot opener helper
  const openDeleteModal = (bot: Bot) => {
    setSelectedBot(bot);
    setDeleteConfirmName("");
    setIsDeleteOpen(true);
  };

  // Delete Bot handler
  const handleDeleteBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBot) return;

    if (deleteConfirmName !== selectedBot.name) {
      setError("Confirmation name does not match the bot's name.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const response = await botService.deleteBot(selectedBot.id, deleteConfirmName);

      if (response.success) {
        setSuccessMessage(`Bot "${selectedBot.name}" deleted successfully!`);
        setIsDeleteOpen(false);
        setSelectedBot(null);
        setDeleteConfirmName("");
        fetchBots();
      } else {
        setError(response.error?.message || "Failed to delete bot.");
      }
    } catch {
      setError("Failed to delete bot due to a network connection issue.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Messages */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-5">
            <Check className="h-5 w-5 shrink-0 text-emerald-500" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-5">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <BotIcon className="h-8 w-8" />
            </div>
            My Chatbots
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Create, deploy, and manage your custom AI chatbot assistants.
          </p>
        </div>
        {isSuperadmin && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 shadow-lg shadow-indigo-500/10"
          >
            <Plus className="h-4 w-4" />
            Create Bot
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        // Skeleton cards loading state
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col justify-between min-h-[220px]">
              <CardHeader className="space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardHeader>
              <CardFooter className="flex justify-between gap-2 border-t border-slate-50 dark:border-slate-900 pt-4">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : bots.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center bg-slate-50/50 dark:bg-slate-900/10 backdrop-blur-sm">
          <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-500 mb-4 animate-bounce">
            <BotIcon className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No chatbots found</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isSuperadmin 
              ? "You haven't created any chatbot assistants yet. Get started by clicking the \"Create Bot\" button above!"
              : "You don't have any chatbot assistants assigned to you yet. Please contact a superadmin to link a chatbot."}
          </p>
          {isSuperadmin && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="mt-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Bot
            </Button>
          )}
        </div>
      ) : (
        // Bots Grid
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <Card
                key={bot.id}
                className="group relative flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:shadow-md hover:border-indigo-500/30 dark:hover:border-indigo-500/20"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Bot Avatar */}
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-900/50">
                      {bot.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={bot.avatar_url}
                          alt={bot.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <BotIcon className="h-6 w-6" />
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(bot)}
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        title="Edit Bot"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isSuperadmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteModal(bot)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="Delete Bot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {bot.name}
                      </h3>
                      <Badge variant={bot.is_active ? "success" : "secondary"}>
                        {bot.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1 truncate">
                      /{bot.slug}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Created: {new Date(bot.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardHeader>

                {/* Card footer links to agent playground/details */}
                <CardFooter className="pt-4 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between gap-2">
                  <Link
                    href={`/bots/${bot.id}/config`}
                    className="text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-900 dark:hover:bg-indigo-950/30 px-3 py-1.5 rounded-lg transition"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Configure
                  </Link>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopyShareLink(bot.id)}
                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                      title="Copy public chat URL"
                    >
                      {copiedBotId === bot.id ? "Copied!" : "Copy Link"}
                    </button>

                    <Link
                      href={`/chat/${bot.id}`}
                      target="_blank"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      Test Chat <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
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
                <ChevronLeft className="h-4 w-4" />
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
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              Create New Bot
            </DialogTitle>
            <DialogDescription>
              Add a new custom chatbot assistant to your project.
            </DialogDescription>
          </DialogHeader>

          <BotForm
            onSubmit={handleCreateBot}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={actionLoading}
            submitLabel="Create Bot"
          />
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setSelectedBot(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-500" />
              Edit Chatbot Settings
            </DialogTitle>
            <DialogDescription>
              Update your chatbot assistant settings.
            </DialogDescription>
          </DialogHeader>

          <BotForm
            initialValues={{
              name: selectedBot?.name || "",
              avatar_url: selectedBot?.avatar_url || "",
              is_active: selectedBot?.is_active ?? true,
            }}
            onSubmit={handleEditBot}
            onCancel={() => {
              setIsEditOpen(false);
              setSelectedBot(null);
            }}
            isLoading={actionLoading}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedBot(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-650">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Chatbot
            </DialogTitle>
            <DialogDescription>
              Permanently delete this chatbot from the system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteBot} className="space-y-4 mt-4">
            <div className="rounded-xl bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 p-4">
              <p className="text-sm font-semibold">Warning: This action is permanent!</p>
              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
                Deleting this bot will also remove all associated configurations and training snapshots. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-350">
                Please type <span className="font-bold text-slate-900 dark:text-white">&quot;{selectedBot?.name}&quot;</span> to confirm deletion:
              </p>
              <Input
                type="text"
                required
                placeholder="Type the bot name here"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-900 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedBot(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={actionLoading || deleteConfirmName !== selectedBot?.name}
                className="min-w-[150px]"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete Bot Permanently"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
