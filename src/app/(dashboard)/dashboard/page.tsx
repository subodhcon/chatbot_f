"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  MessageSquare,
  BookOpen,
  BarChart3,
  Loader2,
  Upload,
  Cpu,
  Search,
  Layers,
  Zap,
  Quote,
  ArrowDown,
  CheckCircle2,
  UserCircle2,
  FileText,
  Globe,
  FileType2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { analyticsService, AnalyticsSummary } from "@/services/analytics";

// ── Flow step definition ──────────────────────────────────────────────────────
interface FlowStep {
  id: string;
  icon: React.ElementType;
  label: string;
  sublabel: string;
  detail: string;
  actor: "admin" | "system" | "visitor";
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  tags?: string[];
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: "admin",
    icon: UserCircle2,
    label: "Admin",
    sublabel: "Uploads knowledge source",
    detail:
      "Admin logs into the dashboard and uploads a PDF, DOCX, or provides a URL to crawl. The file is stored securely on disk with metadata saved to the database.",
    actor: "admin",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    badgeColor: "bg-violet-500/20 text-violet-300",
    tags: ["PDF", "DOCX", "URL"],
  },
  {
    id: "ingestion",
    icon: Upload,
    label: "Document Processed",
    sublabel: "Extract → Chunk → Embed",
    detail:
      "A background Celery worker picks up the ingestion job, extracts text (PyMuPDF / python-docx / crawler), splits it into overlapping chunks, and generates OpenAI embeddings. Progress is published to Redis pubsub.",
    actor: "system",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    badgeColor: "bg-indigo-500/20 text-indigo-300",
    tags: ["Celery", "pgvector", "OpenAI Embeddings"],
  },
  {
    id: "question",
    icon: MessageSquare,
    label: "Visitor Asks Question",
    sublabel: "Via chat widget or public URL",
    detail:
      "A visitor opens the public chat URL or embedded widget, starts a session, and types a question. The message is saved to the conversation history and sent to the AI pipeline.",
    actor: "visitor",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    badgeColor: "bg-cyan-500/20 text-cyan-300",
    tags: ["WebSocket", "REST API"],
  },
  {
    id: "retrieval",
    icon: Search,
    label: "Relevant Chunks Retrieved",
    sublabel: "Embedding → HNSW similarity search",
    detail:
      "The question is embedded with the same OpenAI model. A pgvector HNSW index performs cosine similarity search, returning the top-K most relevant chunks above the configured similarity threshold.",
    actor: "system",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    badgeColor: "bg-amber-500/20 text-amber-300",
    tags: ["pgvector", "HNSW", "Cosine similarity"],
  },
  {
    id: "generation",
    icon: Cpu,
    label: "AI Generates Answer",
    sublabel: "Confidence scored → Tone applied → Streamed",
    detail:
      "The system prompt is built with tone, greeting context, retrieval rules, and fallback instruction from the bot config. Retrieved chunks are injected into the user prompt. OpenAI streams the completion token-by-token via WebSocket.",
    actor: "system",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
    tags: ["GPT-4o", "Streaming", "ConfidenceScore"],
  },
  {
    id: "citations",
    icon: Quote,
    label: "Sources Shown",
    sublabel: "Citations displayed below response",
    detail:
      "After the stream completes, the citation list is delivered. Each citation shows the source document name, type badge, and a direct link for URL sources. Low-confidence replies show an escalation CTA.",
    actor: "visitor",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    badgeColor: "bg-rose-500/20 text-rose-300",
    tags: ["Citations", "Escalation", "Fallback"],
  },
];

const ACTOR_LABELS: Record<FlowStep["actor"], string> = {
  admin: "Admin action",
  system: "System",
  visitor: "Visitor action",
};

