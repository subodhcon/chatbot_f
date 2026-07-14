"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Check, 
  AlertCircle, 
  Loader2, 
  MessageSquare, 
  Smile,
  Plus,
  Trash2,
  FolderPlus,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { botService, Bot as BotType } from "@/services/bot";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatbotPreview from "@/components/ChatbotPreview";

interface PageProps {
  params: Promise<{ botId: string }>;
}

export default function BotConfigPage({ params }: PageProps) {
  const { botId } = use(params);
  const router = useRouter();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bot Info State (for header/breadcrumbs)
  const [bot, setBot] = useState<BotType | null>(null);

  // Form Field States
  const [greetingMessage, setGreetingMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [tone, setTone] = useState("friendly");
  const [widgetColor, setWidgetColor] = useState("#f59e0b");
  const [widgetTheme, setWidgetTheme] = useState("dark");
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [useCustomMongo, setUseCustomMongo] = useState(false);
  const [mongoUri, setMongoUri] = useState("");
  const [mongoDbName, setMongoDbName] = useState("");

  // Live Validation States
  const [greetingError, setGreetingError] = useState<string | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  // Tone Options list
  const toneOptions = [
    { value: "friendly", label: "Friendly", desc: "Warm, helper tone, uses emojis naturally", example: "Hi there! I'd love to help you out today! 😊" },
    { value: "professional", label: "Professional", desc: "Polite, clear, business-appropriate", example: "Greetings. Please let me know how I may assist you today." },
    { value: "casual", label: "Casual", desc: "Relaxed, informal, conversational", example: "Hey! What's up? Ask me anything." },
    { value: "formal", label: "Formal", desc: "Structured, highly respectful, objective", example: "Welcome. Please state your inquiry so that I may provide assistance." },
  ];

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

  // Initial Data Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch bot info and configuration in parallel
      const [botResponse, configResponse] = await Promise.all([
        botService.getBot(botId),
        botService.getBotConfig(botId),
      ]);

      if (botResponse.success && botResponse.data) {
        setBot(botResponse.data);
      } else {
        setError(botResponse.error?.message || "Failed to load bot details.");
      }

      if (configResponse.success && configResponse.data) {
        const config = configResponse.data;
        setGreetingMessage(config.welcome_message || "");
        setFallbackMessage(config.fallback_message || "");
        setTone(config.tone || "friendly");
        setUseCustomMongo(config.use_custom_mongo || false);
        setMongoUri(config.mongo_uri || "");
        setMongoDbName(config.mongo_db_name || "");
        const extra = config.extra_config || {};
        setWidgetColor(extra.widget_color || "#f59e0b");
        setWidgetTheme(extra.widget_theme || "dark");
        setQuickLinks(extra.quick_links || []);
      } else {
        setError(configResponse.error?.message || "Failed to load bot configuration.");
      }
    } catch {
      setError("An unexpected network error occurred while loading settings.");
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Live validation for Greeting Message
  const handleGreetingChange = (val: string) => {
    setGreetingMessage(val);
    if (!val.trim()) {
      setGreetingError("Greeting message is required.");
    } else if (val.length > 300) {
      setGreetingError("Greeting message cannot exceed 300 characters.");
    } else {
      setGreetingError(null);
    }
  };

  // Live validation for Fallback Message
  const handleFallbackChange = (val: string) => {
    setFallbackMessage(val);
    if (!val.trim()) {
      setFallbackError("Fallback message is required.");
    } else if (val.length > 300) {
      setFallbackError("Fallback message cannot exceed 300 characters.");
    } else {
      setFallbackError(null);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Re-validate before submit
    if (!greetingMessage.trim()) {
      setGreetingError("Greeting message is required.");
      return;
    }
    if (!fallbackMessage.trim()) {
      setFallbackError("Fallback message is required.");
      return;
    }

    if (greetingError || fallbackError) return;

    setSaving(true);
    setError(null);
    try {
      const response = await botService.updateBotConfig(botId, {
        greeting_message: greetingMessage.trim(),
        fallback_message: fallbackMessage.trim(),
        tone,
        use_custom_mongo: useCustomMongo,
        mongo_uri: mongoUri.trim(),
        mongo_db_name: mongoDbName.trim(),
        extra_config: {
          widget_color: widgetColor,
          widget_theme: widgetTheme,
          quick_links: quickLinks,
        }
      });

      if (response.success) {
        setSuccess("Configuration settings saved and snapshot created!");
      } else {
        setError(response.error?.message || "Failed to save configuration.");
      }
    } catch {
      setError("Failed to save due to a network connection issue.");
    } finally {
      setSaving(false);
    }
  };

  const hasValidationErrors = !!greetingError || !!fallbackError || !greetingMessage.trim() || !fallbackMessage.trim();

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-2">
      {/* Toast Messages */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
        {success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 border border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-5">
            <Check className="h-5 w-5 shrink-0 text-emerald-500" />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-800 border border-rose-250 dark:bg-rose-95/30 dark:text-rose-450 dark:border-rose-900 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}
      </div>

      {/* ── Premium Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 shadow-xl border border-indigo-900/30">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300/70 uppercase tracking-wider">
            <Link href="/bots" className="hover:text-white transition">Chatbots</Link>
            <span>/</span>
            <span className="text-white truncate">{bot?.name || "Loading..."}</span>
            <span>/</span>
            <span className="text-indigo-400">Settings</span>
          </div>

          <div className="flex items-center gap-4 mt-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/bots")}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Bot Settings</h1>
              <p className="text-sm text-indigo-200/60 mt-1">
                Configure greetings, fallback scenarios, widgets, and custom MongoDB parameters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        // Skeleton view while loading settings
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="h-6 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-24 w-full rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-20 w-full rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse h-[320px]" />
          </div>
        </div>
      ) : (
        // Main Config Interface
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit}>
              <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-500" />
                    Conversational Setup
                  </CardTitle>
                  <CardDescription>
                    Adjust greeting hooks and default parameters when your bot interacts with users.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">

                  {/* Greeting Message */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Greeting Message *
                        </label>
                        <button
                          type="button"
                          onClick={() => handleGreetingChange("Welcome to Pinddaan Gaya Information Assistant. How can I help you today with rituals, list of Panda Ji, hotels, or route guidelines? 🙏")}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-150 dark:border-indigo-900/40"
                        >
                          Suggest Gaya Ji
                        </button>
                      </div>
                      <span className={`text-[10px] font-mono ${
                        greetingMessage.length > 270 ? "text-red-500 font-bold" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {greetingMessage.length} / 300
                      </span>
                    </div>
                    <textarea
                      value={greetingMessage}
                      onChange={(e) => handleGreetingChange(e.target.value)}
                      placeholder="Welcome visitors to the chat (e.g. Hello! How can I help you today?)"
                      rows={3}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:bg-slate-950 dark:text-white transition leading-relaxed ${
                        greetingError ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {greetingError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {greetingError}
                      </p>
                    )}
                  </div>

                  {/* Fallback Message */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Fallback Message *
                        </label>
                        <button
                          type="button"
                          onClick={() => handleFallbackChange("I apologize, but I could not find that specific detail in our official pilgrimage guide. Please contact the Help Line at 9266628168 or check directly with the lodging house committee. 🚩")}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-150 dark:border-indigo-900/40"
                        >
                          Suggest Gaya Ji
                        </button>
                      </div>
                      <span className={`text-[10px] font-mono ${
                        fallbackMessage.length > 270 ? "text-red-500 font-bold" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {fallbackMessage.length} / 300
                      </span>
                    </div>
                    <textarea
                      value={fallbackMessage}
                      onChange={(e) => handleFallbackChange(e.target.value)}
                      placeholder="Sent when the AI agent does not find answers (e.g. I am sorry, I do not understand. Let me get a human.)"
                      rows={3}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:bg-slate-950 dark:text-white transition leading-relaxed ${
                        fallbackError ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {fallbackError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {fallbackError}
                      </p>
                    )}
                  </div>

                  {/* Tone Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Personality Tone *
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {toneOptions.map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => setTone(opt.value)}
                          className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col gap-1 relative ${
                            tone === opt.value
                              ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20"
                              : "border-slate-200 hover:border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-800"
                          }`}
                        >
                          {tone === opt.value && (
                            <span className="absolute top-3 right-3 h-5 w-5 bg-indigo-500 text-white rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Smile className="h-4 w-4 text-indigo-500" />
                            {opt.label}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {opt.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-6" />

                  {/* Custom Widget Styling Form Fields */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        Widget Styling Customization
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Customize themes and primary colors to match your brand styling.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Primary Color Picker */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Primary Theme Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={widgetColor}
                            onChange={(e) => setWidgetColor(e.target.value)}
                            className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent p-1"
                          />
                          <input
                            type="text"
                            value={widgetColor}
                            onChange={(e) => setWidgetColor(e.target.value)}
                            placeholder="#f59e0b"
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm outline-none focus:border-indigo-500 dark:bg-slate-950 dark:text-white dark:border-slate-800"
                          />
                        </div>
                      </div>

                      {/* Theme Mode Toggle selector */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Widget Theme Mode
                        </label>
                        <select
                          value={widgetTheme}
                          onChange={(e) => setWidgetTheme(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:bg-slate-950 dark:text-white dark:border-slate-800"
                        >
                          <option value="dark">Dark Theme</option>
                          <option value="light">Light Theme</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* MongoDB Atlas Integration Section */}
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-6" />

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        MongoDB Atlas Integration (Advanced)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Store conversation logs, document chunks, and search history in your custom MongoDB database.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Checkbox toggle */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomMongo}
                          onChange={(e) => setUseCustomMongo(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Use Custom MongoDB Database for this chatbot
                        </span>
                      </label>

                      {useCustomMongo && (
                        <div className="grid gap-4 sm:grid-cols-2 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Connection URI input */}
                          <div className="space-y-2 sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              MongoDB Connection URI *
                            </label>
                            <input
                              type="text"
                              value={mongoUri}
                              onChange={(e) => setMongoUri(e.target.value)}
                              placeholder="mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:bg-slate-950 dark:text-white dark:border-slate-800"
                            />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              For security, this connection string is encrypted at rest using AES-256 Fernet encryption.
                            </p>
                          </div>

                          {/* Database Name input */}
                          <div className="space-y-2 sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Database Name *
                            </label>
                            <input
                              type="text"
                              value={mongoDbName}
                              onChange={(e) => setMongoDbName(e.target.value)}
                              placeholder="chatbot_data"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:bg-slate-950 dark:text-white dark:border-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-6" />

                  {/* Quick Links Configurator Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        Quick Links Menu Configurator
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Configure quick action cards that users can click inside the chatbot menu (e.g. &quot;Careers&quot;, &quot;Connect&quot;).
                      </p>
                    </div>

                    <div className="space-y-4">
                      {quickLinks.map((category, catIdx) => (
                        <div key={catIdx} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
                          <div className="flex justify-between items-center gap-4">
                            <input
                              type="text"
                              value={category.section_title || ""}
                              onChange={(e) => {
                                const updated = [...quickLinks];
                                updated[catIdx].section_title = e.target.value;
                                setQuickLinks(updated);
                              }}
                              placeholder="Category Name (e.g. Connect)"
                              className="flex-1 font-bold text-sm bg-transparent border-b border-slate-300 dark:border-slate-700 outline-none pb-1 text-slate-900 dark:text-white focus:border-indigo-500"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = quickLinks.filter((_, idx) => idx !== catIdx);
                                setQuickLinks(updated);
                              }}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 w-8 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {category.items?.map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg p-3 space-y-2.5 relative group">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-1 flex-1">
                                    <input
                                      type="text"
                                      value={item.label || ""}
                                      onChange={(e) => {
                                        const updated = [...quickLinks];
                                        updated[catIdx].items[itemIdx].label = e.target.value;
                                        setQuickLinks(updated);
                                      }}
                                      placeholder="Card Label"
                                      className="w-full font-bold text-xs bg-transparent border-none outline-none text-slate-900 dark:text-white"
                                    />
                                    <input
                                      type="text"
                                      value={item.desc || ""}
                                      onChange={(e) => {
                                        const updated = [...quickLinks];
                                        updated[catIdx].items[itemIdx].desc = e.target.value;
                                        setQuickLinks(updated);
                                      }}
                                      placeholder="Card Subtext"
                                      className="w-full text-[10px] text-slate-400 bg-transparent border-none outline-none"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const updated = [...quickLinks];
                                      updated[catIdx].items = updated[catIdx].items.filter((_: any, idx: number) => idx !== itemIdx);
                                      setQuickLinks(updated);
                                    }}
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-900">
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Trigger Query</span>
                                    <input
                                      type="text"
                                      value={item.query || ""}
                                      onChange={(e) => {
                                        const updated = [...quickLinks];
                                        updated[catIdx].items[itemIdx].query = e.target.value;
                                        setQuickLinks(updated);
                                      }}
                                      placeholder="User question text"
                                      className="w-full text-[10px] bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-300"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Lucide Icon</span>
                                    <select
                                      value={item.icon || "HelpCircle"}
                                      onChange={(e) => {
                                        const updated = [...quickLinks];
                                        updated[catIdx].items[itemIdx].icon = e.target.value;
                                        setQuickLinks(updated);
                                      }}
                                      className="w-full text-[10px] bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-300"
                                    >
                                      <option value="Calendar">Calendar</option>
                                      <option value="Briefcase">Careers (Briefcase)</option>
                                      <option value="Layers">AI & ML (Layers)</option>
                                      <option value="LayoutGrid">Blockchain</option>
                                      <option value="Monitor">Web & Mobile</option>
                                      <option value="Cloud">DevOps (Cloud)</option>
                                      <option value="Eye">AR/VR (Eye)</option>
                                      <option value="Cpu">IoT (Cpu)</option>
                                      <option value="Gamepad2">Gaming</option>
                                      <option value="Shield">Cybersecurity</option>
                                      <option value="ShoppingBag">Shopping Bag</option>
                                      <option value="HelpCircle">Help Circle</option>
                                      <option value="Phone">Phone</option>
                                      <option value="Globe">Globe</option>
                                      <option value="Mail">Mail</option>
                                      <option value="Info">Info</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = [...quickLinks];
                                if (!updated[catIdx].items) updated[catIdx].items = [];
                                updated[catIdx].items.push({
                                  label: "New Card",
                                  desc: "Description text",
                                  query: "What is Confluxaa?",
                                  icon: "HelpCircle"
                                });
                                setQuickLinks(updated);
                              }}
                              className="border-dashed border-slate-300 hover:border-indigo-500 text-xs font-semibold h-24 flex flex-col items-center justify-center gap-1.5 rounded-lg transition"
                            >
                              <Plus className="h-4 w-4 text-slate-400" />
                              Add Card
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuickLinks([...quickLinks, { section_title: "New Category", items: [] }]);
                          }}
                          className="text-xs font-bold gap-1.5"
                        >
                          <FolderPlus className="h-4 w-4" />
                          Add Category
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuickLinks([
                              {
                                section_title: "Pinddaan Gaya & Rituals",
                                items: [
                                  { label: "About Pinddaan", query: "What is Pinddaan Gaya?", desc: "Learn about Pitripaksh rituals", icon: "BookOpen" },
                                  { label: "Daily Rituals", query: "What are the daily rituals in Pitripaksh Mela?", desc: "Pooja timings & rules", icon: "Clock" },
                                  { label: "List of Vedies", query: "Where are the Vedies for Pinddaan in Gaya?", desc: "Important holy sites", icon: "Layers" }
                                ]
                              },
                              {
                                section_title: "Facilities & Services",
                                items: [
                                  { label: "List of Panda Ji", query: "How to contact Panda Ji for rituals?", desc: "Panda Ji details", icon: "Users" },
                                  { label: "Where to Stay", query: "Where to stay in Gaya? List hotels & accommodation", desc: "Hotels & Tent cities", icon: "Home" },
                                  { label: "How to Reach", query: "How to reach Gaya? Railway & Airport guides", desc: "Transport timetable", icon: "Globe" }
                                ]
                              },
                              {
                                section_title: "Sight Seeing & Support",
                                items: [
                                  { label: "Vishnupad Temple", query: "Tell me about Vishnupad Temple in Gaya", desc: "Historical highlights", icon: "Sparkles" },
                                  { label: "Mela Administration", query: "Who are the mela committee & administration helpers?", desc: "Lodging house committee", icon: "Shield" },
                                  { label: "Emergency Directory", query: "List of emergency numbers for Gaya Mela", desc: "Police & Hospital support", icon: "Phone" }
                                ]
                              }
                            ]);
                          }}
                          className="text-xs font-bold gap-1.5 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                        >
                          <Sparkles className="h-4 w-4" />
                          Apply Gaya Ji Tourism Template
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/bots")}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || hasValidationErrors}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[120px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>

          {/* Interactive Chat Mockup Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
              Live Customization Preview
            </h3>
            <ChatbotPreview
              name={bot?.name || ""}
              avatarUrl={bot?.avatar_url || null}
              greetingMessage={greetingMessage}
              fallbackMessage={fallbackMessage}
              tone={tone}
              widgetColor={widgetColor}
              widgetTheme={widgetTheme}
            />
          </div>
        </div>
      )}
    </div>
  );
}
