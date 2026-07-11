"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, Paperclip, MoreVertical, Search, FileText, Globe, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ChatbotPreviewProps {
  name: string;
  avatarUrl: string | null;
  greetingMessage: string;
  fallbackMessage?: string;
  tone: string;
  widgetColor?: string;
  widgetTheme?: string;
}

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  citations?: { type: "file" | "url"; name: string; label: string }[];
  isSearching?: boolean;
}

export default function ChatbotPreview({
  name,
  avatarUrl,
  greetingMessage,
  fallbackMessage,
  tone,
  widgetColor = "#6366f1",
  widgetTheme = "dark",
}: ChatbotPreviewProps) {
  const isLight = widgetTheme === "light";
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toneResponses: Record<string, string> = {
    friendly: "Sure, let me check that for you! 😊 Gaya has fantastic historical landmarks, such as Vishnupad Temple and Thaiya hills. Here are some verified sources I retrieved for you:",
    professional: "According to the verified database documents, Gaya features prominent cultural sites including Vishnupad Mandir. Refer to the retrieved documentation below:",
    casual: "Alright, checking the docs for you! Gaya has cool places like Vishnupad Mandir. Checked these sources:",
    formal: "Based upon the authenticated catalog data, Gaya hosts historical architecture such as the Vishnupad Temple. The references are detailed below:",
  };

  // Reset chat thread and append default welcome message on configurations change
  useEffect(() => {
    setMessages([
      {
        id: "greeting",
        sender: "bot",
        text: greetingMessage.trim() || "Hello! How can I help you today?",
      },
    ]);
  }, [greetingMessage]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessageText = inputValue.trim();
    setInputValue("");

    // Append User Message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: userMessageText,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate RAG Search Ingestion Loader
    setIsTyping(true);

    setTimeout(() => {
      // Append Bot response containing tone-specific text and citations
      const botResponseText = toneResponses[tone] || toneResponses.friendly;
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: botResponseText,
        citations: [
          { type: "file", name: "gaya_guide.pdf", label: "[1] gaya_guide.pdf" },
          { type: "url", name: "history_of_gaya.html", label: "[2] history_of_gaya.html" },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Card 
      className="shadow-xl border overflow-hidden max-w-[350px] w-full mx-auto min-h-[500px] flex flex-col justify-between rounded-2xl transition-all duration-300"
      style={{
        borderColor: isLight ? "#e2e8f0" : "#1e293b",
        backgroundColor: isLight ? "#ffffff" : "#0b0f19",
        color: isLight ? "#0f172a" : "#ffffff",
      }}
    >
      {/* Header mockup */}
      <div 
        className="p-4 border-b flex items-center justify-between gap-3"
        style={{
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
          borderColor: isLight ? "#e2e8f0" : "#1e293b",
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 overflow-hidden"
            style={{
              backgroundColor: `${widgetColor}15`,
              borderColor: `${widgetColor}30`,
              color: widgetColor,
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={avatarUrl} 
                alt={name || "Bot"} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Bot className="h-5 w-5" />
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-extrabold truncate" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
              {name || "Gaya Ji Bot"}
            </p>
            <p className="text-[10px] flex items-center gap-1 font-semibold" style={{ color: isLight ? "#64748b" : "#64748b" }}>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              AI Agent • Active
            </p>
          </div>
        </div>
        <button className="text-slate-450 hover:text-slate-200">
          <MoreVertical className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Messages Body */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto min-h-[300px]"
        style={{
          backgroundColor: isLight ? "#f8fafc" : "#070a13",
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "bot" && (
              <div 
                className="h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${widgetColor}15`,
                  borderColor: `${widgetColor}30`,
                  color: widgetColor,
                }}
              >
                <Bot className="h-4 w-4" />
              </div>
            )}
            
            <div className="space-y-2 flex-1 max-w-[85%]">
              <div 
                className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm ${
                  msg.sender === "user" 
                    ? "rounded-tr-none text-white font-bold" 
                    : "rounded-tl-none border"
                }`}
                style={{
                  backgroundColor: msg.sender === "user" ? widgetColor : (isLight ? "#ffffff" : "#111827"),
                  borderColor: msg.sender === "user" ? "transparent" : (isLight ? "#e2e8f0" : "#1f2937"),
                  color: msg.sender === "user" ? "#ffffff" : (isLight ? "#1f2937" : "#f3f4f6"),
                }}
              >
                {msg.text}

                {/* Injected Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Search className="h-3 w-3 text-indigo-400" /> Verified Sources
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.citations.map((cit, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 text-[9px] font-bold text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                        >
                          {cit.type === "file" ? (
                            <FileText className="h-2.5 w-2.5 text-red-400" />
                          ) : (
                            <Globe className="h-2.5 w-2.5 text-emerald-400" />
                          )}
                          {cit.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loader Simulation */}
        {isTyping && (
          <div className="flex items-start gap-2.5 justify-start">
            <div 
              className="h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
              style={{
                backgroundColor: `${widgetColor}15`,
                borderColor: `${widgetColor}30`,
                color: widgetColor,
              }}
            >
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl rounded-tl-none border bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Searching sources...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Mockup Form */}
      <form 
        onSubmit={handleSend}
        className="p-3 border-t flex items-center gap-2"
        style={{
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
          borderColor: isLight ? "#e2e8f0" : "#1e293b",
        }}
      >
        <button type="button" className="p-2 text-slate-400 hover:text-slate-200">
          <Paperclip className="h-4.5 w-4.5" />
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 border rounded-xl px-3.5 py-2.5 text-xs outline-none font-semibold focus:ring-1"
          style={{
            backgroundColor: isLight ? "#f8fafc" : "#070a13",
            borderColor: isLight ? "#cbd5e1" : "#1e293b",
            color: isLight ? "#0f172a" : "#f3f4f6",
            focusRingColor: widgetColor,
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="p-2.5 rounded-xl text-white opacity-90 hover:opacity-100 transition duration-150 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: widgetColor,
          }}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </Card>
  );
}
