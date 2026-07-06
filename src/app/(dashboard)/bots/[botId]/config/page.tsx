"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Check, 
  AlertCircle, 
  Loader2, 
  MessageSquare, 
  Smile
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
  const [widgetColor, setWidgetColor] = useState("#6366f1");
  const [widgetTheme, setWidgetTheme] = useState("dark");

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
        const extra = config.extra_config || {};
        setWidgetColor(extra.widget_color || "#6366f1");
        setWidgetTheme(extra.widget_theme || "dark");
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
        extra_config: {
          widget_color: widgetColor,
          widget_theme: widgetTheme,
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
    <div className="space-y-6">
      {/* Toast Messages */}
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

      {/* Header / Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Link href="/bots" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition">
            Chatbots
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white truncate">{bot?.name || "Loading..."}</span>
          <span>/</span>
          <span className="text-slate-400 dark:text-slate-500">Settings</span>
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
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Bot Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure greetings, fallback scenarios, and conversational tone for your AI agent.
            </p>
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Greeting Message *
                      </label>
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Fallback Message *
                      </label>
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
                            placeholder="#6366f1"
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
