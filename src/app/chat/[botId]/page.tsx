"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Bot, Send, Loader2, AlertCircle, PhoneCall } from "lucide-react";
import { publicChatService, PublicBot, CitationItem } from "@/services/public_chat";
import MessageCitations from "@/components/MessageCitations";
import FeedbackComponent from "@/components/FeedbackComponent";

export default function GuestChatPage() {
  const params = useParams();
  const botId = params?.botId as string;

  const [bot, setBot] = useState<PublicBot | null>(null);
  const [messages, setMessages] = useState<Array<{ id?: string; sender: string; content: string; time?: string; citations?: CitationItem[]; escalation_eligible?: boolean }>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // UI states
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingBot, setIsLoadingBot] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isReplying]);

  // Load bot public details & initialize conversation
  useEffect(() => {
    if (!botId) return;

    async function initChat() {
      try {
        // 1. Fetch public bot info
        const botRes = await publicChatService.getPublicBot(botId);
        if (!botRes.success || !botRes.data) {
          setError(botRes.error?.message || "Bot not found or inactive.");
          setIsLoadingBot(false);
          return;
        }
        setBot(botRes.data);

        // 2. Initialize conversation session
        // Check if session already exists for this bot in localStorage
        const storageKey = `chat_session_${botId}`;
        const cachedSession = localStorage.getItem(storageKey);
        
        if (cachedSession) {
          const parsed = JSON.parse(cachedSession);
          setConversationId(parsed.conversation_id);
          // Insert initial welcome message
          setMessages([
            { sender: "bot", content: botRes.data.greeting_message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
        } else {
          const browserInfo = typeof window !== "undefined" ? {
            language: navigator.language,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          } : undefined;

          const sessionRes = await publicChatService.initializeSession(botId, browserInfo);
          if (sessionRes.success && sessionRes.data) {
            setConversationId(sessionRes.data.conversation_id);
            localStorage.setItem(storageKey, JSON.stringify({
              conversation_id: sessionRes.data.conversation_id,
              user_identifier: sessionRes.data.user_identifier
            }));
            setMessages([
              { sender: "bot", content: sessionRes.data.welcome_message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
          } else {
            setError(sessionRes.error?.message || "Failed to initialize conversation session.");
          }
        }
      } catch {
        setError("An unexpected error occurred while loading chat.");
      } finally {
        setIsLoadingBot(false);
      }
    }

    initChat();
  }, [botId]);

  // Handle message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversationId || isReplying) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      { sender: "user", content: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);

    setIsReplying(true);

    try {
      const res = await publicChatService.sendGuestMessage(conversationId, userText);
      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          { 
            id: res.data!.id,
            sender: "bot", 
            content: res.data!.content, 
            citations: res.data!.citations,
            escalation_eligible: res.data!.escalation_eligible,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", content: "Sorry, I encountered an error while processing your request. Please try again." }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", content: "A connection issue occurred. Please check your network." }
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  if (isLoadingBot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading chat session...</p>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Access Error</h3>
          <p className="text-sm text-slate-400 mb-6">{error || "This chatbot is currently offline."}</p>
        </div>
      </div>
    );
  }

  const isLight = bot.extra_config?.widget_theme === "light";
  const widgetColor = bot.extra_config?.widget_color || "#6366f1";

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-300"
      style={{
        backgroundColor: isLight ? "#f8fafc" : "#020617",
      }}
    >
      <div 
        className="max-w-[480px] w-full border sm:rounded-2xl shadow-xl overflow-hidden h-screen sm:h-[680px] flex flex-col justify-between"
        style={{
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
          borderColor: isLight ? "#e2e8f0" : "#1e293b",
          color: isLight ? "#0f172a" : "#ffffff",
        }}
      >
        
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center gap-3 shrink-0"
          style={{
            backgroundColor: isLight ? "#f1f5f9" : "#1e293b",
            borderColor: isLight ? "#e2e8f0" : "#334155",
          }}
        >
          <div 
            className="h-10 w-10 rounded-2xl flex items-center justify-center border shrink-0 overflow-hidden"
            style={{
              backgroundColor: `${widgetColor}20`,
              borderColor: `${widgetColor}20`,
              color: widgetColor,
            }}
          >
            {bot.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bot.avatar_url} alt={bot.name} className="h-full w-full object-cover" />
            ) : (
              <Bot className="h-6 w-6" />
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold truncate" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>{bot.name}</h2>
            <p className="text-[10px] flex items-center gap-1.5 font-medium" style={{ color: isLight ? "#475569" : "#94a3b8" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </p>
          </div>
        </div>

        {/* Message Logs */}
        <div 
          className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col"
          style={{
            backgroundColor: isLight ? "#f8fafc" : "#020617",
          }}
        >
          {messages.map((msg, i) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={i}
                className={`flex gap-2.5 max-w-[85%] ${
                  isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-xl shrink-0 flex items-center justify-center text-xs border`}
                  style={{
                    backgroundColor: isBot ? `${widgetColor}10` : (isLight ? "#e2e8f0" : "#334155"),
                    borderColor: isBot ? `${widgetColor}20` : (isLight ? "#cbd5e1" : "#1e293b"),
                    color: isBot ? widgetColor : (isLight ? "#0f172a" : "#ffffff"),
                  }}
                >
                  {isBot ? <Bot className="h-3.5 w-3.5" /> : <span className="font-bold">G</span>}
                </div>
                <div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border`}
                    style={
                      isBot
                        ? {
                            backgroundColor: isLight ? "#ffffff" : "#0f172a",
                            borderColor: isLight ? "#e2e8f0" : "#1e293b",
                            color: isLight ? "#0f172a" : "#e2e8f0",
                            borderTopLeftRadius: 0,
                          }
                        : {
                            backgroundColor: widgetColor,
                            borderColor: widgetColor,
                            color: "#ffffff",
                            borderTopRightRadius: 0,
                          }
                    }
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    {isBot && <MessageCitations citations={msg.citations} />}
                    {isBot && msg.id && conversationId && (
                      <FeedbackComponent
                        conversationId={conversationId}
                        messageId={msg.id}
                      />
                    )}
                  </div>
                  {isBot && msg.escalation_eligible && (
                    <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="border rounded-xl px-3 py-2.5" style={{ backgroundColor: isLight ? "#fffbeb" : "rgba(120,53,4,0.1)", borderColor: isLight ? "#fef3c7" : "rgba(180,83,9,0.2)" }}>
                        <p className="text-[10px] mb-2 font-medium" style={{ color: isLight ? "#b45309" : "#fbbf24" }}>
                          It looks like you might need extra help.
                        </p>
                        <a
                          href="tel:"
                          className="flex items-center gap-1.5 active:scale-95 text-[10px] font-bold px-3 py-1.5 rounded-lg transition w-fit cursor-pointer text-white"
                          style={{
                            backgroundColor: widgetColor,
                          }}
                        >
                          <PhoneCall className="h-3 w-3" />
                          Talk to an Agent
                        </a>
                      </div>
                    </div>
                  )}
                  {msg.time && (
                    <span className="block text-[8px] text-slate-500 mt-1 pl-1">
                      {msg.time}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isReplying && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
              <div 
                className="h-7 w-7 rounded-xl shrink-0 flex items-center justify-center border"
                style={{
                  backgroundColor: `${widgetColor}10`,
                  borderColor: `${widgetColor}20`,
                  color: widgetColor,
                }}
              >
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div 
                className="border rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5"
                style={{
                  backgroundColor: isLight ? "#ffffff" : "#0f172a",
                  borderColor: isLight ? "#e2e8f0" : "#1e293b",
                  color: isLight ? "#475569" : "#94a3b8",
                }}
              >
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form 
          onSubmit={handleSendMessage} 
          className="p-3 border-t flex gap-2 shrink-0"
          style={{
            backgroundColor: isLight ? "#ffffff" : "#0f172a",
            borderColor: isLight ? "#e2e8f0" : "#1e293b",
          }}
        >
          <input
            type="text"
            required
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isReplying}
            className="flex-1 border rounded-xl px-4 py-2.5 text-xs placeholder-slate-500 outline-none transition disabled:opacity-50"
            style={{
              backgroundColor: isLight ? "#f8fafc" : "#020617",
              borderColor: isLight ? "#cbd5e1" : "#1e293b",
              color: isLight ? "#0f172a" : "#f8fafc",
            }}
          />
          <button
            type="submit"
            disabled={isReplying || !inputMessage.trim()}
            className="active:scale-95 disabled:scale-100 p-2.5 rounded-xl text-white transition flex items-center justify-center disabled:opacity-50 shrink-0 cursor-pointer"
            style={{
              backgroundColor: widgetColor,
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
