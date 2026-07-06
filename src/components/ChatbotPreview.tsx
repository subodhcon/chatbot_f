"use client";

import React from "react";
import { Bot, Sparkles } from "lucide-react";
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

export default function ChatbotPreview({
  name,
  avatarUrl,
  greetingMessage,
  fallbackMessage,
  tone,
  widgetColor = "#6366f1",
  widgetTheme = "dark",
}: ChatbotPreviewProps) {
  // Tone Options list for mapping examples
  const toneExamples: Record<string, string> = {
    friendly: "Hi there! I'd love to help you out today! 😊",
    professional: "Greetings. Please let me know how I may assist you today.",
    casual: "Hey! What's up? Ask me anything.",
    formal: "Welcome. Please state your inquiry so that I may provide assistance.",
  };

  const isLight = widgetTheme === "light";

  return (
    <Card 
      className="shadow-sm border overflow-hidden max-w-[340px] w-full mx-auto min-h-[460px] flex flex-col justify-between"
      style={{
        borderColor: isLight ? "#e2e8f0" : "#1e293b",
        backgroundColor: isLight ? "#ffffff" : "#0f172a",
        color: isLight ? "#0f172a" : "#ffffff",
      }}
    >
      {/* Phone Mockup Header */}
      <div 
        className="p-4 border-b flex items-center gap-3"
        style={{
          backgroundColor: isLight ? "#f1f5f9" : "#1e293b",
          borderColor: isLight ? "#e2e8f0" : "#334155",
        }}
      >
        <div 
          className="h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 overflow-hidden"
          style={{
            backgroundColor: `${widgetColor}20`,
            borderColor: `${widgetColor}20`,
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
          <p className="text-sm font-bold truncate" style={{ color: isLight ? "#0f172a" : "#white" }}>{name || "Preview Assistant"}</p>
          <p className="text-[10px] flex items-center gap-1 font-medium" style={{ color: isLight ? "#475569" : "#94a3b8" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online • Tone: <span className="font-mono" style={{ color: widgetColor }}>{tone}</span>
          </p>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div 
        className="flex-1 p-4 space-y-4 overflow-y-auto flex flex-col justify-end min-h-[285px]"
        style={{
          backgroundColor: isLight ? "#f8fafc" : "#020617",
        }}
      >
        {/* Greeting Bubble */}
        <div className="flex items-start gap-2.5 max-w-[85%]">
          <div 
            className="h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
            style={{
              backgroundColor: `${widgetColor}10`,
              borderColor: `${widgetColor}20`,
              color: widgetColor,
            }}
          >
            <Bot className="h-4 w-4" />
          </div>
          <div 
            className="p-3 rounded-2xl rounded-tl-none border text-xs leading-relaxed shadow-sm"
            style={{
              backgroundColor: isLight ? "#ffffff" : "#0f172a",
              borderColor: isLight ? "#e2e8f0" : "#1e293b",
              color: isLight ? "#0f172a" : "#e2e8f0",
            }}
          >
            {greetingMessage.trim() || "No welcome message configured yet."}
          </div>
        </div>

        {/* Tone Example */}
        <div className="flex items-start gap-2.5 max-w-[85%]">
          <div 
            className="h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
            style={{
              backgroundColor: `${widgetColor}10`,
              borderColor: `${widgetColor}20`,
              color: widgetColor,
            }}
          >
            <Bot className="h-4 w-4" />
          </div>
          <div 
            className="p-3 rounded-2xl rounded-tl-none border text-xs leading-relaxed shadow-sm"
            style={{
              backgroundColor: isLight ? "#ffffff" : "#0f172a",
              borderColor: isLight ? "#e2e8f0" : "#1e293b",
              color: isLight ? "#475569" : "#94a3b8",
            }}
          >
            <span className="text-[10px] font-semibold block mb-1" style={{ color: widgetColor }}>Tone preview statement:</span>
            {toneExamples[tone] || toneExamples.friendly}
          </div>
        </div>

        {/* Fallback Example preview */}
        {fallbackMessage && fallbackMessage.trim() && (
          <div className="flex items-start gap-2.5 max-w-[85%] opacity-60">
            <div 
              className="h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
              style={{
                backgroundColor: `${widgetColor}10`,
                borderColor: `${widgetColor}20`,
                color: widgetColor,
              }}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div 
              className="p-3 rounded-2xl rounded-tl-none border text-xs leading-relaxed shadow-sm"
              style={{
                backgroundColor: isLight ? "#ffffff" : "#0f172a",
                borderColor: isLight ? "#e2e8f0" : "#1e293b",
                color: isLight ? "#475569" : "#94a3b8",
              }}
            >
              <span className="text-[10px] font-semibold block mb-1" style={{ color: widgetColor }}>Fallback scenario:</span>
              {fallbackMessage.trim()}
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Field mockup */}
      <div 
        className="p-3 border-t flex gap-2"
        style={{
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
          borderColor: isLight ? "#e2e8f0" : "#1e293b",
        }}
      >
        <input
          type="text"
          disabled
          placeholder="Ask a question..."
          className="flex-1 border rounded-xl px-3 py-2 text-xs outline-none cursor-not-allowed"
          style={{
            backgroundColor: isLight ? "#f8fafc" : "#020617",
            borderColor: isLight ? "#cbd5e1" : "#1e293b",
            color: isLight ? "#0f172a" : "#94a3b8",
          }}
        />
        <button
          type="button"
          disabled
          className="p-2 rounded-xl text-white opacity-50 cursor-not-allowed"
          style={{
            backgroundColor: widgetColor,
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