const SOURCE_ICONS: { icon: React.ElementType; label: string; color: string }[] = [
  { icon: FileText, label: "PDF", color: "text-red-400" },
  { icon: FileType2, label: "DOCX", color: "text-blue-400" },
  { icon: Globe, label: "URL", color: "text-emerald-400" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [animatedStep, setAnimatedStep] = useState<number>(-1);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await analyticsService.getAnalyticsSummary();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();

    // Auto-refresh stats every 60 seconds (refresh within 5-minute cache window)
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);


  // Cascade animation on mount
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setAnimatedStep(i);
      i++;
      if (i >= FLOW_STEPS.length) clearInterval(interval);
    }, 160);
    return () => clearInterval(interval);
  }, []);

  const activeStepData = FLOW_STEPS.find((s) => s.id === activeStep);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Welcome back, {user?.name || "User"}{" "}
            <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor chatbot activities, configure knowledge bases, and view
            conversation metrics.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Active Chatbots",
            value: isLoading ? null : (stats?.active_chatbots ?? 0).toString(),
            icon: Bot,
            color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
          },
          {
            label: "Conversations (24h)",
            value: isLoading
              ? null
              : (stats?.conversations_24h ?? 0).toString(),
            icon: MessageSquare,
            color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          },
          {
            label: "Knowledge Docs",
            value: isLoading
              ? null
              : (stats?.knowledge_docs ?? 0).toString(),
            icon: BookOpen,
            color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
          },
          {
            label: "Success Rate",
            value: isLoading ? null : stats?.success_rate ?? "100.0%",
            icon: BarChart3,
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <div className={`rounded-lg border p-2 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center min-h-[36px]">
              {card.value === null ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <span className="text-3xl font-bold text-slate-950 dark:text-white">
                  {card.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── RAG Pipeline Flow Diagram ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Section header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Pipeline Flow
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              End-to-end journey from document upload to cited AI answer
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>

        <div className="p-6 flex flex-col lg:flex-row gap-6">
          {/* ── Step list ── */}
          <div className="flex flex-col gap-0 flex-1 min-w-0">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isVisible = idx <= animatedStep;

              return (
                <div key={step.id} className="flex flex-col">
                  {/* Step card */}
                  <button
                    onClick={() =>
                      setActiveStep(isActive ? null : step.id)
                    }
                    className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left cursor-pointer
                      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
                      ${
                        isActive
                          ? `${step.bgColor} ${step.borderColor} shadow-sm`
                          : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    style={{ transition: `opacity 0.3s ${idx * 0.07}s, transform 0.3s ${idx * 0.07}s, background 0.15s, border 0.15s` }}
                  >
                    {/* Step number */}
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors duration-200
                        ${isActive ? `${step.bgColor} ${step.borderColor} ${step.color}` : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold transition-colors duration-150 ${
                            isActive
                              ? step.color
                              : "text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${step.badgeColor}`}
                        >
                          {ACTOR_LABELS[step.actor]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {step.sublabel}
                      </p>
                    </div>

                    {/* Status dot */}
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                        isActive ? step.color : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  </button>

                  {/* Connector arrow */}
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="flex justify-start pl-8 py-0.5">
                      <ArrowDown className="h-4 w-4 text-slate-300 dark:text-slate-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Detail panel ── */}
          <div className="w-full lg:w-80 shrink-0">
            {activeStepData ? (
              <div
                className={`rounded-xl border p-5 h-full flex flex-col gap-4 transition-all duration-200 ${activeStepData.bgColor} ${activeStepData.borderColor}`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center border ${activeStepData.bgColor} ${activeStepData.borderColor} ${activeStepData.color}`}
                  >
                    <activeStepData.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${activeStepData.color}`}>
                      {activeStepData.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeStepData.sublabel}
                    </p>
                  </div>
                </div>

                {/* Detail text */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeStepData.detail}
                </p>

                {/* Tags */}
                {activeStepData.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {activeStepData.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${activeStepData.badgeColor}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Source type icons for admin step */}
                {activeStepData.id === "admin" && (
                  <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                    {SOURCE_ICONS.map(({ icon: SIcon, label, color }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <SIcon className={`h-3.5 w-3.5 ${color}`} />
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-5 h-full flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Select a step
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                    Click any step in the flow to see what happens under the hood.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer legend */}
        <div className="flex items-center gap-6 px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex-wrap">
          {[
            { color: "bg-violet-500", label: "Admin action" },
            { color: "bg-slate-500", label: "System (automated)" },
            { color: "bg-cyan-500", label: "Visitor action" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className={`h-2 w-2 rounded-full ${color}`} />
              {label}
            </div>
          ))}
          <div className="ml-auto text-xs text-slate-400 dark:text-slate-600">
            {FLOW_STEPS.length} pipeline stages
          </div>
        </div>
      </div>
    </div>
  );
}
