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
  FileType,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { analyticsService, AnalyticsSummary } from "@/services/analytics";

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
    label: "Admin Action",
    sublabel: "Uploads knowledge sources",
    detail: "Admin logs in and uploads PDF / DOCX documents or configures website URL crawls to ingest domain data.",
    actor: "admin",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    badgeColor: "bg-violet-500/20 text-violet-300",
    tags: ["PDF", "DOCX", "URL Crawl"],
  },
  {
    id: "ingestion",
    icon: Upload,
    label: "Background Process",
    sublabel: "Extract → Chunk → Vectorize",
    detail: "A Celery task extracts raw text, segments text with overlapping chunks, and creates vector embeddings.",
    actor: "system",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    badgeColor: "bg-indigo-500/20 text-indigo-300",
    tags: ["Celery Workers", "pgvector Database"],
  },
  {
    id: "question",
    icon: MessageSquare,
    label: "Visitor Message",
    sublabel: "Dispatched via live web widgets",
    detail: "Visitors submit messages on embedded websites. Chats are logged and piped straight into the AI retrieval layer.",
    actor: "visitor",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    badgeColor: "bg-cyan-500/20 text-cyan-300",
    tags: ["WebSockets", "Rest API"],
  },
  {
    id: "retrieval",
    icon: Search,
    label: "Context Retrieval",
    sublabel: "Cosine similarity checks",
    detail: "The query gets embedded instantly. A pgvector similarity search fetches context matching relevant data chunks.",
    actor: "system",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    badgeColor: "bg-amber-500/20 text-amber-300",
    tags: ["Similarity Search", "HNSW Index"],
  },
  {
    id: "generation",
    icon: Cpu,
    label: "AI Generation",
    sublabel: "Response streaming",
    detail: "Context-enriched prompts get sent to OpenAI GPT models. Answers are generated using system tone and streamed live.",
    actor: "system",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
    tags: ["GPT LLM", "WebSocket Stream"],
  },
];

const ACTOR_LABELS: Record<FlowStep["actor"], string> = {
  admin: "Admin Action",
  system: "Automated System",
  visitor: "Visitor Interaction",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<string | null>("admin");
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
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setAnimatedStep(i);
      i++;
      if (i >= FLOW_STEPS.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const activeStepData = FLOW_STEPS.find((s) => s.id === activeStep);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-2">
      {/* ── Premium Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 shadow-xl border border-indigo-900/30">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-6 opacity-10">
          <Sparkles className="h-28 w-28 text-indigo-300" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div className="h-px w-16 bg-gradient-to-r from-indigo-500/60 to-transparent" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name || "Admin"}
            </h1>
            <p className="text-sm text-indigo-200/60 mt-1.5 max-w-lg">
              Manage your AI chatbots, view conversation metrics, train custom models, and analyze user interactions.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Active Chatbots",
            value: isLoading ? null : (stats?.active_chatbots ?? 0).toString(),
            icon: Bot,
            color: "text-violet-450 dark:text-violet-400",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20",
          },
          {
            label: "Conversations (24h)",
            value: isLoading ? null : (stats?.conversations_24h ?? 0).toString(),
            icon: MessageSquare,
            color: "text-indigo-450 dark:text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
          },
          {
            label: "Knowledge Docs",
            value: isLoading ? null : (stats?.knowledge_docs ?? 0).toString(),
            icon: BookOpen,
            color: "text-cyan-455 dark:text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/20",
          },
          {
            label: "Success Rate",
            value: isLoading ? null : stats?.success_rate ?? "100.0%",
            icon: BarChart3,
            color: "text-emerald-450 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`rounded-xl border ${card.border} ${card.bg} p-6 backdrop-blur-sm shadow-sm flex items-center justify-between gap-4`}
          >
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
              <div className="mt-2.5 flex items-center min-h-[36px]">
                {card.value === null ? (
                  <Loader2 className="h-6 w-6 animate-spin text-slate-450" />
                ) : (
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {card.value}
                  </span>
                )}
              </div>
            </div>
            <div className={`h-11 w-11 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Pipeline Flow Diagram ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Section header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950/50 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Pipeline Flow</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Journey from document ingestion to cited AI response</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 px-3 py-1 rounded-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </div>
        </div>

        <div className="p-6 flex flex-col lg:flex-row gap-6">
          {/* Step List */}
          <div className="flex flex-col gap-0 flex-1 min-w-0">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isVisible = idx <= animatedStep;

              return (
                <div key={step.id} className="flex flex-col">
                  <button
                    onClick={() => setActiveStep(isActive ? null : step.id)}
                    className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-250 text-left cursor-pointer ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    } ${
                      isActive
                        ? `${step.bgColor} ${step.borderColor} shadow-sm`
                        : "border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    }`}
                    style={{ transition: `opacity 0.25s ${idx * 0.05}s, transform 0.25s ${idx * 0.05}s, background 0.15s, border 0.15s` }}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors duration-200 ${
                      isActive ? `${step.bgColor} ${step.borderColor} ${step.color}` : "bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500"
                    }`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold transition-colors duration-150 ${isActive ? step.color : "text-slate-850 dark:text-slate-200"}`}>
                          {step.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${step.badgeColor}`}>
                          {ACTOR_LABELS[step.actor]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{step.sublabel}</p>
                    </div>

                    <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 transition-colors duration-200 ${isActive ? step.color : "text-slate-350 dark:text-slate-800"}`} />
                  </button>

                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="flex justify-start pl-8 py-0.5">
                      <ArrowDown className="h-4 w-4 text-slate-300 dark:text-slate-800" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="w-full lg:w-80 shrink-0">
            {activeStepData ? (
              <div className={`rounded-xl border p-5 h-full flex flex-col gap-4 transition-all duration-200 ${activeStepData.bgColor} ${activeStepData.borderColor}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${activeStepData.bgColor} ${activeStepData.borderColor} ${activeStepData.color}`}>
                    <activeStepData.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold ${activeStepData.color}`}>{activeStepData.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{activeStepData.sublabel}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">{activeStepData.detail}</p>

                {activeStepData.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {activeStepData.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${activeStepData.badgeColor}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-5 h-full flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Select a step</p>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-[200px]">
                    Click any step in the flow to see what happens under the hood.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer legend */}
        <div className="flex items-center gap-6 px-6 py-3.5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/30 flex-wrap">
          {[
            { color: "bg-violet-500", label: "Admin Action" },
            { color: "bg-slate-400 dark:bg-slate-600", label: "Automated Pipeline" },
            { color: "bg-cyan-500", label: "Visitor Action" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className={`h-2 w-2 rounded-full ${color}`} />
              {label}
            </div>
          ))}
          <div className="ml-auto text-xs text-slate-450 dark:text-slate-650 font-semibold">
            {FLOW_STEPS.length} pipeline stages
          </div>
        </div>
      </div>
    </div>
  );
}
